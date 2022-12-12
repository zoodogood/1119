import { VM } from "vm2";
import config from '#src/config';
import { PermissionsBitField } from 'discord.js';

import * as Util from '#src/modules/util.js';
import { CommandsManager, EventsManager, BossManager, DataManager, TimeEventsManager, ActionManager, QuestManager } from '#src/modules/mod.js';

import { client } from '#src/index.js';
import FileSystem from 'fs';
import Discord from 'discord.js';


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
	  	const vm = new VM();
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


		this.constructor.getModulesScope()
			.filter(({permissions}) => mask & permissions)
			.forEach(({prototypePermissions = 0, configurablePermissions = 0, content, name}) => {
				if (prototypePermissions && mask & prototypePermissions === 0){
					content = JSON.parse(JSON.stringify(content));
				}

				if (configurablePermissions && mask & configurablePermissions === 0){
					vm.freeze(content, name);
					return;
				}

				vm.sandbox[name] = content;
				return;
			})

		return;
	}

	static getModulesScope(context){
		return [
			{
				content: Util,
				name: "Util",
				permissions: this.PERMISSIONS_MASK_ENUM.USER,
				configurablePermissions: this.PERMISSIONS_MASK_ENUM.DEVELOPER
			},
			{
				content: CommandsManager,
				name: "CommandsManager",
				permissions: this.PERMISSIONS_MASK_ENUM.USER,
				prototypePermissions: 0,
				configurablePermissions: this.PERMISSIONS_MASK_ENUM.DEVELOPER
			},
			{
				content: DataManager,
				name: "DataManager",
				permissions: this.PERMISSIONS_MASK_ENUM.USER,
				prototypePermissions: 0,
				configurablePermissions: this.PERMISSIONS_MASK_ENUM.DEVELOPER
			},
			{
				content: TimeEventsManager,
				name: "TimeEventsManager",
				permissions: this.PERMISSIONS_MASK_ENUM.USER,
				prototypePermissions: 0,
				configurablePermissions: this.PERMISSIONS_MASK_ENUM.DEVELOPER
			},
			{
				content: ActionManager,
				name: "ActionManager",
				permissions: this.PERMISSIONS_MASK_ENUM.USER,
				prototypePermissions: 0,
				configurablePermissions: this.PERMISSIONS_MASK_ENUM.DEVELOPER
			},
			{
				content: BossManager,
				name: "BossManager",
				permissions: this.PERMISSIONS_MASK_ENUM.USER,
				prototypePermissions: 0,
				configurablePermissions: this.PERMISSIONS_MASK_ENUM.DEVELOPER
			},
			{
				content: EventsManager,
				name: "EventsManager",
				permissions: this.PERMISSIONS_MASK_ENUM.USER,
				prototypePermissions: 0,
				configurablePermissions: this.PERMISSIONS_MASK_ENUM.DEVELOPER
			},
			{
				content: QuestManager,
				name: "QuestManager",
				permissions: this.PERMISSIONS_MASK_ENUM.USER,
				prototypePermissions: 0,
				configurablePermissions: this.PERMISSIONS_MASK_ENUM.DEVELOPER
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
 
	async openScope(regular){
	  let
		 base = regular.template.base,
		 args = regular.args;
 
	  let object = {
		  guild: {
			  stats: {
				 get msgs() {
					return base.guild.data.day_msg;
				 },
				 get averageTotal(){
					return Math.round(base.guild.data.msg_total / base.guild.data.days) || base.guild.data.day_msg;
				 },
				 get msgsTotal(){
					return base.guild.data.msg_total;
				 }
			  },
			  emojis: {
				 get random() {
					return base.guild.emojis.cache.random().toString();
				 },
				 get get(){
					if (!args) return {false_func: "emojiId"};
					let emoji = base.guild.emojis.cache.get(args[0]);
					if (emoji) return emoji.toString();
					else throw "Invalid EmojiId";
				 }
			  },
			  variables: {
				 get set(){
					if (!args) return {false_func: "{userId} {variable} {value}"};
					if (args[0] != "server" && !args[0].match(/\d{17,19}/g)) throw "Аругментом userId введено не айди пользователя";
					if (base.guild.member(base.author).wastedPermissions(288)[1]) throw "Недостаточно прав для изменения переменных сервера";
					let guild = getData(base.guild.id, "guilds");
					let variables = guild.variables || (guild.variables = {});
 
					let name = variables[args[0]] || (variables[args[0]] = {});
					let save = args[2].slice(1);
					if (args[2][0] == "+") args[2] = +name[args[1]] + +args[2].slice(1);
					if (args[2][0] == "-") args[2] = +name[args[1]] - +args[2].slice(1);
					if (isNaN(args[2])) args[2] = save;
 
					name[args[1]] = args[2];
					return args[2];
				 },
				 get read(){
					if (!args) return {false_func: "{userId} {variable}"};
					if (base.guild.member(base.author).wastedPermissions(288)[1]) throw "Недостаточно прав для изменения переменных сервера";
					if (args != "server" && !args.match(/\d{6,9}/g)[0]) throw "Аругментом userId введено не айди пользователя";
					let guild = getData(base.guild.id, "guilds");
					let variables = guild.variables || (guild.variables = {});
 
					let name = variables[args[0]] || (variables[args[0]] = {});
					return (name[args[1]] === undefined) ? "пустота" : name[args[1]];
				 }
			  }
			},
		  bot: {
			  get api() {
					if (!args) return {false_func: "{link} <options>"};
					console.info("API " + args);
					let options = {method: "GET"};
 
					if (args[2]) {
					  try { options = JSON.parse(args.slice(1).join(",")); }
					  catch (e) { throw new Error("Неверно указаны опции, они должы быть в JSON формате"); }
					}
					console.info(options);
					let response = fetch(args[0], options).then(e => e.text().then(read => {
					  try {
						 res = {status: e.status, statusText: e.statusText};
						 read = JSON.parse(read);
					  }
					  catch (e) {}
					  finally {
						 res.read = read;
					  }
					  return res;
					}));
					return response;
			  },
			  stats: {
				 get averageAll(){
					let guilds = DataManager.data.guilds.filter(e => e.days);
					let size = guilds.length;
					return Math.round(guilds.reduce((last, e) => last + e.msg_total / e.days, 0) / size);
				 },
				 get averageToday(){
					let guilds = DataManager.data.guilds.filter(e => e.day_msg);
					let size = guilds.length;
					return Math.round(guilds.reduce((last, e) => last + e.day_msg, 0) / (size || 1));
				 },
				 get msgsTotal(){
					let guilds = DataManager.data.guilds.filter(e => e.msg_total);
					return guilds.reduce((last, e) => last + e.msg_total, 0);
				 },
				 get msgsToday(){
					let guilds = DataManager.data.guilds.filter(e => e.day_msg);
					return guilds.reduce((last, e) => last + e.day_msg, 0);
				 },
				 get commandsLaunched(){
					let guilds = DataManager.data.guilds.filter(e => e.commandsLaunched);
					return guilds.reduce((last, e) => last + e.commandsLaunched, 0);
				 }
			  },
			  methods: {
				 get random(){
					if (!args) return {false_func: "{number or string}"};
					if (args[1]) return args.random();
					return Util.random(+args);
				 },
				 get ending(){
					if (!args) return {false_func: "{num} {word} {0, 5-9} {1} {2-4}"};
					return  Util.ending(...args)
				 },
				 get math(){
					if (!args) return {false_func: "{math regular}"};
					return Math.math(args.join());
				 }
			  },
			  logical: {
				 get IfEqual(){
					  if (!args) return {false_func: "{oneValue} {twoValue}"};
					  if (args[0] == args[1]) return 1;
					  else return 0;
				 },
				 get IfLessZero(){
					  if (!args) return {false_func: "{number}"};
					  if (isNan(args[0])) throw "number is Not a Number";
					  if (args[0] < 0) return 1;
					  else return 0;
				 }
			  },
			  other: {
				 time: {
					get hours(){
					  return new Date().getHours();
					},
					get minutes(){
					  return new Date().getMinutes();
					},
					get displayDate(){
					  return DataManager.data.bot.dayDate;
					},
					get display(){
					  let date = new Date();
					  return `${("0" + date.getHours()).slice(-2)}:${("0" + date.getMinutes()).slice(-2)}`;
					}
				 }
			  }
			},
		  get msg() {
			 return base;
		  },
		  variables: regular.template.options,
		  get trash(){
			 // if (!args) return {false_func: "Введите аргументы для их удаления"}
			 return "";
		  },
		  get var(){
			 if (!args) return {false_func: "{variable} {value}"};
			 if (args[1]) openScope.variables[args[0]] = args.slice(1).join(" ");
			 return openScope.variables[args[0]];
		  }
	  };
	  return object;
	}
 }

 
 export default Template;