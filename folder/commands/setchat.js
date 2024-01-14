

class Command {

	async onChatInput(msg, interaction){
    const type = "chatChannel";
    const guild = msg.guild;
    const channel = msg.mentions.channels.first() ?? msg.channel;
    guild.data[type] = channel.id;
    msg.msg({title: `#${channel.name} канал стал чатом!`, delete: 9000});

    guild.logSend({description: `Каналу #${channel.name} установили метку "чат"`, author: {name: msg.author.username, avatarURL: msg.author.avatarURL()}});
  }


	options = {
	  "name": "setchat",
	  "id": 11,
	  "media": {
	    "description": "\n\nУстанавливает для бота указанный канал, как чат, туда будет отправляться ежедневная статистика, а также не будут удалятся сообщения о повышении уровня.\n\n✏️\n```python\n!setChat <channel>\n```\n\n"
	  },
	  "alias": "установитьчат встановитичат",
		"allowDM": true,
		"type": "guild",
		"Permissions": 32
	};
};

export default Command;