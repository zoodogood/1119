import { BaseCommand } from "#lib/BaseCommand.js";
import * as Util from "#lib/util.js";

import TimeEventsManager from "#lib/modules/TimeEventsManager.js";
import { ChannelType, PresenceUpdateStatus } from "discord.js";
import { CALCULATE_CLOVER_MULTIPLAYER } from "#constants/users/commands.js";

class Command extends BaseCommand {
  getUsedCommandsCountOfGuild(guild) {
    return Object.values(guild.data.commandsUsed).reduce(
      (acc, count) => acc + count,
      0,
    );
  }

  getCommandsLaunchedOfPreviousDaysInGuild(guild) {
    return guild.data.commandsLaunched || 0;
  }

  getContext(interaction) {
    const { guild } = interaction;
    return {
      guild,
      commandsUsed: this.getUsedCommandsCountOfGuild(guild),
      commandsUsedOfPreviousDays:
        this.getCommandsLaunchedOfPreviousDaysInGuild(guild),
    };
  }
  async onChatInput(msg, interaction) {
    const context = this.getContext(interaction);
    const { guild } = context;

    const values = {
      stats: {
        msgs: `За сегодня: ${guild.data.day_msg}`,
        msgsAll: `Всего: ${guild.data.day_msg + guild.data.msg_total}`,
        around: `В среднем: ${Math.round(
          (guild.data.day_msg + guild.data.msg_total) / (guild.data.days + 1),
        )}`,
        record: `Рекорд: ${Util.ending(
          guild.data.day_max,
          "сообщени",
          "й",
          "е",
          "я",
        )}\n`,
        commands: `Использовано команд: ${context.commandsUsed}`,
        todayCommands: `Сегодня: ${
          context.commandsUsed - context.commandsUsedOfPreviousDays
        }`,
      },
      members: {
        count: `Всего: ${guild.memberCount}`,
        online: `Онлайн: ${
          guild.members.cache.filter(
            (member) =>
              member.presence &&
              member.presence.status !== PresenceUpdateStatus.Offline,
          ).size
        }`,
        offline: `Оффлайн: ${
          guild.members.cache.filter(
            (member) =>
              !member.presence ||
              member.presence.status === PresenceUpdateStatus.Offline,
          ).size
        }`,
      },
      channels: {
        categories: `Категорий: ${
          guild.channels.cache.filter(
            (e) => e.type === ChannelType.GuildCategory,
          ).size
        }`,
        texted: `Текстовых: ${
          guild.channels.cache.filter((e) => e.isTextBased()).size
        }`,
        voices: `Голосовых: ${
          guild.channels.cache.filter((e) => e.isVoiceBased()).size
        }`,
      },
    };

    const stats = Object.values(values.stats).join("\n");
    const members = Object.values(values.members).join("\n");
    const channels = Object.values(values.channels).join("\n");

    const verification = [
      "Отсуствует",
      "Низкий",
      "Средний",
      "Высокий",
      "Слишком высокий",
    ];

    const fields = [
      { name: "Участники:", value: members, inline: true },
      { name: "Каналы:", value: channels, inline: true },
      { name: "**Статистика сообщений:**", value: stats },
      {
        name: "**Владелец:**",
        value: String(await guild.fetchOwner()),
        inline: true,
      },
      {
        name: "**Ур. Верификации:**",
        value: String(verification[guild.verificationLevel]),
        inline: true,
      },
    ];
    //* CLOVER
    const clover = this.getCloverData(guild);
    if (clover) {
      const { timeToEnd, multiplier, cloverEffect } = cloverEffect;
      const { coins, timestamp, uses } = cloverEffect;

      fields.unshift({
        name: "🍀 Действие Клевера",
        value: `Осталось времени: ${+(timeToEnd / 3600000).toFixed(
          2,
        )}ч.\nКлевер был запущен: <t:${Math.floor(
          timestamp / 1_000,
        )}>;\nНаград получено: ${coins}\nТекущий множетель: X${multiplier.toFixed(2)}\nКуплено клеверов: ${uses}`,
      });
    }
    //**

    interaction.channel.msg({
      title: guild.name + " " + ["❤️", "🧡", "💛", "💚", "💙", "💜"].random(),
      thumbnail: guild.iconURL(),
      description:
        guild.data.description ||
        "Описание не установлено <a:who:638649997415677973>\n`!editServer` для настройки сервера",
      footer: {
        text: this.getCreatedAtContent(guild) + `\nID: ${guild.id}`,
      },
      image: guild.data.banner,
      fields,
    });
  }
  getCreatedAtContent(guild) {
    return `Сервер был создан ${Util.timestampToDate(Date.now() - guild.createdTimestamp, 3)} назад.`;
  }

  getCloverData(guild) {
    const { cloverEffect } = guild.data;
    if (!cloverEffect) {
      return null;
    }
    const day = TimeEventsManager.Util.timestampDay(cloverEffect.timestamp);
    const filter = ({ name, params }) =>
      name === "clover-end" && params.includes(guild.id);
    const event = TimeEventsManager.at(day)?.find(filter);

    if (!event) {
      return null;
    }

    const timeToEnd = event.timestamp - Date.now();
    const multiplier = CALCULATE_CLOVER_MULTIPLAYER(cloverEffect.uses);

    return { timeToEnd, multiplier, cloverEffect };
  }

  options = {
    name: "server",
    id: 28,
    media: {
      description:
        "\n\nОтображает основную информацию и статистику о сервере, в том числе бонусы связанные с этим ботом.\nВ неё входят: количество пользователей, каналов, сообщений или эффект клевера (если есть), а также установленные каналы, дата создания и другое\n\n✏️\n```python\n!server #без аргументов\n```\n\n",
    },
    alias: "сервер guild гильдия",
    allowDM: true,
    type: "guild",
  };
}

export default Command;
