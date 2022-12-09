
import { exec } from 'child_process';


class Command {

	async onChatInput(msg, interaction){
		const COMMAND = "git pull && pm2 restart --update-env blackghost";
		
		const embed = {
			title: "<:emoji_50:753916145177722941>",
			color: "#2c2f33",
			description: `> ${ COMMAND }`
		};

		const message = await msg.msg(embed);
		embed.edit = true;

		const updateDescription = (content) => {
			embed.description += `\n${ content }`;
			message.msg({...embed, description: `\`\`\`\n${ embed.description }\`\`\``});

		}
		const child = exec(COMMAND);	
		
		child.stdout.on("data", (data) => updateDescription(data));
		child.stderr.on("data", (data) => updateDescription(`Error:\n${ data }`));
		child.on("error", console.log);
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