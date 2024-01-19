import * as Util from "#lib/util.js";
import { client } from "#bot/client.js";
import TimeEventsManager from "#lib/modules/TimeEventsManager.js";
import { PermissionFlagsBits } from "discord.js";

class Command {
  async onChatInput(msg, interaction) {
    const guild = interaction.guild;
    const guildMember = guild.members.resolve(interaction.mention);
    let role;

    if (interaction.mention === msg.author)
      return msg.msg({
        title: "Вы не можете выдать себе мут, могу только вам его прописать.",
        author: { name: msg.author.username, iconURL: msg.author.avatarURL() },
        delete: 12000,
      });

    if (interaction.mention === client.user)
      return msg.msg({
        title:
          "Попробуйте другие способы меня замутить, например, объявите за мою поимку награду в 100 000 коинов <:coin:637533074879414272>",
        delete: 12000,
      });

    if (interaction.mention.bot)
      return msg.msg({
        title: "Если этот бот вам надоедает, то знайте — мне он тоже надоел",
        description: "Но замутить его я все-равно не могу.",
        delete: 12000,
      });

    if (
      guildMember.roles.highest.position >
      interaction.member.roles.highest.position
    )
      return msg.msg({
        title: "Вы не можете выдать мут участнику, роли которого выше ваших",
        author: { name: msg.author.username, iconURL: msg.author.avatarURL() },
        delete: 12000,
      });

    if (guildMember.permissions.has(PermissionFlagsBits.Administrator))
      return msg.msg({
        title: "Вы не можете выдать мут участнику, с правами Администратора",
        author: { name: msg.author.username, iconURL: msg.author.avatarURL() },
        delete: 12000,
      });

    interaction.params = interaction.params
      .replace(RegExp(`<@!?${interaction.mention.id}>`), "")
      .trim();

    // parse timestamps
    let timeToEnd = 0;

    while (true) {
      const regBase = "(\\d+?)\\s*(d|д|h|ч|m|м|s|с)[a-zA-Zа-яА-Я]*";
      const reg = RegExp(`^${regBase}|${regBase}$`);
      const matched = interaction.params.match(reg);

      if (!matched) {
        break;
      }

      if (matched[3]) {
        matched[1] = matched[3];
        matched[2] = matched[4];
      }

      const [value, timeType] = [matched[1], matched[2]];

      interaction.params = interaction.params.replace(matched[0], "").trim();
      timeToEnd +=
        value *
        {
          s: 1000,
          m: 60000,
          h: 3600000,
          d: 84000000,
          с: 1000,
          м: 60000,
          ч: 3600000,
          д: 84000000,
        }[timeType];
    }

    const cause = interaction.params;

    // find muted role
    if (guild.data.mute_role)
      role = guild.roles.cache.get(guild.data.mute_role);

    if (!role) {
      role =
        guild.roles.cache.find((e) =>
          "mute muted замучен мьют мут замьючен".includes(e.name.toLowerCase()),
        ) ||
        (await guild.roles.create({
          name: "MUTED",
          color: "#a8a8a8",
          permissions: [PermissionFlagsBits.ViewChannel],
        }));

      guild.data.mute_role = role.id;
    }

    if (guildMember.roles.cache.get(role.id)) {
      msg.msg({ title: "Участник уже находится в муте", color: "#ff0000" });
      return;
    }

    if (timeToEnd) {
      TimeEventsManager.create("mute-end", timeToEnd, [
        msg.guild.id,
        guildMember.id,
      ]);
      timeToEnd = new Intl.DateTimeFormat("ru-ru", {
        day: "numeric",
        month: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(Date.now() + timeToEnd);
    }

    guildMember.roles.add(role, `Muted from ${msg.author.id}`);

    await Util.sleep(700);

    const embed = {
      description: `Пользователь ${guildMember} был замучен.${
        cause ? `\nПричина: ${cause}` : ""
      }${
        timeToEnd ? `\nОграничения автоматически будут сняты ${timeToEnd}` : ""
      }`,
      color: "#de3c37",
      author: {
        name: guildMember.displayName,
        iconURL: guildMember.user.displayAvatarURL(),
      },
      footer: {
        text: `Мут выдал ${msg.author.username}`,
        iconURL: msg.author.avatarURL(),
      },
    };
    msg.guild.logSend({ ...embed, title: "Участнику выдан мут" });
    msg.msg({ ...embed, title: "Участник был замучен" });
  }

  options = {
    name: "mute",
    id: 17,
    media: {
      description:
        "Заглушает пользователя во всех каналах сервера не давая ему отправлять сообщения. Необходимо её использовать, когда участники мешают беседе или нарушают правила.\n\n❓ Вы можете указать время, через которое пользователь автоматически снова сможет общаться.\n\n✏️\n```python\n!mute {memb} <cause> <time> #Вы можете вводить аргументы в любом порядке, время в формате 1 день 3 с 15min\n```",
      poster:
        "https://images-ext-2.discordapp.net/external/fBq1I0O3Tdhoi-DeVVm7nDadXN-uzdgKveyekp-Vm88/https/media.discordapp.net/attachments/769566192846635010/872776969341796382/mute.gif",
    },
    alias: "мут мьют заглушить заглушити",
    expectMention: true,
    allowDM: true,
    type: "guild",
    myPermissions: 268435456n,
    Permissions: 4194304n,
  };
}

export default Command;
