import { ButtonStyle, ComponentType } from 'discord-api-types/v10';

class ErrorsHandler {
	static async sendAuditMessage({channel, error, interaction}){
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
			  url: "https://google.com"
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
}

 
export default ErrorsHandler;