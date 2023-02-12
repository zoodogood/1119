'use strict';

import * as Util from '#lib/modules/util.js';
import DataManager from '#lib/modules/DataManager.js';
import { ButtonStyle, ComponentType, TextInputStyle } from 'discord.js';
import { Collection } from '@discordjs/collection';
import BossManager from '#lib/modules/BossManager.js';
import { CreateModal } from '@zoodogood/utils/discordjs';
import { CustomCollector } from '@zoodogood/utils/objectives';
import QuestManager from '#lib/modules/QuestManager.js';


class Command {

  PAGE_SIZE = 15;

  leaderboardTypes = new Collection(Object.entries({
    level: {
      key: "level",
      component: {
        value: "level",
        label: "Уровень",
        emoji: "763767958559391795"
      },
      value: (element, _context) => {
        return (element.data.level - 1) * 22.5 * element.data.level + element.data.exp;
      },
      display: (element, output, index, _context) => {
        const name = `${ index + 1 }. ${ element.username }`;
        const value = `Уровень: **${ element.data.level }** | Опыта: ${ Util.NumberFormatLetterize(output) }`;
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
        const value = `— ${ element.data.coins } (${ Util.NumberFormatLetterize(output) }) <:coin:637533074879414272>`;
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
        const value = `Выполнено ежедневных квестов: ${ output } | Глобальных: ${ (element.data.completedQuest || []).length}/${QuestManager.questsBase.filter(base => base.isGlobal).size }`;
        return {name, value};
      }
    },
    witch: {
      key: "witch",
      component: {
        value: "witch",
        label: "Использования котла",
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
        return BossManager.getUserStats(context.boss, element.id).damageDealt;
      },
      display: (element, output, index, context) => {
        const name = `${ index + 1 }. ${ element.username }`;
        const value = `Великий воин нанёс ${ Util.NumberFormatLetterize(output) } (${ (output * 100 / context.boss.damageTaken).toFixed(1) }%) урона`;
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
        const value = `0b${ output.toString(2) } (${ output })`;
        return {name, value};
      }
    }
  }));


  onComponent(params){
    
  }

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
        options: this.leaderboardTypes
          .filter((leaderboard) => !leaderboard.filter || leaderboard.filter(context))
          .map(leaderboard => leaderboard.component)
          ,

        customId: "selectFilter",
        placeholder: "Сменить"
      }]
    ]
  };

  createEmbed({interaction, context, edit = false}){
    const { pages, page, selected, values } = context;
    const fields = values
      .slice(page * this.PAGE_SIZE, page * this.PAGE_SIZE + this.PAGE_SIZE)
      .map(([user, output], index) => selected.display(user, output, (index + page * this.PAGE_SIZE), context));

    const executorIndex = values.findIndex(([user]) => user === interaction.user);

    if (!fields.length){
      fields.push({name: "Ещё никто не попал в топ", value: "Значит вы лёгко можете стать первым(-ой)"});
    }

    return {
      title: executorIndex !== -1 ? `Вы находитесь на ${ executorIndex + 1 } месте, ${ interaction.user.username }` : `Вы не числитесь в этом топе, ${ interaction.user.username }`,
      fields,
      edit,
      author: {
        name: `Топ на сервере ${ context.guild.name }・${ selected.component.label }`,
        iconURL: context.guild.iconURL()
      },
      components: this.createComponents(context),
      footer: pages > 1 ? {text: `Страница: ${ page + 1 } / ${ pages }`} : null
    };
  }

  createValuesMap(context){
    const pull = context.sortedPull = 
      context.sortedPull ?? context.users.map(user => [user]);

    
    for (const entrie of pull){
      entrie[1] = context.selected.value(entrie[0], context);
    }

    pull
      .sort((a, b) => b.at(1) - a.at(1));

    return pull.filter(([_user, value]) => value);
  }

  async onCollect(interaction, context){
    const responceTo = (replitableInteraction = interaction) => {
      context.pages = this.calculatePages(context.values.length);
      const embed = this.createEmbed({interaction: context.interaction, context, edit: true});
      replitableInteraction.msg(embed);
    }
    await this.componentsCallbacks[interaction.customId](interaction, context, responceTo);
  }

  componentsCallbacks = {
    previousPage: (interaction, context, responceTo) => {
      context.page--;
      responceTo();
    },
    nextPage: (interaction, context, responceTo) => {
      context.page++;
      responceTo();
    },
    selectPage: async (interaction, context, responceTo) => {
      const user = interaction.user;
      const title = "Перейти к странице";
      const customId = "pageSelectValue";
      const components = {
        type: ComponentType.TextInput,
        style: TextInputStyle.Short,
        label: "Укажите число",
        placeholder: `От 1 до ${ context.pages }`,
        customId
      };
      const modal = CreateModal({customId, title, components});
      await interaction.showModal(modal);

      const filter = ([interaction]) => customId === interaction.customId && user === interaction.user;
      const collector = new CustomCollector({target: interaction.client, event: "interactionCreate", filter, time: 300_000});
      collector.setCallback((interaction) => {
        collector.end();
        
        const value = (+interaction.fields.getField("pageSelectValue").value - 1) || context.page;
        context.page = Math.max(Math.min(context.pages, value), 1);
        responceTo(interaction);
        return;
      });
    },
    selectFilter: (interaction, context, responceTo) => {
      const value = interaction.values.at(0);
      context.selected = this.leaderboardTypes.find(leaderboard => leaderboard.component.value === value);
      context.values = this.createValuesMap(context);

      responceTo();
    }
  }

	async onChatInput(msg, interaction){

    const users = interaction.guild.members.cache.map(element => element.user)
      .filter(element => !element.bot && !element.data.profile_confidentiality);

    const context = {
      interaction,
      sortedPull: null,
      users,
      pages: null,
      page: 0,
      guild: interaction.guild,
      boss: interaction.guild.data.boss ?? {},
      selected: this.leaderboardTypes.at(0),
      values: null
    };

    context.values = this.createValuesMap(context);
    context.pages = this.calculatePages(context.values.length);

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
		"Permissions": 16384n
	};
};

export default Command;