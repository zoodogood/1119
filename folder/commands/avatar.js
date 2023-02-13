

class Command {

	async onChatInput(msg, interaction){
    const avatarURL = (interaction.mention || msg.author).avatarURL({dynamic : true});
    msg.msg({content: avatarURL});
  }


	options = {
	  "name": "avatar",
	  "id": 41,
	  "media": {
	    "description": "\n\nОтправляет картинку-аватар красивого пользователя <:panda:637290369964310530>\nЕсли вы хотите достичь более хорошего качества чем 128х128px, вам явно понадобится напрямую попросить человека поделится фоточками\n\n:pencil2:\n```python\n!avatar <memb>\n```\n\n"
	  },
	  "allias": "аватар",
		"allowDM": true,
		"cooldown": 12000000,
		"type": "other"
	};
};

export default Command;