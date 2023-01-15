import * as Util from '#src/modules/util.js';
import DataManager from '#src/modules/DataManager.js';
import { ButtonStyle, ComponentType } from 'discord.js';
import { Collection } from '@discordjs/collection';

class Command {
  // to-do: rename
  x = new Collection(Object.entries({
    level: {
      key: "level",
      component: {
        value: "level",
        label: "Уровень",
        emoji: "763767958559391795",
        default: true
      },
      value: (element, _context) => {
        return (element.data.level - 1) * 22.5 * element.data.level + element.data.exp;
      },
      display: (element, output, index, _context) => {
        const name = `${ index + 1 }. ${ element.username }`;
        const value = `Уровень: **${ element.data.level }** | Опыта: ${ output }`;
        return {name, value};
      }
    },
    coins: {
      key: "coins",
      component: {
        value: "coins",
        label: "По богатству",
        emoji: "637533074879414272"
      },
      value: (element, _context) => {
        return element.data.coins + element.data.berrys * DataManager.data.bot.berrysPrise;
      },
      display: (element, output, index, _context) => {
        const name = `${ index + 1 }. ${ element.username }`;
        const value = `— ${ element.data.coins } (${ output }) <:coin:637533074879414272>`;
        return {name, value};
      }
    },
    praises: {
      key: "praises",
      component: {
        value: "praises",
        label: "Количество полученных похвал",
        emoji: "630463177314009115"
      },
      value: (element, _context) => {
        return element.data.praiseMe?.length;
      },
      display: (element, output, index, _context) => {
        const name = `${ index + 1 }. ${ element.username }`;
        const value = `— Был похвален ${ Util.ending(output, "раз", "", "", "а") }  <:wellplayed:630463177314009115>`;
        return {name, value};
      }
    },
    thief: {
      key: "thief",
      component: {
        value: "thief",
        label: "По грабежам",
        emoji: "🧤"
      },
      value: (element, _context) => {
        return element.data.thiefCombo + (~~element.data.thiefWins / 5);
      },
      display: (element, output, index, _context) => {
        const name = `${ index + 1 }. ${ element.username }`;
        const value = `Состояние перчаток: \`${ element.data.thiefGloves }|${ element.data.thiefCombo || 0 }\` > Отбито атак: ${ element.data.thiefWins | 0 }`.replace(/-/g, "!");
        return {name, value};
      }
    },
    quests: {
      key: "quests",
      component: {
        value: "quests",
        label: "Достижения",
        emoji: "📜"
      },
      value: (element, _context) => {
        return element.data.dayQuests;
      },
      display: (element, output, index, _context) => {
        const cup = (index == 0) ? "<a:cupZ:806813908241350696> " : (index == 1) ? "<a:cupY:806813850745176114> " : (index == 2) ? "<a:cupX:806813757832953876> " : "";
        const name =  `${ cup } ${ index + 1 }. ${ element.username }`;
        const value = `Выполнено ежедневных квестов: ${ output } | Глобальных: ${(element.data.completedQuest || []).length}/${Object.values(quests.names).length}`;
        return {name, value};
      }
    },
    witch: {
      key: "witch",
      component: {
        value: "witch",
        label: "Использования",
        emoji: "⚜️"
      },
      value: (element, _context) => {
        return element.data.voidRituals;
      },
      display: (element, output, index, _context) => {
        const username = element.id === interaction.user.id ? "?".repeat(element.username.length) : element.username;
        const addingName = (index === 0 ? " <a:neonThumbnail:806176512159252512>" : "") + (Util.random(9) ? "" : " <a:void:768047066890895360>");
        const name = `${ index + 1 }. ${ username }${ addingName }`;
        const value = `Использований котла ${ Util.random(3) ? element.data.voidRituals : "???" }`;
        return {name, value};
      }
    },
    boss: {
      key: "boss",
      component: {
        value: "boss",
        label: "Смотреть на урон по боссу",
        emoji: "⚔️"
      },
      filter: (context) => context.boss.isArrived,
      value: (element, context) => {
        return BossManager.getUserStats(context.boss, element.id).dealtDamage;
      },
      display: (element, output, index, context) => {
        const name = `${ index + 1 }. ${ user.username }`;
        const value = `Великий воин нанёс ${ output } (${ (output * 100 / context.boss.damageTaken).toFixed(1) }%) урона`;
        return {name, value};
      }
    },
    chest: {
      key: "chest",
      component: {
        value: "chest",
        label: "Количество бонусов сундука",
        emoji: "805405279326961684"
      },
      value: (element, context) => {
        return element.data.chestBonus;
      },
      display: (element, output, index, context) => {
        const name = `${ index + 1 }. ${ user.username }`;
        const value = output.toString(2);
        return {name, value};
      }
    }
  }));


  createComponents(context){
    return [
      [
        {
          type: ComponentType.Button,
          label: "",
          emoji: "640449848050712587",
          customId: "previous",
          style: ButtonStyle.Secondary,
          filter: context.page !== 0
        },
        {
          type: ComponentType.Button,
          label: "",
          emoji: "640449832799961088",
          customId: "next",
          style: ButtonStyle.Secondary,
          filter: context.pages.length > 1 && context.page !== context.pages.length - 1
        },
        {
          type: ComponentType.Button,
          label: "Выбрать",
          customId: "selectPage",
          style: ButtonStyle.Secondary,
          filter: context.pages.length > 1
        }
      ],
      [{
        type: ComponentType.StringSelect,
        options: this.x.map(x => x.component),
        customId: "selectFilter"
      }]
    ]
  };

	async onChatInput(msg, interaction){
    let guild = msg.guild;
    let others = ["637533074879414272", "763767958559391795", "630463177314009115", "🧤", "📜", "⚜️", (guild.data.boss?.isArrived ? "⚔️" : null)];

    let users = guild.members.cache.map(element => element.user).filter(el => !el.bot && !el.data.profile_confidentiality).sort((b, a) => ( (a.data.level - 1) * 22.5 * a.data.level + a.data.exp) - ( (b.data.level - 1) * 22.5 * b.data.level + b.data.exp));
    let rangs, sort;

    let pages = [];

    let page = 0;
    let embed = {
      fields: pages[0],
      author: {name: `Топ на сервере ${ guild.name }`, iconURL: guild.iconURL()}, title: "Загрузка Топа..",
      components: this.createComponents({pages: []})
    };
    if (pages[1]) embed.footer = {text: `Страница: ${page + 1} / ${pages.length}`};
    let message = await msg.msg(embed);
    let react = "763767958559391795";
    let index = -1;


    embed.edit = true;

    while (true){
      switch (react) {
        case "640449832799961088": page++;
        break;
        case "640449848050712587": page--;
        break;



        default: return;
      }

      if (react != "640449848050712587" && react != "640449832799961088"){
        page = 0;
        pages = [];
        while (rangs.length) pages.push(rangs.splice(0, 15));
      }
      embed.message = index !== -1 ? `Вы находитесь на ${ index + 1 } месте, ${ msg.author.username }` : `Вы не числитесь в этом топе, ${ msg.author.username }`
      embed.footer = (pages[1]) ? {text: `Страница: ${page + 1} / ${pages.length}`} : null;
      embed.fields = (pages[0]) ? pages[page] : [{name: "Ещё никто не попал в топ", value: "Значит вы лёгко можете стать первым(-ой)"}];

      message = await message.msg(embed);
      react = await message.awaitReact({user: msg.author, removeType: "all"}, (page != 0 ? "640449848050712587" : null), ((pages[1] && page != pages.length - 1) ? "640449832799961088" : null), ...others.filter(element => element != react));
    }

  }


	options = {
	  "name": "top",
	  "id": 16,
	  "media": {
	    "description": "\n\nОтображает список лидеров на сервере по различным показателям.\n\nСуществующие данные:\n• Количество коинов\n• Уровень\n• Похвалы\n• Успешность краж\n• Статистика квестов\n• Использование котла\n\n:pencil2:\n```python\n!top #без аргументов\n```\n\n"
	  },
	  "allias": "топ ранги rank ranks rangs лидеры leaderboard leaders",
		"allowDM": true,
		"cooldown": 20000000,
		"type": "user",
		"Permissions": 16384
	};
};

export default Command;