import Template from '#lib/modules/Template.js';

class Command {

	async onChatInput(msg, interaction){
		const source = {executor: interaction.user, type: Template.sourceTypes.call};
    	const content = await new Template(source, interaction).replaceAll(interaction.params);
    	await msg.msg({content: `**${ content }**`});

    	msg.guild?.logSend({title: `${ msg.author.username }:`, description: `\n!c ${ interaction.params }`});
  }


	options = {
	  "name": "template",
	  "id": 2,
	  "media": {
	    "description": "Отправляет ваше сообщение от имени призрака. Также это отличная команда для тестирования шаблонов.\nЛичная просьба: Используя команду при разговоре, не нарушайте каноничность характера бота, это действительно важно в первую очередь для меня. Спасибо за понимание :green_heart:\n\n✏️\n```python\n!c {text}\n```",
	    "poster": "https://cdn.discordapp.com/attachments/769566192846635010/872441895215824916/send.gif"
	  },
	  "alias": "с c сенд s template шаблон",
		"allowDM": true,
		"expectParams": true,
		"type": "dev"
	};
};

export default Command;