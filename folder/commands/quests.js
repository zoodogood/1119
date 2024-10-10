import { HOUR } from "#constants/globals/time.js";
import { BaseCommand, BaseFlagSubcommand } from "#lib/BaseCommand.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { DataManager } from "#lib/DataManager/singletone.js";
import QuestManager, { part_of_made } from "#lib/modules/QuestManager.js";
import { CliParser } from "@zoodogood/utils/primitives";
import { FormattingPatterns } from "discord.js";

class Achievement_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--achievement",
    capture: ["--achievement", "-a"],
    expectValue: true,
    description: "Показать описание достужения",
    example: '!quests --achievement "Первый друг"',
  };
  onProcess() {
    const { context, capture } = this;
    const data = QuestManager.questsBase.find(
      (quest) => quest.id === capture || quest.title === capture,
    );
    if (!data) {
      this.process_not_found();
      return;
    }

    const { title, description } = data;
    context.interaction.msg({
      title,
      description: `## ${description}`,
      footer: {
        text: `Опыта: ${data.reward}. Успешно выполнило: ${(part_of_made(data) * 100).toFixed(4)}% от всех пользователей`,
      },
      image: Command.MESSAGE_THEME.thumbnail,
    });
  }

  process_not_found() {
    const achievements = QuestManager.questsBase
      .filter((base) => base.isGlobal && !base.isSecret)
      .map(({ id, description }) => `> \`${id}\`\n> || ${description} ||`)
      .join("\n\n");
    this.context.interaction.msg({
      title: "Список достижений",
      description: `Используйте !quests --achievement {имя_достижения}, чтобы увидеть подробности\n${achievements}`,
    });
  }
}
class MembersFlag_Manager {
  static flag = {
    name: "--members",
    capture: ["--members", "-m"],
    description: "Показывает перечень сегодняшних ежедневных квестов сервера",
  };

  description =
    "Список участников сервер, сгруппированных по их ежедневному квесту";

  GROUP_SPECIAL = {
    Null: "null",
    Complete: "complete",
  };

  constructor(context) {
    this.context = context;
  }

  groupToLabel(group) {
    const [key] = group;
    if (key === this.GROUP_SPECIAL.Null) {
      return "Ждём новых квестов :sparkles:";
    }

    if (key === this.GROUP_SPECIAL.Complete) {
      return "Выполнено";
    }

    return QuestManager.questsBase.get(key).description;
  }

  groupToValue(group) {
    const LIMIT = 30;
    const members = group.at(1);
    const content = members.slice(0, LIMIT).map(String).join(", ");
    return `${content}${members.length > LIMIT ? " ..." : ""}`;
  }

  onProcess() {
    const { guild, channel } = this.context;
    const day = DataManager.data.bot.currentDay;
    const { Null, Complete } = this.GROUP_SPECIAL;

    const groups = { [Null]: [], [Complete]: [] };
    for (const member of guild.members.cache.values()) {
      if (member.user.bot) {
        continue;
      }
      const quest = member.user.data.quest;
      if (quest?.day !== day) {
        groups[Null].push(member);
        continue;
      }
      if (quest.isCompleted) {
        groups[Complete].push(member);
        continue;
      }

      groups[quest.id] ||= [];
      groups[quest.id].push(member);
    }

    const fields = Object.entries(groups)
      .filter(([_, members]) => members.length)
      .map((group) => {
        const name = this.groupToLabel(group);
        const value = this.groupToValue(group);
        return { name, value };
      })
      .reverse();

    channel.msg({
      description: this.description,
      fields,
      ...Command.MESSAGE_THEME,
    });
  }
}

class CommandRunContext extends BaseCommandRunContext {
  dailyQuest;
  dailyQuestBase;
  memb;
  membData;
  membQuests;
  static new(interaction, command) {
    const context = new this(interaction, command);
    context.parseParams(interaction.params);
    return context;
  }

  addMembData(memb) {
    const membData = memb.data;

    QuestManager.checkAvailable({ user: memb });

    const membQuests = (membData.questsGlobalCompleted ?? "")
      .split(" ")
      .filter(Boolean);

    const dailyQuest = membData.quest;
    const dailyQuestBase = QuestManager.questsBase.get(dailyQuest.id);

    Object.assign(this, { membData, membQuests, dailyQuestBase, dailyQuest });
    return this;
  }

  parseParams(params) {
    const parsed = new CliParser()
      .setText(params)
      .processBrackets()
      .captureByMatch({ name: "memb", regex: FormattingPatterns.User })
      .captureFlags(this.command.options.cliParser.flags)
      .collect();

    const values = parsed.resolveValues((capture) => capture?.toString());
    this.setCliParsed(parsed, values);

    this.setMemb(
      parsed.captures.get("memb")?.content.groups.id ||
        this.interaction.user.id,
    );
  }

  setMemb(membId) {
    const { client } = this.interaction;
    const memb = client.users.cache.get(membId);
    this.memb = memb;
    this.addMembData(memb);
    return this;
  }
}

class Command extends BaseCommand {
  static MESSAGE_THEME = {
    image:
      "https://media.discordapp.net/attachments/549096893653975049/830749264928964608/5.png?width=300&height=88",
    thumbnail: "https://cdn.discordapp.com/emojis/830740711493861416.png?v=1",
  };
  options = {
    name: "quests",
    id: 47,
    media: {
      description:
        "Ежедневные и глобальные квесты помогают поднять актив на сервере, ставят цели и награждают за их достижения.\nИспользуя команду, вы можете просмотреть их список, а также статистику.",
      example: `!quests <memb>`,
    },
    alias: "quest квесты квести достижения досягнення",
    cliParser: {
      flags: [MembersFlag_Manager.flag, Achievement_FlagSubcommand.FLAG_DATA],
    },
    accessibility: {
      publicized_on_level: 3,
    },
    allowDM: true,
    cooldown: 5_000,
    type: "user",
  };

  getAchievementsContent(context) {
    const { membQuests } = context;
    const secretAchievements = this.getSecretGlobalQuests();
    const displayedGlobalQuests = this.getDisplayedGlobalQuests();
    return [
      {
        name: "Прогресс достижений:",
        value: `Достигнуто: \`${
          displayedGlobalQuests.filter((quest) => membQuests.includes(quest.id))
            .size
        }/${displayedGlobalQuests.size}\`\nСекретных: \`${
          secretAchievements.filter((quest) => membQuests.includes(quest.id))
            .size
        }/${secretAchievements.size}\``,
      },
    ];
  }

  getDailyQuestContent(context) {
    const { dailyQuest, dailyQuestBase } = context;
    const contents = {
      nextContent: `До обновления: \`${+(
        (new Date().setHours(23, 59, 50) - Date.now()) /
        HOUR
      ).toFixed(1)}ч\``,
    };

    const fields = [
      {
        name: "Сведения последнего квеста:",
        value: `Множитель награды: \`X${dailyQuestBase.reward.toFixed(
          1,
        )}\`\nПрогресс: \`${
          dailyQuest.isCompleted
            ? "Выполнено"
            : `${dailyQuest.progress}/${dailyQuest.goal}`
        }\`\nНазвание: \`${dailyQuest.id}\`\n${contents.nextContent}`,
      },
    ];

    return fields;
  }

  getDisplayedGlobalQuests() {
    const needDisplayGlobalQuest = (questBase) =>
      QuestManager.questIsGlobalAvailable(questBase) &&
      !QuestManager.questIsSecret(questBase);

    return QuestManager.questsBase.filter(needDisplayGlobalQuest);
  }

  getSecretGlobalQuests() {
    const isSecret = (questBase) =>
      QuestManager.questIsGlobalAvailable(questBase) &&
      QuestManager.questIsSecret(questBase);

    return QuestManager.questsBase.filter(isSecret);
  }

  getSeedContent(context) {
    const { membData } = context;
    return [
      {
        name: "Дневные задачи:",
        value: `Выполнено: \`${membData.dayQuests || 0}\`\nДо следующей метки: \`${
          Math.ceil((membData.dayQuests + 1) / 50) * 50 - membData.dayQuests ||
          50
        }\``,
      },
    ];
  }

  globalQuestsToContent(pull, context) {
    return pull
      .map((quest) => this.globalQuestToString(quest, context))
      .join("\n");
  }

  globalQuestToString({ id, title }, { membQuests }) {
    return membQuests.includes(id)
      ? `<a:yes:763371572073201714> **${title}**`
      : `<a:Yno:763371626908876830> ${title}`;
  }

  async onChatInput(msg, interaction) {
    const context = CommandRunContext.new(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }

  processAchievementsFlag(context) {
    const value = context.cliParsed.at(1).get("--achievement");
    if (!value) {
      return;
    }

    new Achievement_FlagSubcommand(context, value).onProcess();
    return true;
  }

  processDefaultBehavior(context) {
    const { memb, channel, membData } = context;

    const displayedGlobalQuests = this.getDisplayedGlobalQuests();

    const fields = [
      ...this.getAchievementsContent(context),
      ...this.getSeedContent(context),
      ...this.getDailyQuestContent(context),
    ];

    channel.msg({
      title: "Доска квестов",
      author: { name: membData.name, iconURL: memb.avatarURL() },
      description: this.globalQuestsToContent(displayedGlobalQuests, context),
      fields,
      ...Command.MESSAGE_THEME,
    });
  }

  processMembersFlag(context) {
    const values = context.cliParsed.at(1);
    if (!values.get("--members")) {
      return;
    }

    new MembersFlag_Manager(context).onProcess();
    return true;
  }

  async run(context) {
    if (this.processMembersFlag(context)) {
      return;
    }

    if (this.processAchievementsFlag(context)) {
      return;
    }

    this.processDefaultBehavior(context);
  }
}

export default Command;
