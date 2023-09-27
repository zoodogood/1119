import * as Util from '#lib/util.js';
import { client } from '#bot/client.js';

class Command {

	async onChatInput(msg, interaction){
    let heAccpet = await Util.awaitUserAccept({name: "idea", message: {title: "<a:crystal:637290417360076822> Подать идею", description: "После подтверждения этого сообщения, текст, который вы ввели вместе с командой, будет отправлен разработчику.\nВсё идеи попадают **[сюда.](https://discord.gg/76hCg2h7r8)**"}, channel: msg.channel, userData: interaction.userData});
    if (!heAccpet) return msg.author.msg({title: "Ваша идея не была отправлена так как вы не подтвердили отправку", description: "Текст идеи:\n" + interaction.params, color: "#ff0000"});

    let channel = client.guilds.cache.get("752898200993660959").channels.cache.get("753587805195862058");

    const getIdeaNumber = async () => {
      const messages = await channel.messages.fetch();
      const lastIdeaMessage = messages.find(message => message.author === client.user);
      return Util.match(lastIdeaMessage.embeds[0].author.name, /#\d+/).slice(1);
    }


    const ideaNumber = await getIdeaNumber();

    channel.msg({title: "<:meow:637290387655884800> Какая классная идея!", 
      description: "**Идея:**\n" + interaction.params, color: interaction.userData.profile_color || "#00ffaf",
      author: {
        name: `${msg.author.username} #${ +ideaNumber + 1 }`,
        iconURL: msg.author.avatarURL()
      },
      reactions: ["814911040964788254", "815109658637369377"]});
    msg.msg({title: "<:meow:637290387655884800> Вы отправили нам свою идею! Спасибо!", description: `А что, идея «${interaction.params}» весьма не плоха...`, color: "#00ffaf", author: {name: msg.author.username, iconURL: msg.author.avatarURL()} });
  }


	options = {
	  "name": "idea",
	  "id": 24,
	  "media": {
	    "description": "\n\nЕсли у вас есть идеи как можно улучшить бота — с помощью этой команды отправьте её на сервер.\nНе забудьте позже обсудить её в чате, подробно расписывая особенности вы повышаете вероятность того, что она будет реализована.\n\n\n✏️\n```python\n!idea {content}\n```\n\n"
	  },
	  "allias": "идея innovation новвоведение",
		"allowDM": true,
		"expectParams": true,
		"cooldown": 12_00_000,
		"type": "bot"
	};
};

export default Command;