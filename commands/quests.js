import { client } from '#src/index.js';
import QuestManager from '#src/modules/QuestManager.js';

class Command {

	async onChatInput(msg, interaction){
    let memb = ((interaction.mention) ? interaction.mention : (interaction.params) ? client.users.cache.get(interaction.params) : msg.author);
    let user = memb.data;

    QuestManager.checkAvailable({user: msg.author});

    const userQuests = (user.questsGlobalCompleted ?? "").split(" ").filter(Boolean);
    const globalQuestsList = QuestManager.questsBase.filter(quest => quest.isGlobal);

    let globalQuestsContent = globalQuestsList
      .map(({id, title}) => userQuests.includes(id) ? `<a:yes:763371572073201714> **${ title }**` : `<a:Yno:763371626908876830> ${ title }`)
      .join("\n");

    const secretAchievements = ["voidIce", "crown"];

    const dailyQuest = {
      nextContent: `До обновления: \`${ +((new Date().setHours(23, 59, 50) - Date.now()) / 3_600_000).toFixed(1) }ч\``,
      questBase: QuestManager.questsBase.get(user.quest.id),
      ...user.quest
    }

    const fields = [
      {
        name: "Прогресс достижений:",
        value: `Достигнуто: \`${ userQuests.length }/${ globalQuestsList.size }\`\nСекретных: \`${ secretAchievements.filter(keyword => keyword in user).length }/${ secretAchievements.length }\``
      },
      {
        name: "Дневные задачи:",
        value: `Выполнено: \`${user.dayQuests || 0}\`\nДо следующей метки: \`${Math.ceil((user.dayQuests + 1) / 50) * 50 - user.dayQuests || 50}\``
      },
      {
        name: "Сведения последнего квеста:",
        value: `Множитель награды: \`X${ dailyQuest.questBase.reward.toFixed(1) }\`\nПрогресс: \`${ dailyQuest.isCompleted ? "Выполнено" : `${ dailyQuest.progress }/${ dailyQuest.goal }`}\`\nНазвание: \`${dailyQuest.id }\`\n${ dailyQuest.nextContent }`
      }
    ]
    msg.msg({title: "Доска квестов", author: {name:  user.name, iconURL: memb.avatarURL()}, description: globalQuestsContent, fields, image: "https://media.discordapp.net/attachments/549096893653975049/830749264928964608/5.png?width=300&height=88", thumbnail: "https://cdn.discordapp.com/emojis/830740711493861416.png?v=1"})
  }


	options = {
	  "name": "quests",
	  "id": 47,
	  "media": {
	    "description": "\n\nЕжедневные и глобальные квесты помогают поднять актив на сервере, ставят цели и награждают за их достижения.\nИспользуя команду, вы можете просмотреть их список, а также статистику.\n\n:pencil2:\n```python\n!quests <memb>\n```\n\n"
	  },
	  "allias": "quest квесты",
		"allowDM": true,
		"cooldown": 35000000,
		"type": "user"
	};
};

export default Command;