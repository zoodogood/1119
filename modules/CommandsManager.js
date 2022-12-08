import { Collection, CommandInteraction } from 'discord.js';
import EventsEmitter from 'events';
import DataManager from '#src/modules/DataManager.js';

import { ImportDirectory } from '@zoodogood/import-directory';

const COMMANDS_PATH = "./commands";


function parseInputCommandFromMessage(message){	
	const content = message.content.trim();
	const PREFIX = "!";

	if (!content.startsWith(PREFIX)){
		return null;
	}


	const words = content.split(" ").filter(Boolean);
	const spliceCommandBase = (words) => {
		const DEFAULT_BASE_LENGTH = 1;
		const prefixIsAlone = words.at(0) === PREFIX;
		
		const length = DEFAULT_BASE_LENGTH + Number(prefixIsAlone);

		const base = words.splice(0, length).join("");
		return base.slice(PREFIX.length).toLowerCase();
	};
	const commandBase = spliceCommandBase(words);
	const params = words.join("\n");

	const commandContext = {
		command: CommandsManager.callMap.get(commandBase),
		params,
		message
	}

	if (!commandContext.command){
		return null;
	}

	Object.assign(commandContext, {
		user: 	 	message.author,
		userData: 	message.author.data,
		channel:  	message.channel,
		guild:    	message.guild,
		member:   	message.guild ? message.guild.members.resolve(message.author) : null,
		mention: 	message.mentions.users.first() ?? null

	})
	return commandContext;
}

class Command {

}

class CommandsManager {

	static parseInputCommandFromMessage = parseInputCommandFromMessage;
	static Command = Command;

	static emitter = new EventsEmitter();

	static checkParams(){

	}

	static async importCommands(){
		const commands = 
			(await new ImportDirectory().import(COMMANDS_PATH))
			.map(({default: Command}) => new Command());

		const entries = commands.map(command => [command.options.name, command]);

		this.collection = new Collection(entries);
	};

	static checkAvailable(command, interaction){
		const problems = [];
		const options = command.options;

		if (options.removed || options.type === "dev" && msg.author.id !== "921403577539387454"){
			problems.push("Эта команда была удалена и не может быть использована");
		}

		if (options.type === "dev" && process.env.DEVELOPMENT !== "TRUE" && msg.author.id !== "921403577539387454"){
			problems.push("Эта команда находится в разработке и недоступна в публичной версии бота");
		}

		if (!options.inDM && interaction.channel.isDMBased()){
			problems.push("Эта команда может быть вызвана только на сервере");
		}

		if (options.expectMention && !interaction.mention){
			problems.push("Вы не упомянули пользователя");
		}
		if (options.expectParams && !interaction.params){
			problems.push("Вы не указали аргументов");
		}


		// to-do switch Command.permissions[permission]) to PermissionsLocales — need create a module
		const clientWastedChannelPermissions = !interaction.channel.isDMBased() && options.myChannelPermissions && (interaction.guild.members.me.wastedPermissions(options.myChannelPermissions, interaction.channel))
		if (clientWastedChannelPermissions){
			throw new Error("look at to-do above");
			const wastedPermissions = Util.joinWithAndSeparator( clientWastedChannelPermissions.map(permission => Command.permissions[permission]) );
			problems.push(`Боту необходимы следующие права в этом канале: ${ wastedPermissions }`);
		}
			
		const clientWastedGuildPermissions = !interaction.channel.isDMBased() && options.myPermissions && (interaction.guild.members.me.wastedPermissions(options.myPermissions));
		if (clientWastedGuildPermissions){
			throw new Error("look at to-do above");
			const wastedPermissions = Util.joinWithAndSeparator( clientWastedGuildPermissions.map(permission => Command.permissions[permission]) );
			problems.push(`Боту необходимы следующие права в этой гильдии: ${ wastedPermissions } `);
		}
			
		const userWastedChannelPermissions = !interaction.channel.isDMBased() && options.ChannelPermissions && (interaction.member.wastedPermissions(options.ChannelPermissions, interaction.channel));
		if (userWastedChannelPermissions){
			throw new Error("look at to-do above");
			const wastedPermissions = Util.joinWithAndSeparator( userWastedChannelPermissions.map(permission => Command.permissions[permission]) );
			problems.push(`Вам необходимо обладать следующими правами внутри текущего канала: ${ wastedPermissions } `);
		}
			
		const userWastedGuildPermissions = !interaction.channel.isDMBased() && options.Permissions && (interaction.member.wastedPermissions(options.Permissions));
		if (userWastedGuildPermissions){
			throw new Error("look at to-do above");
			const wastedPermissions = Util.joinWithAndSeparator( userWastedGuildPermissions.map(permission => Command.permissions[permission]) );
			problems.push(`Вам необходимо обладать следующими правами внутри гильдии: ${ wastedPermissions } `);
		}
			


		if (options.cooldown && interaction.user["CD_" + options.id] && (+(Date.now() + options.cooldown * (options.cooldownTry - 1)) < +user["CD_" + options.id]))
			problems.push(`Перезарядка: **${ Util.timestampToDate(user["CD_" + options.id] - Date.now() - options.cooldown * (options.cooldownTry - 1) + 500) }**`);


		if (problems.length === 0){
			return true;
		}


		const helpMessage = async () => {

    		const embed = {
      		author: {iconURL: author.avatarURL(), name: author.username},
      		color: "#ff0000",
     			delete: 20000
    		};
			if (problems.length === 1){
				embed.title = problems.at(0);
			}
    		if (problems.length > 1) {
     			embed.title = "Упс, образовалось немного проблемок:";
      		embed.description = problems.map(problem => `• ${ problem }`).join("\n");
    		}
    		const message = await msg.msg(embed);


			const isHelpedNeeds = problems.includes("Вы не указали аргументов") || problems.includes("Вы не упомянули пользователя");
			if (!isHelpedNeeds){
				return;
			}

			let react = await message.awaitReact({user: msg.author, type: "all"}, "❓");
			if (!react){
				return;
			}

			let helper = await commands.commandinfo.code(msg, {args: command});
			await Util.sleep(20000);
			helper.delete();
		}
		helpMessage();


    	return false;
	}

	static async execute(command, interaction){
		const typesBase = {
			"slash": {
				type: "slash",
				call: async (command, interaction) => {
					return await command.onSlashCommand(interaction);
				},
				condition: (interaction) => interaction instanceof CommandInteraction
			},
			"input": {
				type: "input",
				call: async (command, interaction) => {
					command.options.removeCallMessage ? interaction.message.delete() : null;
					const output = await command.onChatInput(interaction.message, interaction);
					return output;
				},
				condition: (interaction) => "message" in interaction
			}
		}
		
		const typeBase = Object.values(typesBase)
			.find(({condition}) => condition(interaction));

		try {
			await typeBase.call(command, interaction);
			this.emitter.emit("command", interaction);
			this.statistics.increase(interaction);
			// To-do, придумать где хранить статистику для ведения статистики
		}
		catch (error){
			console.error(error);
			// To-do, создать и привязать модуль для в чат отправки данных об ошибках
		}
		
	}

	static statistics = {
		increase: (interaction) => {
			const commandOptions = interaction.command.options;

			const botData = DataManager.data.bot;
			const guildData = interaction.guild?.data;

			if (guildData){
				guildData.commandsUsed ||= {};
				guildData.commandsUsed[commandOptions.id] ||= 0;
				guildData.commandsUsed[commandOptions.id]++;
			}

			if (botData){
				botData.commandsUsed[commandOptions.id] ||= 0;
				botData.commandsUsed[commandOptions.id]++;
			}
		}
	}

	static createCallMap(){
		const map = new Map();
		const setToMap = (list, command) => list.forEach(item => map.set(item, command));
		const createList = (command) => [command.options.name, ...command.options.allias.split(" "), command.options.slash?.name, command.options.id]
			.filter(Boolean);

		this.collection.each(command => setToMap(createList(command), command));
		this.callMap = map;
		return map;
	}
}

export default CommandsManager;