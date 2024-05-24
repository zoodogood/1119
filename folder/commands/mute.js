import { client } from "#bot/client.js";
import { SECOND } from "#constants/globals/time.js";
import { BaseCommand } from "#lib/BaseCommand.js";
import TimeEventsManager from "#lib/modules/TimeEventsManager.js";
import { ParserTime } from "#lib/parsers.js";
import { dayjs, sleep } from "#lib/safe-utils.js";
import { CliParser } from "@zoodogood/utils/CliParser";
import { FormattingPatterns, PermissionFlagsBits } from "discord.js";

class Command extends BaseCommand {
  options = {
    name: "mute",
    id: 17,
    media: {
      description:
        "Заглушает пользователя во всех каналах сервера не давая ему отправлять сообщения. Необходимо её использовать, когда участники мешают беседе или нарушают правила.\n\n❓ Вы можете указать время, через которое пользователь автоматически снова сможет общаться.\nСм. также !unmute",
      example:
        "!mute {memb} <cause> <time> #Вы можете вводить аргументы в любом порядке, время в формате 1 день 3 с 15min",
      poster:
        "https://images-ext-2.discordapp.net/external/fBq1I0O3Tdhoi-DeVVm7nDadXN-uzdgKveyekp-Vm88/https/media.discordapp.net/attachments/769566192846635010/872776969341796382/mute.gif",
    },
    accessibility: {
      publicized_on_level: 7,
    },
    alias: "мут мьют заглушить заглушити",
    expectMention: true,
    allowDM: true,
    type: "guild",
    myPermissions: 268435456n,
    Permissions: 4194304n,
  };

  async onChatInput(msg, interaction) {
    const guild = interaction.guild;
    const guildMember = guild.members.resolve(interaction.mention);
    let role;

    if (interaction.mention === msg.author)
      return msg.msg({
        title: "Вы не можете выдать себе мут, могу только вам его прописать.",
        author: { name: msg.author.username, iconURL: msg.author.avatarURL() },
        delete: SECOND * 12,
      });

    if (interaction.mention === client.user)
      return msg.msg({
        title:
          "Попробуйте другие способы меня замутить, например, объявите за мою поимку награду в 100 000 коинов <:coin:637533074879414272>",
        delete: SECOND * 12,
      });

    if (interaction.mention.bot)
      return msg.msg({
        title: "Если этот бот вам надоедает, то знайте — мне он тоже надоел",
        description: "Но замутить его я все-равно не могу.",
        delete: SECOND * 12,
      });

    if (
      guildMember.roles.highest.position >
      interaction.member.roles.highest.position
    )
      return msg.msg({
        title: "Вы не можете выдать мут участнику, роли которого выше ваших",
        author: { name: msg.author.username, iconURL: msg.author.avatarURL() },
        delete: SECOND * 12,
      });

    if (guildMember.permissions.has(PermissionFlagsBits.Administrator))
      return msg.msg({
        title: "Вы не можете выдать мут участнику, с правами Администратора",
        author: { name: msg.author.username, iconURL: msg.author.avatarURL() },
        delete: SECOND * 12,
      });

    const parsed = new CliParser()
      .setText(interaction.params)
      .captureByMatch({ regex: FormattingPatterns.User, name: "memb" })
      .captureByMatch({ regex: new ParserTime().regex, name: "target_time" })
      .captureResidue({ name: "cause" })
      .collect();

    const timeToEnd = ParserTime.toNumber(
      parsed.captures.get("target_time")?.toString(),
    );

    const cause = parsed.captures.get("cause")?.toString();

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
    }

    guildMember.roles.add(role, `Muted from ${msg.author.id}`);

    await sleep(700);

    const embed = {
      description: `Пользователь ${guildMember} был замучен.${
        cause ? `\nПричина: ${cause}` : ""
      }${
        timeToEnd
          ? `\nОграничения автоматически будут сняты ${dayjs(timeToEnd + Date.now()).format("MM.DD, HH:mm")}`
          : ""
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
}

export default Command;
