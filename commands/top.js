import * as Util from '#src/modules/util.js';
import DataManager from '#src/modules/DataManager.js';
import { ButtonStyle, ComponentType } from 'discord.js';
import { Collection } from '@discordjs/collection';

class Command {

  PAGE_SIZE = 15;
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
      display: (element, output, index, context) => {
        const username = element.id === context.interaction.user.id ? "?".repeat(element.username.length) : element.username;
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
        const name = `${ index + 1 }. ${ element.username }`;
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
        const name = `${ index + 1 }. ${ element.username }`;
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
          customId: "previousPage",
          style: ButtonStyle.Secondary,
          disabled: context.page === 0
        },
        {
          type: ComponentType.Button,
          label: "",
          emoji: "640449832799961088",
          customId: "nextPage",
          style: ButtonStyle.Secondary,
          disabled: context.pages <= 1 || context.page === context.pages - 1
        },
        {
          type: ComponentType.Button,
          label: `Страница #${ context.page + 1 }`,
          customId: "selectPage",
          style: ButtonStyle.Secondary,
          disabled: context.pages <= 1
        }
      ],
      [{
        type: ComponentType.StringSelect,
        options: this.x.map(x => x.component),
        customId: "selectFilter",
        placeholder: "Выбрать..."
      }]
    ]
  };

  createEmbed({interaction, context, edit = false}){
    const { pages, page, selected, values } = context;
    const fields = values
      .slice(page * this.PAGE_SIZE, page * this.PAGE_SIZE + this.PAGE_SIZE)
      .map(([user, output], index) => selected.display(user, output, index, context));

    const executorIndex = values.findIndex(([user]) => user === interaction.user);

    if (!fields.length){
      fields.push({name: "Ещё никто не попал в топ", value: "Значит вы лёгко можете стать первым(-ой)"});
    }

    
    return {
      title: executorIndex !== -1 ? `Вы находитесь на ${ executorIndex + 1 } месте, ${ interaction.user.username }` : `Вы не числитесь в этом топе, ${ interaction.user.username }`,
      fields,
      edit,
      author: {name: `Топ на сервере ${ context.guild.name }`, iconURL: context.guild.iconURL()},
      components: this.createComponents(context),
      footer: pages > 1 ? {text: `Страница: ${ page + 1 } / ${ pages }`} : null
    };
  }

  createValuesMap(context){
    const valuesMap = context.values ?? context.users.map(user => [user]);

    for (const entrie of valuesMap){
      entrie[1] = context.selected.value(entrie[0], context);
    }

    return valuesMap
      .sort((a, b) => b.at(1) - a.at(1));
  }

  async onCollect(interaction, context){
    await this.componentsCallbacks[interaction.customId](interaction, context);

    context.pages = this.calculatePages(context.values);

    const embed = this.createEmbed({interaction: context.interaction, context, edit: true});
    interaction.msg(embed);
  }

  componentsCallbacks = {
    previousPage: (interaction, context) => {
      context.page--;
    },
    nextPage: (interaction, context) => {
      context.page++;
    },
    selectPage: (interaction, context) => {
      interaction.msg(embed);
    },
    selectFilter: (interaction, context) => {
      const value = interaction.values.at(0);
      context.selected = this.x.find(x => x.component.value === value);
      context.values = this.createValuesMap(context);

      
    }
  }

	async onChatInput(msg, interaction){

    const users = interaction.guild.members.cache.map(element => element.user)
      .filter(element => !element.bot && !element.data.profile_confidentiality);

    const context = {
      interaction,
      users,
      pages: null,
      page: 0,
      guild: interaction.guild,
      boss: interaction.guild.data.boss ?? {},
      selected: this.x.find(x => x.component.default),
      values: null
    };

    context.values = this.createValuesMap(context);

    const embed = this.createEmbed({interaction, context, edit: false});

    context.message = await interaction.channel.msg(embed);
    const filter = interaction => interaction.user === context.interaction.user;
    const collector = context.message.createMessageComponentCollector({filter, time: 180_000});
    collector.on("collect", (interaction) => this.onCollect(interaction, context));
    collector.on("end", () => {
      context.message.msg({components: [], edit: true});
    })
  }

  calculatePages(elementsCount){
    return Math.ceil(elementsCount / this.PAGE_SIZE);
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