import * as Util from '#src/modules/util.js';
import { client } from '#src/index.js';
import BossManager from '#src/modules/BossManager.js';
import { ButtonStyle, ComponentType } from 'discord.js';

class Command {

  createEmbed({userEffects, userStats, member, boss}){
    const currentHealthPointPercent = 1 - boss.damageTaken / boss.healthThresholder;
    

    const contents = {
      currentHealth: BossManager.isElite(boss) ?
        Math.max(currentHealthPointPercent * 100, 0.1).toFixed(1) :
        Math.ceil(currentHealthPointPercent * 100),

      leaveDay: `Уйдет ${ Util.toDayDate(boss.endingAtDay * 86_400_000) }`,
      level: `Уровень: ${ boss.level }.`
    };

    
    const description = `${ contents.level }\n${ contents.leaveDay }\n\nПроцент здоровья: ${ contents.currentHealth }%`;
    const fields = [
      {
        name: "Пользователь",
        value: Object.entries(userStats)
          .map(([key, value]) => `${ key }: ${ Util.toLocaleDeveloperString(value) }`)
          .join("\n")
        
      },
      {
        name: "Эффекты:",
        value: userEffects
          .map(({id}) => id)
          .join(",\n"),

        display: userEffects && userEffects.length
      }
    ]
    .filter((field) => "display" in field === false || field.display);

    const embed = {
      description,
      fields,
      thumbnail: boss.avatarURL,
      footer: {text: member.tag, iconURL: member.avatarURL()}
    }

    return embed;
  }

	async onChatInput(msg, interaction){
    const member = interaction.mention ?? msg.author;

    const guild = msg.guild;
    const boss = guild.data.boss ?? {};
    
    if (!boss.isArrived){
      const description = boss.apparanceAtDay ? 
        `Прибудет лишь ${ Util.toDayDate(boss.apparanceAtDay * 86_400_000) }` :
        "Момент появления босса пока неизвестен";

      msg.msg({description, color: "#000000"});
      return;
    };

    const userStats   = BossManager.getUserStats(boss, member.id);
    const userEffects = BossManager.effectsOf({boss, user: member});

    const context = {
      interaction,
      member,
      boss,
      userStats,
      userEffects
    }

    if (userStats.heroIsDead){
      this.displayHeadstone(context);
      return;
    }

    
    const embed = this.createEmbed(context);
    const reactions = ["⚔️", "🕋"];
    const message = await msg.msg({...embed, reactions});
    
    const filter = (reaction, user) => user.id !== client.user.id && reactions.includes(reaction.emoji.name);
    const collector = message.createReactionCollector({filter, time: 60_000});
    collector.on("collect", async (reaction, user) => {
      reaction.users.remove(user);

      if (reaction.emoji.name === "⚔️"){
        BossManager.userAttack({boss, user, channel: message.channel});
      }

      if (reaction.emoji.name === "🕋"){
        BossManager.BossShop.createShop({channel: message.channel, user, guild: message.guild});
      }

      const embed = this.createEmbed(context);
      message.msg({...embed, edit: true});
    });

    collector.on("end", () => message.reactions.removeAll());
  }

  async displayHeadstone({interaction, member, boss}){
    const guild = interaction.guild;
    const contents = {
      level: `Уровень: ${ member.data.level }.`,
      joined: `Появился: ${ new Intl.DateTimeFormat("ru-ru", {year: "numeric", month: "2-digit", day: "2-digit"}).format(guild.members.resolve(member).joinedTimestamp) }`,
      heroStatus: "Выдуманный персонаж был искалечен и умертвлён, или просто умер. В таком состоянии методы атаки и использование реликвий заблокированны.\n",
      save: ""
    }
    const embed = {
      description: `${ contents.level }\n${ contents.joined }\n\n${ contents.heroStatus }`,
      thumbnail: "https://cdn.discordapp.com/attachments/629546680840093696/1063465085235900436/stone.png",
      components: {type: ComponentType.Button, style: ButtonStyle.Danger, customId: "KeepAlive", label: "Показать характер. Дать воскреснуть."},
      footer: {iconURL: member.avatarURL(), text: member.tag}
    };
    const message = await interaction.channel.msg(embed);
    const collector = message.createMessageComponentCollector({time: 120_000});

    collector.on("collect", (interaction) => {
      const user = interaction.user;
      const userStats = BossManager.getUserStats(boss, user.id);
      if (userStats.heroIsDead){
        interaction.msg({ephemeral: true, content: "Ввысь и вниз; В окно, и там будет снег. Забудь об этом — ты мертвец."});
        return;
      }

      const effectBase = BossManager.effectBases.get("deadlyCurse");
      BossManager.applyEffect({guild, user, effectBase});
      interaction.msg({
        description: `Примите и избавьтесь от быстродействующего проклятия. Провалите — та же участь под камнем.\n**Предостережение:** его не всегда возможно снять в срок.`,
        footer: {text: user.tag, iconURL: user.avatarURL()}
      });
      collector.stop();
    });
    
    collector.on("end", () => message.msg({edit: true, components: []}));
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
