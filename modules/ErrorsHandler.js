import { ButtonStyle, ComponentType } from 'discord-api-types/v10';
import { resolveGithubPath } from '#src/modules/util.js';
import Path from 'path';
import { Collection } from '@discordjs/collection';

class ErrorsAudit {
	collection = new Collection();

	listOf(key){
		return this.collection.has(key) ?
			this.collection.get(key) :
			this.collection.set(key, []);
	}

	push(error, context){
		const list = this.listOf(error.message);
		context &&= JSON.parse(JSON.stringify(context));
		list.push({error, context, timestamp: Date.now()});
	}
};


class ErrorsHandler {
	static Audit = new ErrorsAudit();

	static async sendErrorInfo({channel, error, interaction}){
		const { fileOfError, strokeOfError } = this.parseErrorStack(error.stack, {node_modules: false}) ?? {};

		const components = [
			{
			  	type: ComponentType.Button,
			  	style: ButtonStyle.Secondary,
			  	label: "Получить отчёт",
			  	customId: "getErrorInfo",
			  	emoji: "〽️"
			},
			{
			  	type: ComponentType.Button,
			  	style: ButtonStyle.Link,
			  	label: "В Github",
			  	url: resolveGithubPath(
					Path.relative(process.cwd(), fileOfError ?? "."),
					strokeOfError
			  	),
				disabled: !fileOfError
			}
	  	];
		const embed = {title: `— Данные об исключении 🙄\n >>> ${ error.message }`, color: "#f0cc50", components, reference: interaction.message?.id ?? null};
		const message = await channel.msg(embed);
	  
		const collector = message.createMessageComponentCollector({time: 3_600_000});
		collector.on("collect", async interaction => {
			interaction.msg({ephemeral: true, content: `\`\`\`js\n${ error.stack }\`\`\``});
		})
		collector.on("end", () => message.edit({components: []}));
	}

	static parseErrorStack(stack, {node_modules}){
		stack = stack.replaceAll("\\", "/");

		const projectPath = process.cwd().replaceAll("\\", "/");
		const regular = new RegExp(`(?<fileOfError>${ projectPath }/.+?\\.js):(?<strokeOfError>\\d+)`);
		const groups = stack.match(regular)?.groups;

		
		if (!groups){
			return undefined;
		}

		const { fileOfError } = groups;
		
		if (node_modules === false && fileOfError.includes("node_modules")){
			return null;
		}

		return {...groups};
	}
}

 
export default ErrorsHandler;