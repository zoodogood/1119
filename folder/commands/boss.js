import { BaseCommand } from "#lib/BaseCommand.js";
import * as Util from "#lib/util.js";
import { client } from "#bot/client.js";
import { BossManager, BossEffects } from "#lib/modules/BossManager.js";
import { ButtonStyle, ComponentType } from "discord.js";
import CurseManager from "#lib/modules/CurseManager.js";
import { DAY } from "#constants/globals/time.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { CliParser } from "@zoodogood/utils/primitives";

function attackBoss(boss, user, channel) {
  return BossManager.userAttack({ boss, user, channel });
}

function createShop(guild, user, channel) {
  return BossManager.BossShop.createShop({
    channel: channel,
    user,
    guild: guild,
  });
}

class BossesCommandManager {
  constructor(context) {
    this.context = context;
  }
  onProcess() {
    const { interaction } = this.context;
    const memb = interaction.mention || interaction.user;
    const { guilds } = memb;
    const fields = Util.sortByResolve(
      guilds.filter((guild) => guild.data.boss),
      ({ data: { boss } }) =>
        boss.isArrived ? Number.MIN_SAFE_INTEGER : +boss.apparanceAtDay || 0,
      { reverse: true },
    )
      .map((guild) => this.guildToField(guild))
      .slice(0, 20);

    const { channel } = this.context;
    channel.msg({
      description: "Ваши сервера с боссом",
      fields,
    });
  }

  guildToField(guild) {
    const { boss } = guild.data;
    const isArrived = boss.isArrived;
    const { name } = guild;
    const contents = {
      endsAt: boss.endingAtDay
        ? Util.toDayDate(boss.endingAtDay * DAY)
        : "Никогда",
    };
    const value = isArrived
      ? `Пришёл (${boss.level} ур.), уйдет ${contents.endsAt}`
      : `Придёт ${Util.toDayDate((boss.apparanceAtDay + 1) * DAY)}`;
    return { name, value };
  }
}

class HelpCommandManager {
  constructor(context) {
    this.context = context;
  }
  onProcess() {
    const { channel } = this.context;
    channel.msg({
      content:
        "Атакуйте босса, чтобы получить больше наград. В его лавке вы можете приобрести усилители, которые становятся дороже с каждой покупкой. Поэтому распоряжайтесь валютой разумно. Время от времени босс будет накладывать проклятия. Имейте ввиду, что эти самые проклятия, — козырный источник прибыли и их стоит проходить. Объединяйтесь в кланы, чтобы получать прибавку к урону и добраться до глобальной таблицы лидеров. Напоминаю, что основным эпилогом бота является открытие 20 !котлов и хорошее времяпровождение\n\n",
    });
  }
}
class CommandRunContext extends BaseCommandRunContext {
  memb;
  boss;
  userStats;
  userEffects;
  parseCli(params) {
    const parsed = new CliParser()
      .setText(params)
      .processBrackets()
      .captureFlags(this.command.options.cliParser.flags)
      .collect();

    const values = parsed.resolveValues((capture) => capture?.toString());
    this.setCliParsed(parsed, values);
  }

  static async new(interaction, command) {
    const context = new this(interaction, command);
    const memb = interaction.mention ?? interaction.user;
    const boss = interaction.guild.data.boss ?? {};
    Object.assign(context, { memb, boss });
    return context;
  }
}

class Command extends BaseCommand {
  createEmbed({ userEffects, userStats, memb, boss }) {
    const currentHealthPointPercent =
      1 - boss.damageTaken / boss.healthThresholder;

    const toFixed = Math.ceil(boss.level / 30);

    const contents = {
      currentHealth: BossManager.isElite(boss)
        ? Math.max(currentHealthPointPercent * 100, 0.1).toFixed(toFixed)
        : Math.ceil(currentHealthPointPercent * 100),

      leaveDay: `Уйдет ${
        boss.endingAtDay ? Util.toDayDate(boss.endingAtDay * DAY) : "Никогда"
      }`,
      level: `Уровень: ${boss.level}.`,
    };

    const description = `${contents.level}\n${contents.leaveDay}\n\nПроцент здоровья: ${contents.currentHealth}%`;
    const fields = [
      {
        name: "Пользователь",
        value: Object.entries(userStats)
          .map(
            ([key, value]) => `${key}: ${Util.toLocaleDeveloperString(value)}`,
          )
          .join("\n"),
      },
      {
        name: "Эффекты:",
        value: userEffects.map(({ id }) => id).join(",\n"),

        display: userEffects && userEffects.length,
      },
    ].filter((field) => "display" in field === false || field.display);

    const embed = {
      description,
      fields,
      thumbnail: boss.avatarURL,
      footer: { text: memb.tag, iconURL: memb.avatarURL() },
    };

    return embed;
  }

  async onChatInput(msg, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }

  async run(context) {
    context.parseCli(context.interaction.params);
    if (await this.processHelpFlag(context)) {
      return;
    }
    if (await this.processShopFlag(context)) {
      return;
    }
    if (await this.processAttackFlag(context)) {
      return;
    }
    if (await this.processBossesFlag(context)) {
      return;
    }
    await this.processDefaultBehavior(context);
  }

  async processHelpFlag(context) {
    const values = context.cliParsed.at(1);
    if (!values.get("--help")) {
      return;
    }
    await new HelpCommandManager(context).onProcess();
    return true;
  }

  async processBossesFlag(context) {
    const values = context.cliParsed.at(1);
    if (!values.get("--bosses")) {
      return;
    }
    await new BossesCommandManager(context).onProcess();
    return true;
  }

  async processShopFlag(context) {
    const values = context.cliParsed.at(1);
    if (!values.get("--shop")) {
      return;
    }

    if (!this.processBossIsExists(context)) {
      return true;
    }

    await createShop(context.guild, context.user, context.channel);
    return true;
  }

  async processAttackFlag(context) {
    const values = context.cliParsed.at(1);
    if (!values.get("--attack")) {
      return;
    }

    if (!this.processBossIsExists(context)) {
      return true;
    }

    await attackBoss(context.boss, context.user, context.channel);
    await this.processDefaultBehavior(context);
    return true;
  }

  processBossIsExists(context) {
    const { boss, channel } = context;
    if (!boss.isArrived) {
      const description = boss.apparanceAtDay
        ? `Прибудет лишь ${Util.toDayDate((boss.apparanceAtDay + 1) * DAY)}`
        : "Момент появления босса пока неизвестен";

      channel.msg({ description, color: "#000000" });
      return;
    }

    return true;
  }

  async processDefaultBehavior(context) {
    const { boss, memb, channel } = context;

    if (!this.processBossIsExists(context)) {
      return;
    }

    const userStats = BossManager.getUserStats(boss, memb.id);
    const userEffects = BossEffects.effectsOf({ boss, user: memb });

    Object.assign(context, {
      userStats,
      userEffects,
    });

    if (userStats.heroIsDead) {
      this.displayHeadstone(context);
      return;
    }

    const REACTIONS = [
      {
        emoji: "⚔️",
        filter: ({ boss }) => !BossManager.isDefeated(boss),
      },
      {
        emoji: "🕋",
        filter: () => true,
      },
    ];

    const embed = this.createEmbed(context);
    const reactions = REACTIONS.filter((reaction) =>
      reaction.filter(context),
    ).map(({ emoji }) => emoji);

    const message = await channel.msg({ ...embed, reactions });

    const filter = (reaction, user) =>
      user.id !== client.user.id && reactions.includes(reaction.emoji.name);
    const collector = message.createReactionCollector({ filter, time: 60_000 });
    collector.on("collect", async (reaction, user) => {
      reaction.users.remove(user);

      if (reaction.emoji.name === "⚔️") {
        attackBoss(boss, user, channel);
      }

      if (reaction.emoji.name === "🕋") {
        createShop(channel.guild, user, channel);
      }

      const embed = this.createEmbed(context);
      message.msg({ ...embed, edit: true });
    });

    collector.on("end", () => message.reactions.removeAll());
  }

  async displayHeadstone({ interaction, memb, boss, userStats }) {
    const guild = interaction.guild;
    const contents = {
      level: `Уровень: ${memb.data.level}.`,
      joined: `Появился: ${new Intl.DateTimeFormat("ru-ru", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(guild.members.resolve(memb).joinedTimestamp)}`,
      heroStatus:
        "Выдуманный персонаж был искалечен и умертвлён, или просто умер. В таком состоянии методы атаки и использование реликвий заблокированны.\n",
    };

    const ritualAlreadyStartedBy = (() => {
      if (!userStats.alreadyKeepAliveRitualBy) {
        return null;
      }
      const aliver = guild.members.cache.get(
        userStats.alreadyKeepAliveRitualBy,
      );
      if (!aliver) {
        delete userStats.alreadyKeepAliveRitualBy;
        return null;
      }

      const aliverStats = BossManager.getUserStats(guild.data.boss, aliver.id);
      const aliverData = aliver.user.data;

      if (aliverStats.heroIsDead) {
        delete userStats.alreadyKeepAliveRitualBy;
        return null;
      }

      const deadlyCurseEffect = aliverData.effects?.find(
        ({ id, values: { guildId } }) =>
          id === "boss.deadlyCurse" && guildId === guild.id,
      );

      if (!deadlyCurseEffect) {
        delete userStats.alreadyKeepAliveRitualBy;
        return null;
      }

      const curse = aliverData.curses?.find(
        ({ timestamp }) =>
          timestamp === deadlyCurseEffect.values.targetTimestamp,
      );
      if (!curse) {
        delete userStats.alreadyKeepAliveRitualBy;
        BossEffects.removeEffect({
          effect: deadlyCurseEffect,
          user: aliver.user,
        });
        return null;
      }

      return aliver;
    })();
    const embed = {
      description: `${contents.level}\n${contents.joined}\n\n${contents.heroStatus}`,
      thumbnail:
        "https://cdn.discordapp.com/attachments/629546680840093696/1063465085235900436/stone.png",
      components: !ritualAlreadyStartedBy
        ? {
            type: ComponentType.Button,
            style: ButtonStyle.Danger,
            customId: "KeepAlive",
            label: "Продлить жизнь",
          }
        : {
            type: ComponentType.Button,
            style: ButtonStyle.Secondary,
            customId: "KeepAlive",
            label: `Продлить жизнь (Уже — ${ritualAlreadyStartedBy.displayName})`,
            disabled: true,
          },

      footer: { iconURL: memb.avatarURL(), text: memb.tag },
    };
    const message = await interaction.channel.msg(embed);
    const collector = message.createMessageComponentCollector({
      time: 120_000,
    });

    collector.on("collect", async (interaction) => {
      const isAlready = BossManager.getUserStats(
        boss,
        memb.id,
      ).alreadyKeepAliveRitualBy;

      if (isAlready) {
        interaction.msg({
          ephemeral: true,
          content: "Действие занято другим пользователем",
        });
        return;
      }

      const { user } = interaction;
      const userStats = BossManager.getUserStats(boss, user.id);
      if (userStats.heroIsDead) {
        interaction.msg({
          ephemeral: true,
          content:
            "Ввысь и вниз; В окно, и там будет снег. Забудь об этом — ты мертвец.",
        });
        return;
      }

      const effectId = "boss.deadlyCurse";
      const values = { keepAliveUserId: memb.id };

      const { effect } = BossEffects.applyEffect({
        guild,
        user,
        effectId,
        values,
      });
      const curseAddedMessage = await interaction.msg({
        description:
          "Примите и избавьтесь от быстродействующего проклятия. Провалите — та же участь под камнем.\n**Предостережение:** его не всегда возможно снять в срок.",
        footer: { text: user.tag, iconURL: user.avatarURL() },
        thumbnail:
          "https://media.discordapp.net/attachments/629546680840093696/1174372547941384272/skull.png?ex=65675aaa&is=6554e5aa&hm=7472e327ea98eee13d82ea8eb6035483ea655779e235628771991c40f12b7b34&=",
        fetchReply: true,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Secondary,
            emoji: "753916360802959444",
            customId: "displayCurse",
          },
        ],
      });

      message.msg({ edit: true, components: [] });

      (async () => {
        const collector = curseAddedMessage.createMessageComponentCollector({
          time: 180_000,
        });

        const curse = user.data.curses.find(
          (curse) => curse.timestamp === effect.values.targetTimestamp,
        );

        collector.on("collect", (interaction) => {
          interaction.msg({
            ephemeral: true,
            content: CurseManager.interface({
              user,
              curse,
            }).toString(),
          });
        });

        collector.on("end", () => {
          curseAddedMessage.msg({ edit: true, components: [] });
        });

        return;
      })();

      collector.stop();
    });

    collector.on("end", () => message.msg({ edit: true, components: [] }));
  }

  options = {
    name: "boss",
    id: 59,
    media: {
      description:
        "\n\nБосс страшен. Победите его вместе или проиграйте по-одиночке. Он появляется один раз месяц и уходит спустя три дня.\n\n✏️\n```python\n!boss <member>\n```",
    },
    cliParser: {
      flags: [
        {
          name: "--help",
          capture: ["--help", "-h"],
          description: "Для чего босс приходит и что с ним делать",
        },
        {
          name: "--attack",
          capture: ["--attack", "-a"],
          description: "Незамедлительно проведите атаку",
        },
        {
          name: "--shop",
          capture: ["--shop", "-s"],
          description: "Незамедлительно открывает лавку босса",
        },
        {
          name: "--bosses",
          capture: ["--bosses"],
          description:
            "Показывает перечень серверов, где вы находитесь, с активными или предшествующими боссами",
        },
      ],
    },
    accessibility: {
      publicized_on_level: 7,
    },
    alias: "босс бос",
    allowDM: true,
    type: "other",
  };
}

export default Command;
