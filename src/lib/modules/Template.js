import { VM } from "vm2";
import config from "#config";
import { PermissionsBitField } from "discord.js";
import { Collection } from "@discordjs/collection";

import * as Util from "#lib/util.js";
import {
  CommandsManager,
  EventsManager,
  CurseManager,
  BossManager,
  DataManager,
  TimeEventsManager,
  ActionManager,
  QuestManager,
  GuildVariablesManager,
  StorageManager,
} from "#lib/modules/mod.js";

import * as PropertiesManager from "#lib/modules/Properties.js";

import { client } from "#bot/client.js";
import FileSystem from "fs";
import Discord from "discord.js";

function isConstruct(fn) {
  try {
    Reflect.construct(String, [], fn);
  } catch {
    return false;
  }
  return true;
}

/** Util class */
class CircularProtocol {
  collection = new Map();
  pass(element) {
    if (this.collection.has(element)) {
      return false;
    }

    this.collection.set(element, true);
  }
}

function inspectStructure(structure) {
  if (!structure) {
    return null;
  }

  const entries = Object.entries(
    Object.getOwnPropertyDescriptors(structure),
  ).map(([key, descriptor]) => {
    const output =
      "value" in descriptor
        ? descriptor.value
        : { getter: String(descriptor.get), setter: String(descriptor.set) };
    return [key, output];
  });

  return Object.fromEntries(entries);
}

class Template {
  constructor(source, context) {
    source.executer = context.client.users.resolve(source.executer);

    this.source = source;
    this.context = context;
  }

  async replaceAll(string) {
    const LIMIT = 10;

    const context = {
      before: string,
      currentIteration: 0,
    };
    do {
      context.before = string;
      string = await this.replace(string);

      context.currentIteration++;
    } while (string !== context.before || context.currentIteration > LIMIT);

    return string;
  }

  async replace(string) {
    const context = {
      nesting: [],
      inQuotes: null,
      exitCode: Symbol("exitCode"),
    };

    const special = {
      "{": (context, index) => context.nesting.push({ symbol: "{", index }),
      "}": (context) => {
        const brackets = context.nesting.filter(({ symbol }) => symbol === "{");
        const remove = () => context.nesting.pop();
        return brackets.length === 1 ? context.exitCode : remove();
      },
      '"': (context) => (context.inQuotes = '"'),
      "'": (context) => (context.inQuotes = "'"),
      "`": (context) => (context.inQuotes = "`"),
      "\\": (context) => (context.skipOnce = true),
    };

    for (const index in string) {
      const symbol = string[index];

      if (symbol in special === false) {
        continue;
      }

      if (context.skipOnce) {
        context.skipOnce = false;
        continue;
      }

      if (context.inQuotes === symbol) {
        context.inQuotes = false;
        continue;
      }

      const output = special[symbol].call(this, context, index);

      if (output === context.exitCode) {
        const openedBracket = context.nesting.find(
          ({ symbol }) => symbol === "{",
        );
        const content = string.slice(openedBracket.index, index + 1);
        const output = await this.getRegular(content.slice(1, -1));
        string = string.replace(content, output);
        break;
      }
    }

    return string;
  }

  createVM() {
    const MAX_TIMEOUT = 1_000;

    const vm = new VM({ timeout: MAX_TIMEOUT });
    this.makeSandbox(vm);
    return vm;
  }

  getPermissionsMask() {
    if (this.mask) {
      return this.mask;
    }

    const source = this.source;
    const context = this.context;
    const permissionsEnum = this.constructor.PERMISSIONS_MASK_ENUM;

    const isUser = !!source.executer;
    const isGuildManager =
      context.guild &&
      context.guild.members
        .resolve(source.executer)
        .permissions.has(PermissionsBitField.Flags.ManageGuild);
    const isDelevoper = config.developers.includes(source.executer.id);

    const mask =
      (isDelevoper * permissionsEnum.DEVELOPER) |
      (isGuildManager * permissionsEnum.GUILD_MANAGER) |
      (isUser * permissionsEnum.USER);

    this.mask = mask;
    return mask;
  }

  static PERMISSIONS_MASK_ENUM = {
    USER: 1,
    GUILD_MANAGER: 2,
    DEVELOPER: 7,
  };

  makeSandbox(vm) {
    const context = this.context;

    const modules = this.constructor.ModulesScope;
    const mask = this.getPermissionsMask();

    this.availableModulesList = modules
      .filter(({ filter }) => !filter || filter(context))
      .filter(
        ({ permissions }) => (permissions.scope & mask) === permissions.scope,
      );

    const availableList = Object.freeze(
      Object.fromEntries(
        modules.map(({ name }) =>
          this.availableModulesList.has(name) ? [name, true] : [name, false],
        ),
      ),
    );

    const moduleGetter = this.addModuleToSandbox.bind(this, vm);

    Object.defineProperty(vm.sandbox, "module", {
      value: moduleGetter,
      writable: false,
      configurable: false,
      enumerable: true,
    });

    Object.defineProperty(vm.sandbox, "availableList", {
      value: availableList,
      writable: false,
      configurable: false,
      enumerable: true,
    });

    return;
  }

  addModuleToSandbox(vm, moduleName) {
    const moduleEntity = this.constructor.ModulesScope.get(moduleName);
    if (!moduleEntity) {
      throw new TypeError(`Unknown: ${moduleName}`);
    }
    const { permissions } = moduleEntity;
    const availableList = vm.sandbox.availableList;

    if (moduleName in availableList === false) {
      throw new Error(`Does not exist next module: ${moduleName}`);
    }

    if (availableList[moduleName] === false) {
      const mask = this.getPermissionsMask();
      const missing = Object.entries(this.constructor.PERMISSIONS_MASK_ENUM)
        .filter(([_key, bit]) => permissions.scope === bit && !(mask & bit))
        .map(([key]) => key)
        .join(", ");

      throw new Error(
        `Missing permissions: ${missing} for taking a module ${moduleName}`,
      );
    }

    const content = moduleEntity.getContent(this.context);

    vm.sandbox[moduleName] = this.restrictContent(content, permissions);
    return vm.sandbox[moduleName];
  }

  restrictContent(content, permissions) {
    const mask = this.getPermissionsMask();

    const circular = new CircularProtocol();

    if (
      permissions.investigate &&
      (mask & permissions.investigate) !== permissions.investigate
    ) {
      const replacer = (_key, value) => {
        if (
          (typeof value === "function" || typeof value === "object") &&
          circular.pass(value) === false
        ) {
          return `[Circular* ${_key}]`;
        }

        if (typeof value === "function") {
          const staticList = inspectStructure(value);
          const prototype = inspectStructure(value["prototype"]);
          return isConstruct(value)
            ? { name: value.name, static: staticList, prototype }
            : value.toString();
        }

        if (value instanceof Array) {
          return JSON.stringify(value);
        }

        if (typeof value === "object") {
          return inspectStructure(value);
        }

        return value;
      };

      content = JSON.parse(JSON.stringify(content, replacer));
    }
    return content;
  }

  static ModulesScope = new Collection(
    Object.entries({
      interaction: {
        getContent: (context) => {
          return context;
        },
        name: "interaction",
        permissions: {
          scope: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
          investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      constants: {
        getContent: async () => (await import("#constants/mod.js")).Constants,
        name: "contants",
        permissions: {
          scope: this.PERMISSIONS_MASK_ENUM.USER,
          investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      CurrentGuildSpace: {
        getContent: (context) => new GuildVariablesManager(context.guild.data),
        name: "CurrentGuildSpace",
        permissions: {
          scope: this.PERMISSIONS_MASK_ENUM.GUILD_MANAGER,
        },
        filter: (context) => "guild" in context,
      },
      guildData: {
        getContent: (context) => context.guild.data,
        name: "guildData",
        permissions: {
          scope: this.PERMISSIONS_MASK_ENUM.GUILD_MANAGER,
          investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
        filter: (context) => "guild" in context,
      },
      userData: {
        getContent: (context) => context.user.data,
        name: "userData",
        permissions: {
          scope: this.PERMISSIONS_MASK_ENUM.USER,
          investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
        filter: (context) => "user" in context,
      },
      Util: {
        getContent: () =>
          Util.omit(Util, (key) =>
            [
              "GlitchText",
              "rangeToArray",
              "ending",
              "omit",
              "random",
              "sleep",
              "timestampDay",
              "timestampToDate",
              "resolveGithubPath",
              "yaml",
              "resolveDate",
            ].includes(key),
          ),
        name: "Util",
        permissions: {
          scope: this.PERMISSIONS_MASK_ENUM.USER,
          investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      CommandsManager: {
        getContent: () => CommandsManager,
        name: "CommandsManager",
        permissions: {
          scope: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
          investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      EventsManager: {
        getContent: () => EventsManager,
        name: "EventsManager",
        permissions: {
          scope: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
          investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      BossManager: {
        getContent: () => BossManager,
        name: "BossManager",
        permissions: {
          scope: this.PERMISSIONS_MASK_ENUM.USER,
          investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      CurseManager: {
        getContent: () => CurseManager,
        name: "CurseManager",
        permissions: {
          scope: this.PERMISSIONS_MASK_ENUM.USER,
          investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      DataManager: {
        getContent: () => DataManager,
        name: "DataManager",
        permissions: {
          scope: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
          investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      TimeEventsManager: {
        getContent: () => TimeEventsManager,
        name: "TimeEventsManager",
        permissions: {
          scope: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
          investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      ActionManager: {
        getContent: () => ActionManager,
        name: "ActionManager",
        permissions: {
          scope: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
          investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      QuestManager: {
        getContent: () => QuestManager,
        name: "QuestManager",
        permissions: {
          scope: this.PERMISSIONS_MASK_ENUM.USER,
          investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      GuildVariablesManager: {
        getContent: () => GuildVariablesManager,
        name: "GuildVariablesManager",
        permissions: {
          scope: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
          investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      PropertiesManager: {
        getContent: () => PropertiesManager,
        name: "PropertiesManager",
        permissions: {
          scope: this.PERMISSIONS_MASK_ENUM.USER,
          investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      StorageManager: {
        getContent: () => StorageManager,
        name: "StorageManager",
        permissions: {
          scope: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
          investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      Discord: {
        getContent: () => Discord,
        name: "Discord",
        permissions: {
          scope: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
          investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      client: {
        getContent: () => client,
        name: "client",
        permissions: {
          scope: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
          investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      process: {
        getContent: () => process,
        name: "process",
        permissions: {
          scope: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      FileSystem: {
        getContent: () => FileSystem,
        name: "FileSystem",
        permissions: {
          scope: this.PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
    }),
  );

  static sourceTypes = {
    /** Can be called independently from executer */
    involuntarily: "involuntarily",
    /** user directly call */
    call: "call",
    /** From counter */
    counter: "counter",
    /** From guild command */
    guildCommand: "guildCommand",
  };

  async getRegular(regular) {
    const vm = this.vm ?? this.createVM();
    const output = await vm.run(regular);

    return String(output);
  }

  async getFromScope(regular) {
    let func;
    const base = regular.template.base;

    const way = regular.reg.match(
      /(?:[^.]+?\(.+?\))($|(?=\.))|([a-z0-9]+)(?!=[(])/gim,
    );
    if (!way) return `\\!{${regular.reg}}`;

    let scope = await this.openScope(regular);
    let last = scope;

    try {
      // if
      for (let i = 0; i < way.length; i++) {
        regular.args = null;
        if (typeof last === "function") {
          // function
          args = way[i].match(/\(.+?\)/);
          if (!args) {
            base.msg("Шаблон функция", {
              description: `Свойство \`${way[i]}\` - функция()\nScope:/${way
                .slice(0, i + 1)
                .join(" -> ")}\nПовторите попытку указав аргумент: \`${
                scope.false_func
              }\``,
            });
            return "[шаблон Фунция]";
          }
          regular.args = way[i]
            .slice(args.index + 1, -1)
            .split(/(?<!\\)\,/)
            .map((e) => e.replace("\\,", ",").trim());
          way[i] = way[i].slice(0, func.index);
        }
        scope = await scope[way[i]];
        if (scope === undefined && !regular.args) scope = this.options[way[i]];

        if (scope === undefined) {
          if (typeof last === "object" && last instanceof Array == false)
            base.msg("Шаблон 404", {
              description:
                "В вашем шаблоне не найдено свойство `" +
                way[i] +
                "` по пути: \nScope:/" +
                way.slice(0, i + 1).join(" -> ") +
                "\nДоступные свойства: `" +
                (Object.keys(last).length < 10
                  ? Object.keys(last).join("`/`")
                  : Object.keys(last).slice(0, 7).join("`/`") + "``/...") +
                "`",
            });
          else
            base.msg("Шаблон 404", {
              description: `В вашем шаблоне возникла ошибка: по пути:\n${way
                .slice(0, i + 1)
                .join(" -> ")}\nЗначение ${last} не имеет свойств.`,
              delete: 20000,
            });
          return "[шаблон Шаблон]";
        }

        if (scope.false_func) {
        }
        last = scope;
      }

      if (typeof scope === "object") {
        Object.assign(this.options, scope);
        base.msg(
          "Свойство `" +
            way.at(-1) +
            "` — объект, для получения примитивных значений попробуйте обратиться к его свойствам",
          {
            description:
              "Доступные свойства: `" +
              (Object.keys(scope).length < 20
                ? Object.keys(scope).join("`/`")
                : Object.keys(scope).slice(0, 15).join("`/`") + "``/...") +
              "`",
          },
        );
        return `[шаблон Объект(${Object.keys(scope).length})]`;
      }

      if (scope.length > 99) return "[шаблон Превышен лимит]";

      return scope;
    } catch (e) {
      base.msg("В шаблоне произошла ошибка", { description: e.message });
      console.error("Внутришаблонная ошибка");
      console.error(e);
      return "[ошибка Шаблона]";
    }
  }
}

export default Template;
