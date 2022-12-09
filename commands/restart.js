import { CustomCollector } from '@zoodogood/utils/objectives';
import { client } from '#src/index.js';
import { exec } from 'child_process';


class Command {

	async onChatInput(msg, interaction){
		const command = "git pull & pm2 restart blackghost";
		
		const embed = {
			title: "Выполнение комманды <:emoji_50:753916145177722941>",
			color: "#2c2f33",
			description: `> exec ${ command }`
		};

		const message = await msg.msg(embed);
		embed.edit = true;

		const updateDescription = (content) => {
			embed.description += `\n${ content }`;
			message.msg({...embed, description: `\`\`\`\n${ embed.description }\`\`\``});

		}
		const child = exec(command, (error, stdout) => console.log({error}) ?? console.log({stdout}));
		
		child.stdout.on("data", (data) => updateDescription(data));
		child.stderr.on("data", (data) => updateDescription(data));
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