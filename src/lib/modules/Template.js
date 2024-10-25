import config from "#config";
import { PermissionsBitField } from "discord.js";
import { VM } from "vm2";

import * as Util from "#lib/util.js";

import { PERMISSIONS_MASK_ENUM } from "#constants/app/empowered_permissions.js";
import { template_modules_scope } from "#folder/entities/template_modules/mod.js";

function isConstruct(fn) {
  try {
    Reflect.construct(String, [], fn);
  } catch {
    return false;
  }
  return true;
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
  static ModulesScope = template_modules_scope;

  static sourceTypes = {
    /** Can be called independently from executor */
    involuntarily: "involuntarily",
    /** user directly call */
    call: "call",
    /** From Board */
    board_render: "board_render",
    /** From guild command */
    custom_command: "custom_command",
    /** From userEffect/evaluateTemplate */
    evaluateEffect: "evaluateEffect",
  };

  constructor(source, context = {}) {
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

    const isUser = !!source.empowered;
    const isGuildManager = context.guild?.members
      .resolve(source.empowered)
      .permissions.has(PermissionsBitField.Flags.ManageGuild);
    const isDelevoper = config.developers.includes(source.empowered.id);

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
        modules.map(({ key }) =>
          this.availableModulesList.has(key) ? [key, true] : [key, false],
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
      const { empowered } = primary.source;
      return empowered.id;
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
