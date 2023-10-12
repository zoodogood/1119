import { client } from '#bot/client.js';

class Command {

	async onChatInput(msg, interaction){
    if (msg.member.voice.channel){

      const request = {
        method: 'POST',
        body: JSON.stringify({
          max_age: 86400,
          max_uses: 0,
          target_application_id: "880218394199220334",
          target_type: 2,
          temporary: false,
          validate: null
        }),
        headers: {
          'Authorization': `Bot ${client.token}`,
          'Content-Type': 'application/json'
        }
      }

      let res = await fetch(`https://discord.com/api/v8/channels/${msg.member.voice.channel.id}/invites`, request);
      let invite = await res.json();

      if (invite.code === 50013){
        msg.msg({title: "У бота не хватает прав", description: `Необходимо право "Создавать приглашения"`, delete: 9000, color: "#ff0000"});
        return;
      }

      msg.msg({title: "Активити сгенерированно", description: `[Кликните](https://discord.com/invite/${invite.code}), чтобы подключится к активити Совместный Ютуб\nЕсли вы используете мобильную версию дискорда, эта возможность пока-ещё недоступна`});
      return;
    }
    msg.msg({title: "Необходимо находится в голосовом канале", color: "#ff0000", delete: 7000});
  }


	options = {
	  "name": "youtube",
	  "id": 55,
	  "media": {
	    "description": "\n\nСовместный Ютуб — новая возможность дискорда, в отличии от музыкальных команд видео транслируется напрямую из ютуба, а не к боту и уже потом к каналу. Нагрузка на бота при таком подходе сводится к нулю.\nСамая скучная по своим внутренностям команда.\n\n✏️\n```python\n!youtube #без аргументов\n```\n\n"
	  },
	  "allias": "ютуб ютубвместе youtubetogether ютьюб",
		"allowDM": true,
		"type": "other",
		"myPermissions": 1
	};
};

export default Command;