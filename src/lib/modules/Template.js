import config from "#config";
import { Collection } from "@discordjs/collection";
import { PermissionsBitField } from "discord.js";
import { VM } from "vm2";

import {
  ActionManager,
  BossManager,
  ChangelogDaemon,
  CommandsManager,
  CurseManager,
  DataManager,
  ErrorsHandler,
  EventsManager,
  GuildVariablesManager,
  QuestManager,
  StorageManager,
  TimeEventsManager,
  UserEffectManager,
} from "#lib/modules/mod.js";
import * as Util from "#lib/util.js";
import mol_global from "mol_tree2";

import * as PropertiesManager from "#lib/modules/Properties.js";

import app from "#app";
import { client } from "#bot/client.js";
import { MINUTE } from "#constants/globals/time.js";
import { Constants } from "#constants/mod.js";
import Discord, { FormattingPatterns } from "discord.js";
import FileSystem from "fs";

function isConstruct(fn) {
  try {
    Reflect.construct(String, [], fn);
  } catch {
    return false;
  }
  return true;
}

const PERMISSIONS_MASK_ENUM = {
  USER: 1,
  GUILD_MANAGER: 2,
  DEVELOPER: 7,
};

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
  static ModulesScope = new Collection(
    Object.entries({
      interaction: {
        getContent: (context) => {
          return context;
        },
        name: "interaction",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
          investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      constants: {
        getContent: () => Constants,
        name: "constants",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.USER,
          investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      config: {
        getContent: () => config,
        name: "config",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
          investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      CurrentGuildSpace: {
        getContent: (context) => new GuildVariablesManager(context.guild.data),
        name: "CurrentGuildSpace",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.GUILD_MANAGER,
        },
        filter: (context) => "guild" in context,
      },
      guildData: {
        getContent: (context) => context.guild.data,
        name: "guildData",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.GUILD_MANAGER,
          investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
        filter: (context) => "guild" in context,
      },
      userData: {
        getContent: (context) => context.user.data,
        name: "userData",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.USER,
          investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
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
              "inspect",
              "around",
              "uid",
              "NumberFormatLetterize",
            ].includes(key),
          ),
        name: "Util",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.USER,
          investigate: PERMISSIONS_MASK_ENUM.USER,
        },
      },
      ErrorsHandler: {
        getContent: () => ErrorsHandler,
        name: "ErrorsHandler",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.USER,
          investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      CommandsManager: {
        getContent: () => CommandsManager,
        name: "CommandsManager",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
          investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      EventsManager: {
        getContent: () => EventsManager,
        name: "EventsManager",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
          investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      UserEffectManager: {
        getContent: () => UserEffectManager,
        name: "UserEffectManager",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
          investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      BossManager: {
        getContent: () => BossManager,
        name: "BossManager",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.USER,
          investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      CurseManager: {
        getContent: () => CurseManager,
        name: "CurseManager",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.USER,
          investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      DataManager: {
        getContent: () => DataManager,
        name: "DataManager",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
          investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      TimeEventsManager: {
        getContent: () => TimeEventsManager,
        name: "TimeEventsManager",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
          investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      ActionManager: {
        getContent: () => ActionManager,
        name: "ActionManager",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
          investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      QuestManager: {
        getContent: () => QuestManager,
        name: "QuestManager",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.USER,
          investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      GuildVariablesManager: {
        getContent: () => GuildVariablesManager,
        name: "GuildVariablesManager",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
          investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      PropertiesManager: {
        getContent: () => PropertiesManager,
        name: "PropertiesManager",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.USER,
          investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      StorageManager: {
        getContent: () => StorageManager,
        name: "StorageManager",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
          investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      Discord: {
        getContent: () => Discord,
        name: "Discord",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
          investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      client: {
        getContent: () => client,
        name: "client",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
          investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      process: {
        getContent: () => process,
        name: "process",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      fetch: {
        getContent: () => fetch,
        name: "fetch",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      FileSystem: {
        getContent: () => FileSystem,
        name: "FileSystem",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      ChangelogDaemon: {
        getContent: () => ChangelogDaemon,
        name: "ChangelogDaemon",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.USER,
          investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      executeCommand: {
        getContent(context, source) {
          return (commandBase, params = "") => {
            const { CommandInteraction: CommandContext } = CommandsManager;
            const ctx = new CommandContext({
              commandBase,
              params,
              user: source.executor,
              channel: context.channel,
              message: context.message,
              guild: context.channel.guild,
            });
            ctx.mention = ctx.client.users.cache.get(
              params.match(FormattingPatterns.User)?.groups.id,
            );
            return (
              CommandsManager.checkAvailable(ctx.command, ctx) &&
              CommandsManager.execute(ctx.command, ctx)
            );
          };
        },
        name: "executeCommand",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.USER,
          investigate: PERMISSIONS_MASK_ENUM.USER,
        },
      },
      addEvaluateTemplateEffect: {
        getContent: (context, source) => {
          return ({ timer, template, hear } = {}) => {
            if (!hear) {
              throw new Error(
                "Nothing to hear: Example hear: {[(m'ActionsManager).Actions.coinFromMessage]: true}",
              );
            }
            timer ||= MINUTE * 3;
            timer = Math.min(timer, MINUTE * 3);
            const executorId = source.executor.id;
            return UserEffectManager.justEffect({
              user: context.user,
              effectId: "evaluateTemplate",
              values: { template, timer, hear, executorId },
            });
          };
        },
        name: "addEvaluateTemplateEffect",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.USER,
          investigate: PERMISSIONS_MASK_ENUM.USER,
        },
      },
      mol_global: {
        getContent: () => mol_global,
        name: "mol_global",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
          investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
        },
      },
      ___: {
        getContent: (context, source) => {
          return {
            confirm: "Это тестовое поле и всё ещё может сильно изменится",
            sendMessage(messagePayload) {
              const { user, channel, guild } = context;
              const target = guild ? channel : user;
              target.msg({
                ...messagePayload,
                footer: {
                  iconURL: source.executor.avatarURL(),
                  text: `Это сообщение сгенерировано от ${source.executor.id}`,
                },
              });
            },
            guild: {
              confirm: "Вам нужно обладать правами в гильдии",
              removeGuild() {},
            },
          };
        },
        name: "___",
        permissions: {
          scope: PERMISSIONS_MASK_ENUM.USER,
          investigate: PERMISSIONS_MASK_ENUM.USER,
        },
      },
    }),
  );

  static sourceTypes = {
    /** Can be called independently from executor */
    involuntarily: "involuntarily",
    /** user directly call */
    call: "call",
    /** From counter */
    counter: "counter",
    /** From guild command */
    guildCommand: "guildCommand",
    /** From userEffect/evaluateTemplate */
    evaluateEffect: "evaluateEffect",
  };

  constructor(source, context = {}) {
    const client = context.client || app.client;
    source.executor = client.users.resolve(source.executor);

    this.source = source;
    this.context = context;
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
      const missing = Object.entries(PERMISSIONS_MASK_ENUM)
        .filter(([_, bit]) => permissions.scope === bit && !(mask & bit))
        .map(([key]) => key)
        .join(", ");

      throw new Error(
        `Missing permissions: ${missing} for taking a module ${moduleName}`,
      );
    }

    const content = moduleEntity.getContent(this.context, this.source);

    vm.sandbox[moduleName] = this.restrictContent(content, permissions);
    return vm.sandbox[moduleName];
  }

  createVM() {
    const MAX_TIMEOUT = 1_000;

    const vm = new VM({ timeout: MAX_TIMEOUT });
    this.makeSandbox(vm);
    this.vm = vm;
    return this;
  }

  getPermissionsMask() {
    if (this.mask) {
      return this.mask;
    }

    const source = this.source;
    const context = this.context;
    const { DEVELOPER, GUILD_MANAGER, USER } = PERMISSIONS_MASK_ENUM;

    const isUser = !!source.executor;
    const isGuildManager = context.guild?.members
      .resolve(source.executor)
      .permissions.has(PermissionsBitField.Flags.ManageGuild);
    const isDelevoper = config.developers.includes(source.executor.id);

    const mask =
      (isDelevoper * DEVELOPER) |
      (isGuildManager * GUILD_MANAGER) |
      (isUser * USER);

    this.mask = mask;
    return mask;
  }

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

  provideRegularProxy(regular) {
    const context = { primary: this.context, source: this.source };
    return new RegularProxy().with({ regular, context }).process();
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

  restrictContent(content, permissions) {
    const mask = this.getPermissionsMask();

    const circular = new Util.CircularProtocol();

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

  async run(regular) {
    const vm = this.vm ?? this.createVM().vm;
    regular = this.provideRegularProxy(regular);
    const output = await vm.run(regular);
    return output;
  }
}

class RegularProxy {
  macroses = {
    m: (context) => {
      const { value } = context;
      return `module("${value}")`;
    },
    id: ({ primary }) => {
      const { executor } = primary.source;
      return executor.id;
    },
    "3q": () => {
      return "```";
    },
    debug: (context) => {
      const { value } = context;
      return `m'Util.inspect(${value})`;
    },
  };
  findMacro(context) {
    const { macro } = context;
    return this.macroses[macro];
  }

  onMacro(macro, context) {
    return macro.call(this, context);
  }

  process() {
    this.processMacroses();
    return this.regular;
  }

  processMacroses() {
    const regex = /(?<!not_macro\^\S*)(\w+)'(\w*)/;
    let _i = 0;
    const _LIMIT = 100;
    while (_i < _LIMIT) {
      const macro = this.regular.match(regex);
      if (!macro) {
        break;
      }

      this.regular = this.regular.replace(regex, (full, macro, value) => {
        const context = { macro, value, primary: this.context };
        const macroBase = this.findMacro(context);
        if (!macroBase) {
          return Util.use_unique_characters_marker(full, "not_macro", "g")
            .value;
        }
        return this.onMacro(macroBase, context);
      });
      _i++;
    }
    this.regular = this.regular.replaceAll(
      Util.use_unique_characters_marker("", "not_macro", "g").regex,
      (full, value) => value,
    );
  }

  with(data) {
    Object.assign(this, data);
    return this;
  }
}
export default Template;
