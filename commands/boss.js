import * as Util from '#src/modules/util.js';
import { client } from '#src/index.js';
import BossManager from '#src/modules/BossManager.js';

class Command {

	async onChatInput(msg, interaction){
    const member = interaction.mention ?? msg.author;

    const guild = msg.guild;
    const boss = guild.data.boss;

    if (!boss.isArrived){
      const description = boss.apparanceAtDay ? 
        `Прибудет лишь ${ Util.toDayDate(boss.apparanceAtDay * 86_400_000) }` :
        "Момент появления босса пока неизвестен";

      msg.msg({description, color: "#000000"});
      return;
    }

    

    const currentHealthPointPercent = Math.ceil((1 - boss.damageTaken / boss.healthThresholder) * 100);
    const description = `Уровень: ${ boss.level }.\nУйдет ${ Util.toDayDate(boss.endingAtDay * 86_400_000) }\n\nПроцент здоровья: ${ currentHealthPointPercent }%`;
    const reactions = ["⚔️", "🕋"];
    const fields = [
      {
        name: "Пользователь",
        value: Object.entries(BossManager.getUserStats(boss, member.id))
          .map(([key, value]) => `${ key }: ${ Util.toLocaleDelevoperString(value) }`)
          .join("\n")
        
      }
    ];

    const embed = {
      description,
      reactions,
      fields,
      thumbnail: "https://media.discordapp.net/attachments/629546680840093696/1038714401861161000/pngegg_1.png?width=595&height=593",
      footer: {text: member.tag, iconURL: member.avatarURL()}
    }
    const message = await msg.msg(embed);
    
    const filter = (reaction, user) => user.id !== client.user.id && reactions.includes(reaction.emoji.name);
    const collector = message.createReactionCollector({filter, time: 60_000});
    collector.on("collect", async (reaction, user) => {
      reaction.users.remove(user);

      if (reaction.emoji.name === "⚔️"){
        BossManager.userAttack({boss, user, channel: message.channel});
      }

      if (reaction.emoji.name === "🕋"){
        BossManager.createShop({channel: message.channel, user, guild: message.guild});
      }
    });

    collector.on("end", () => message.reactions.removeAll());

  }


	options = {
	  "name": "boss",
	  "id": 59,
	  "media": {
	    "description": "\n\nБосс страшен. Победите его вместе или проиграйте по-одиночке. Он появляется один раз месяц и уходит спустя три дня.\n\n:pencil2:\n```python\n!boss <member>\n```"
	  },
	  "allias": "босс",
		"allowDM": true,
		"type": "other"
	};
};

export default Command;