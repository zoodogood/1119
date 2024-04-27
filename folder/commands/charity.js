import { BaseCommand } from "#lib/BaseCommand.js";
import * as Util from "#lib/util.js";
import { client } from "#bot/client.js";
import Discord from "discord.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";

class Command extends BaseCommand {
  async onChatInput(msg, interaction) {
    const heAccpet = await Util.awaitUserAccept({
      name: "charity",
      message: {
        title:
          "Благотворительность это хорошо, но используя эту команду вы потеряете коины!",
        description: "Ваши богатсва будут разданы людям с этого сервера.",
      },
      channel: msg.channel,
      userData: interaction.userData,
    });
    if (!heAccpet) {
      return;
    }

    const { guild } = interaction;

    let cash = interaction.params.match(/\d+|\+/);

    if (!cash) {
      msg.msg({
        title: "Вы не указали кол-во коинов, которые хотите раздать",
        delete: 5000,
        color: "#ff0000",
      });
      msg.react("❌");
      return;
    }
    cash = cash[0];
    interaction.params = interaction.params.replace(cash, "").trim();

    if (cash === "+") {
      cash = interaction.userData.coins;
    }

    cash = Number(cash);

    if (cash < 200) {
      msg.msg({
        title: "Минимальная сумма — 200 коинов",
        delete: 5000,
        color: "#ff0000",
      });
      msg.react("❌");
      return;
    }

    if (cash > interaction.userData.coins) {
      msg.msg({ title: "Недостаточно коинов", delete: 5000, color: "#ff0000" });
      msg.react("❌");
      return;
    }

    let countUsers = interaction.params.match(/\d+/);
    let needCash;
    if (countUsers) {
      countUsers = countUsers[0];
      needCash =
        200 +
        Math.max(countUsers - 20, 0) * 250 * 2 ** Math.floor(countUsers / 10);
      interaction.params = interaction.params.replace(countUsers, "").trim();
    }

    if (cash < needCash) {
      msg.msg({
        title: "Мало коинов",
        description: `Для благотворительности такой размерности (${Util.ending(
          countUsers,
          "человек",
          "",
          "",
          "а",
        )}) требует минимум ${needCash} коинов!`,
        delete: 8000,
        color: "#ff0000",
      });
      msg.react("❌");
      return;
    }

    const note = interaction.params;

    const count = countUsers || Util.random(11, 22),
      members = [
        ...guild.members.cache
          .filter(
            (member) => !member.user.bot && member.user.id !== msg.author.id,
          )
          .random(count)
          .filter(Boolean),
      ],
      coinsForEvery = Math.floor(cash / members.length);

    Util.addResource({
      user: interaction.user,
      value: -cash,
      executor: interaction.user,
      source: "command.charity",
      resource: PropertiesEnum.coins,
      context: { interaction, members, coinsForEvery, countUsers },
    });
    for (const member of members) {
      const { user } = member;
      Util.addResource({
        user,
        value: coinsForEvery,
        executor: interaction.user,
        source: "command.charity",
        resource: PropertiesEnum.coins,
        context: { interaction, members, coinsForEvery, countUsers },
      });
    }

    guild.data.coins =
      (guild.data.coins || 0) + cash - coinsForEvery * members.length;

    const embed = {
      title: "Вы сотворили Акт благотворительности",
      description: `Ваши <:coin:637533074879414272> ${Util.ending(
        cash,
        "коин",
        "ов",
        "",
        "а",
      )} были распределены между ${
        members.length
      } случайными участниками сервера, эти люди вам благодарны:\n${members
        .map(
          (e, i) =>
            `${
              i % 3
                ? "<:crys3:763767653571231804>"
                : "<:crys:637290406958202880>"
            } ${Discord.escapeMarkdown(e.toString())} — ${
              [
                { _weight: 2, x: "Спасибо!" },
                { _weight: 2, x: "Благодарю!" },
                { _weight: 2, x: "Вы самые лучшие!" },
                { _weight: 15, x: "💚" },
                { _weight: 15, x: "💖" },
                { _weight: 1, x: "🦝" },
              ].random({ weights: true }).x
            }`,
        )
        .join("\n")}`,
      author: {
        iconURL: msg.author.avatarURL(),
        name: msg.author.username,
      },

      footer: note
        ? {
            iconURL: msg.author.avatarURL(),
            text: `Послание: ${note}`,
          }
        : {
            iconURL: client.user.avatarURL(),
            text: "Спасибо!",
          },

      image:
        "https://media.discordapp.net/attachments/629546680840093696/812635351801004052/penguinwalk.gif",
    };

    await msg.msg(embed);
    msg.react("💚");
  }

  options = {
    name: "charity",
    id: 49,
    media: {
      description:
        "Вы слишком добрые, если собираетесь воспользоваться этой командой, она позволяет раздать коины случайным участникам на сервере, их получат даже неактивные участники. Перед тем как устроить благотворительность подумайте больше одного раза, ведь это не имеет смысла",
      example: `!charity {coins | "+"} <usersCount> #"+" обозначает "Все коины, которые у вас есть"`,
    },
    accessibility: {
      publicized_on_level: 7,
    },
    alias: "благотворительность благодійність",
    allowDM: true,
    expectParams: true,
    cooldown: 7_00_00,
    type: "other",
  };
}

export default Command;
