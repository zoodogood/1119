import { VM } from "vm2";
import config from '#src/config';
import { PermissionsBitField } from 'discord.js';

import * as Util from '#src/modules/util.js';
import { CommandsManager, EventsManager, BossManager, DataManager, TimeEventsManager, ActionManager, QuestManager, GuildVariablesManager } from '#src/modules/mod.js';

import { client } from '#src/index.js';
import FileSystem from 'fs';
import Discord from 'discord.js';

function isConstruct(fn){
	try {
		Reflect.construct(String, [], fn);
	 } catch {
		return false;
	 }
	 return true;
}

class Template {
	constructor (source, context){
		source.executer = context.client.users.resolve(source.executer);
		
	  	this.source = source;
	  	this.context = context;
	}
 
	async replaceAll(string){
	  const LIMIT = 10;
 
	  const context = {
		 before: string,
		 currentIteration: 0
	  };
	  do {
		 context.before = string;
		 string = await this.replace(string);

		 context.currentIteration++;
	  } while (string !== context.before || context.currentIteration > LIMIT);
	  
	  return string;
	}
 
	async replace(string){
	
	  const context = {
		 nesting: [],
		 inQuotes: null,
		 exitCode: Symbol("exitCode")
	  }
	  
	  const special = {
		 "{": (context, index) => context.nesting.push({symbol: "{", index}),
		 "}": (context) => {
			const brackets = context.nesting.filter(({symbol}) => symbol === "{");
			const remove = () => context.nesting.pop();
			return brackets.length === 1 ? 
			  context.exitCode : remove();
		 },
		 "\"": (context) => context.inQuotes = "\"",
		 "'": (context) => context.inQuotes = "'",
		 "`": (context) => context.inQuotes = "`",
		 "\\": (context) => context.skipOnce = true
	  }
 
	  for (const index in string){
		 const symbol = string[index];
 
		 if (symbol in special === false){
			continue;
		 }
 
		 if (context.skipOnce){
			context.skipOnce = false;
			continue;
		 }
 
		 if (context.inQuotes === symbol){
			context.inQuotes = false;
			continue;
		 }
 
		 const output = special[symbol].call(this, context, index);
 
		 if (output === context.exitCode){
			const openedBracket = context.nesting.find(({symbol}) => symbol === "{");
			const content = string.slice(openedBracket.index, index + 1);
			const output = await this.getRegular(content.slice(1, -1));
			string = string.replace(content, output);
			break;
		 }
	  };
 
	  return string;
	}
 
	createVM(){
		const MAX_TIMEOUT = 1_000;

	  	const vm = new VM({timeout: MAX_TIMEOUT});
		this.makeSandbox(vm);
		return vm;
	}

	static PERMISSIONS_MASK_ENUM = {
		USER: 1,
		GUILD_MANAGER: 2,
		DEVELOPER: 7
	}

	makeSandbox(vm){
		const source = this.source;
		const context = this.context;
		const permissionsEnum = this.constructor.PERMISSIONS_MASK_ENUM;

		const isUser = !!source.executer;
		const isGuildManager = context.guild && context.guild.members.resolve(source.executer).permissions.has(PermissionsBitField.Flags.ManageGuild);
		const isDelevoper = config.developers.includes(source.executer.id);

		const mask =
			isDelevoper 	* permissionsEnum.DEVELOPER |
			isGuildManager * permissionsEnum.GUILD_MANAGER |
			isUser 			* permissionsEnum.USER;


		const modules = this.constructor.getModulesScope(context);
		
		const availableModules = modules
			.filter(({filter}) => !filter || filter(context))
			.filter(({permissions}) => mask & permissions.scope);
		
		availableModules
			.forEach(({permissions, content, name}) => {

				if (permissions.investigate && mask & permissions.investigate !== permissions.investigate){
					if (isConstruct(content)){
						const entries = Object.getOwnPropertyNames(content).map(key => [key, content[key]]);
						content = Object.fromEntries(entries);
					}
					content = JSON.parse(JSON.stringify(content));
				}

				if (permissions.configurate && mask & permissions.configurate !== permissions.configurate){
					vm.freeze(content, name);
					return;
				}

				vm.sandbox[name] = content;
				return;
			});

		const availableList = Object.fromEntries(
			modules.map((moduleBase) => availableModules.includes(moduleBase) ? [moduleBase.name, true] : [moduleBase.name, false])
		);

		vm.sandbox.availableList = availableList;

		return;
	}

	static getModulesScope(context){
		return [
			{
				content: context,
				name: "interaction",
				permissions: {
					scope: this.PERMISSIONS_MASK_ENUM.USER,
					investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER
				}
			},
			{
				content: () => new GuildVariablesManager(context.guild),
				name: "getGuildSpace",
				permissions: {
					scope: this.PERMISSIONS_MASK_ENUM.GUILD_MANAGER
				},
				filter: (context) => "guild" in context
			},
			{
				get content(){
					return context.guild.data
				},
				name: "guildData",
				permissions: {
					scope: this.PERMISSIONS_MASK_ENUM.GUILD_MANAGER,
					configurate: this.PERMISSIONS_MASK_ENUM.DEVELOPER
				},
				filter: (context) => "guild" in context
			},
			{
				get content(){
					return context.user.data
				},
				name: "userData",
				permissions: {
					scope: this.PERMISSIONS_MASK_ENUM.GUILD_MANAGER,
					configurate: this.PERMISSIONS_MASK_ENUM.DEVELOPER
				},
				filter: (context) => "user" in context
			},
			{
				content: Util,
				name: "Util",
				permissions: {
					scope: this.PERMISSIONS_MASK_ENUM.USER,
					investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER
				}
			},
			{
				content: CommandsManager,
				name: "CommandsManager",
				permissions: {
					scope: this.PERMISSIONS_MASK_ENUM.USER,
					investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER
				}
			},
			{
				content: EventsManager,
				name: "EventsManager",
				permissions: {
					scope: this.PERMISSIONS_MASK_ENUM.USER,
					investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER
				}
			},
			{
				content: BossManager,
				name: "BossManager",
				permissions: {
					scope: this.PERMISSIONS_MASK_ENUM.USER,
					investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER
				}
			},
			{
				content: DataManager,
				name: "DataManager",
				permissions: {
					scope: this.PERMISSIONS_MASK_ENUM.USER,
					investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER
				}
			},
			{
				content: TimeEventsManager,
				name: "TimeEventsManager",
				permissions: {
					scope: this.PERMISSIONS_MASK_ENUM.USER,
					investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER
				}
			},
			{
				content: ActionManager,
				name: "ActionManager",
				permissions: {
					scope: this.PERMISSIONS_MASK_ENUM.USER,
					investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER
				}
			},
			{
				content: QuestManager,
				name: "QuestManager",
				permissions: {
					scope: this.PERMISSIONS_MASK_ENUM.USER,
					investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER
				}
			},
			{
				content: GuildVariablesManager,
				name: "GuildVariablesManager",
				permissions: {
					scope: this.PERMISSIONS_MASK_ENUM.USER,
					investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER
				}
			},
			{
				content: Discord,
				name: "Discord",
				permissions: {
					scope: this.PERMISSIONS_MASK_ENUM.USER,
					investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER
				}
			},
			{
				content: client,
				name: "client",
				permissions: {
					scope: this.PERMISSIONS_MASK_ENUM.USER,
					investigate: this.PERMISSIONS_MASK_ENUM.DEVELOPER
				}
			},
			{
				content: process,
				name: "process",
				permissions: {
					scope: this.PERMISSIONS_MASK_ENUM.DEVELOPER
				}
			},
			{
				content: FileSystem,
				name: "FileSystem",
				permissions: {
					scope: this.PERMISSIONS_MASK_ENUM.DEVELOPER
				}
			}
		];
	};

	static sourceTypes = {
		/** Can be called independently from executer */
		involuntarily: "involuntarily",
		/** user directly call */
		call: "call",
		/** From counter */
		counter: "counter",
		/** From guild command */
		guildCommand: "guildCommand"
	};
 
	async getRegular(regular){
	  const vm = this.vm ?? this.createVM();
	  const output = await vm.run(regular);
 
	  return String(output);
	}
 
	async getFromScope(regular){
	  let func;
	  let base = regular.template.base;
 
	  let way = regular.reg.match(/(?:[^.]+?\(.+?\))($|(?=\.))|([a-z0-9]+)(?!=[(])/gim);
	  if (!way) return `\\!{${regular.reg}}`;
 
	  let scope = await this.openScope(regular);
	  let last = scope;
 
	  try {
	  // if
		 for (let i = 0; i < way.length; i++) {
			regular.args = null;
			if (typeof last == "function"){
			  // function
			  args = way[i].match(/\(.+?\)/);
			  if (!args) {
				 base.msg("Шаблон функция", {description: `Свойство \`${way[i]}\` - функция()\nScope:/${way.slice(0, i + 1).join(" -> ")}\nПовторите попытку указав аргумент: \`${scope.false_func}\``});
				 return "[шаблон Фунция]";
			  }
			  regular.args = way[i].slice(args.index + 1, -1).split(/(?<!\\)\,/).map(e => e.replace("\\,", ",").trim());
			  way[i] = way[i].slice(0, func.index);
			}
			scope = await scope[way[i]];
			if (scope === undefined && !regular.args) scope = this.options[way[i]];
 
			if (scope === undefined) {
			  if (typeof last == "object" && last instanceof Array == false) base.msg("Шаблон 404", {description: "В вашем шаблоне не найдено свойство `" + way[i] + "` по пути: \nScope:/" + way.slice(0, i + 1).join(" -> ") + "\nДоступные свойства: `" + ((Object.keys(last).length < 10) ? (Object.keys(last).join("`/`")) : (Object.keys(last).slice(0, 7).join("`/`") + "``/..."))  + "`"});
			  else base.msg("Шаблон 404", {description: `В вашем шаблоне возникла ошибка: по пути:\n${way.slice(0, i + 1).join(" -> ")}\nЗначение ${last} не имеет свойств.`, delete: 20000});
			  return "[шаблон Шаблон]";
			}
 
			if (scope.false_func) {
 
			}
			last = scope;
		 }
 
		 if (typeof scope == "object"){
			Object.assign(this.options, scope);
			base.msg("Свойство `" + way.at(-1) + "` — объект, для получения примитивных значений попробуйте обратиться к его свойствам", {description: "Доступные свойства: `" + ((Object.keys(scope).length < 20) ? (Object.keys(scope).join("`/`")) : (Object.keys(scope).slice(0, 15).join("`/`") + "``/...")) + "`"});
			return `[шаблон Объект(${Object.keys(scope).length})]`
		 }
 
		 if (scope.length > 99) return "[шаблон Превышен лимит]";
 
		 return scope;
 
	  } catch (e) {
		 base.msg("В шаблоне произошла ошибка", {description: e.message});
		 console.error("Внутришаблонная ошибка");
		 console.error(e);
		 return "[ошибка Шаблона]";
	  }
	}

 }

 
 export default Template;