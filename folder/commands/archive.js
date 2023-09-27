import Discord from 'discord.js';

class Command {

	async onChatInput(msg, interaction){
    let
      channel      = msg.channel,
      sum_messages = [],
      options      = {limit: 100},
      time         = 0,
      date         = new Date(),
      last_id;

    while (true) {
      if (last_id) options.before = last_id;
      const messages = await channel.messages.fetch(options, false);
      sum_messages.push(...messages.values());
      last_id = messages.last().id;
      if (messages.size != 100) break;
      if (++time == 20) msg.msg({title: "Нужно немного подождать", delete: 3000})
      if (++time == 50) msg.msg({title: "Ждите", delete: 3000})
    }

    let input = date + "\n\n", last;
    sum_messages.reverse().forEach(item => {
      if (!last || last.author.tag != item.author.tag){
        let date = new Date(item.createdTimestamp);
        input += "\n    ---" + item.author.tag + " " + date.getHours() + ":" + date.getMinutes() + "\n";
      }
      input += item.content + "\n";
      last = item;
    });

    let buffer = Buffer.from(input.replace("undefined", ""), "utf-8");

    msg.msg({title: new Discord.MessageAttachment(buffer, (interaction.params || "archive") + ".txt"), embed: true});
    if (time > 35) msg.msg({title: "Вот ваша печенька ожидания 🍪"});
  }


	options = {
	  "name": "archive",
	  "id": 10,
	  "media": {
	    "description": "\n\nАрхивирует сообщения в канале и отправляет содержимое пользователю в виде файла.\n\n✏️\n```python\n!archive #без аргументов\n```\n\n"
	  },
	  "allias": "arhive архив",
		"allowDM": true,
		"cooldown": 36_00_000,
		"type": "delete",
		"Permissions": 16
	};
};

export default Command;