
import config from '#config';
import get from '#lib/child-process-utils.js';
const {run, info} = get({ root: process.cwd() });




class Command {

	async onChatInput(msg, interaction){
		const COMMANDS = [
			"git pull",
			"npm.cmd run build",
			config.pm2.id ? `npm.cmd run pm2-please-restart ${ config.pm2.id }` : "echo pm2 not setted"
		];
		
		const embed = {
			title: "<:emoji_50:753916145177722941>",
			color: "#2c2f33",
			description: `**RESTARTING...**`
		};

		const message = await msg.msg(embed);
		embed.edit = true;

		const updateDescription = (content) => {
			embed.description += `\n\`\`\`ansi\n${ content }\`\`\``;
			message.msg(embed);
		}
		
		for (const string of COMMANDS) {
			const [command, ...params] = string.split(" ");
			embed.description += `\n> ${ string }`;
			const result = await run(command, params)
				.catch((error) => `Error: ${ error.message }`);

			updateDescription(result);
		}
  	}


	options = {
	  	"name": "restart",
	  	"id": 61,
	  	"media": {
	   	"description": "Перезапускает процесс"
	  	},
	  	"allias": "перезапустить",
		"allowDM": true,
		"cooldown": 100_000,
		"cooldownTry": 5,
		"type": "dev"
	};
};

export default Command;