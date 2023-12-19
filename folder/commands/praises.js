import { client } from "#bot/client.js";
import DataManager from "#lib/modules/DataManager.js";
import Discord from "discord.js";

class Command {
  async onChatInput(msg, interaction) {
    const context = {
      questionMessage: null,
    };

    if (interaction.params === "+") {
      const data = msg.author.data;

      const currentPraises = data.praise || [];
      const currentLength = currentPraises.length;

      currentPraises.forEach((id) => {
        const target = client.users.cache.get(id).data.praiseMe;
        if (!target) return;

        const index = target.indexOf(msg.author.id);
        if (index === -1) return;

        target.splice(index, 1);
      });

      data.praise = [];

      msg.msg({
        description: `Использован параметр "+" — все похвалы были удалены (${currentLength})`,
        delete: 10000,
      });
    }

    let memb =
        interaction.mention ||
        msg.guild.members.cache.get(interaction.params) ||
        msg.author,
      user = memb.data,
      isAuthor = memb == msg.author,
      iPraise =
        user.praise && user.praise.length
          ? user.praise
              .map(
                (id, i) =>
                  i +
                  1 +
                  ". " +
                  (DataManager.getUser(id)
                    ? Discord.escapeMarkdown(DataManager.getUser(id).name)
                    : "пользователь не определен"),
              )
              .join(`\n`)
          : isAuthor
            ? "Вы никого не хвалили \nиспользуйте **!похвалить**"
            : "Никого не хвалил",
      mePraise =
        user.praiseMe && user.praiseMe.length
          ? user.praiseMe
              .map(
                (id, i) =>
                  i +
                  1 +
                  ". " +
                  (DataManager.getUser(id)
                    ? Discord.escapeMarkdown(DataManager.getUser(id).name)
                    : "пользователь не определен"),
              )
              .join(`\n`)
          : isAuthor
            ? "Вас никто не похвалил, напомните им это сделать"
            : "Его никто не хвалил, похвалите его!";

    const maximumPraises = Math.min(
      2 + Math.floor((user.level * 1.5) / 10),
      20,
    );

    user.praise = user.praise || [];
    if (user.praise[0]) {
      iPraise += "\n• (пусто)".repeat(
        Math.max(maximumPraises - user.praise.length, 0),
      );
    }

    const message = await msg.channel.msg({
      title: isAuthor ? "Похвалы" : "Похвалил",
      description: iPraise,
      color: "#00ffaf",
      author: { name: memb.tag, iconURL: memb.avatarURL() },
      footer: {
        text: isAuthor
          ? "Если вы хотите отменить,\nпохвалу кликните на *галочку* ниже."
          : "",
      },
    });
    let react = await message.awaitReact(
      { user: msg.author, removeType: "all" },
      "640449832799961088",
      isAuthor && user.praise[0] ? "685057435161198594" : null,
    );

    while (true) {
      switch (react) {
        case "640449832799961088":
          await message.msg({
            title: isAuthor ? "Вас похвалили" : "Был похвален",
            color: "#00ffaf",
            description: mePraise,
            author: { name: memb.tag, iconURL: memb.avatarURL() },
            edit: true,
          });
          react = await message.awaitReact(
            { user: msg.author, removeType: "all" },
            "640449848050712587",
          );
          break;

        case "640449848050712587":
          await message.msg({
            title: isAuthor ? "Похвалы" : "Похвалил",
            color: "#00ffaf",
            description: iPraise,
            author: { name: memb.tag, iconURL: memb.avatarURL() },
            footer: {
              text: isAuthor
                ? `Если вы хотите отменить,\nпохвалу кликните на *галочку* ниже.`
                : "Have a good goose",
            },
            edit: true,
          });
          react = await message.awaitReact(
            { user: msg.author, removeType: "all" },
            "640449832799961088",
            isAuthor && user.praise[0] ? "685057435161198594" : null,
          );
          break;

        case "685057435161198594":
          context.questionMessage = await msg.msg({
            title:
              "Введите номер пользователя из списка, которого вы хотите удалить",
          });
          let answer = (
            await msg.channel.awaitMessage({ user: msg.author, remove: true })
          )?.content;
          context.questionMessage.delete();

          if (!answer) {
            break;
          }

          if (answer === "+")
            answer = user.praise.map((id, i) => i + 1).join(",");

          const throwOut = () => {
            if (throwOut.message === undefined) throwOut.message = "";

            throwOut.out = true;
          };

          const splices = answer.match(/\d+/g);

          if (splices === null) {
            await msg.channel.msg({
              title: `Укажите хотя бы один номер, указывающий на пользователя которого надо удалить`,
              color: "#ff0000",
              delete: 9000,
            });
            react = "640449848050712587";
            break;
          }

          const willRemoved = splices
            .map((userIndex) => {
              if (user.praise.length < userIndex || userIndex <= 0) {
                throwOut();
                throwOut.message += `\n• Не удалось определить пользователя под индексом ${userIndex}`;

                return null;
              }

              const id = user.praise[userIndex - 1];
              return DataManager.getUser(id);
            })
            .filter((data) => data !== null);

          willRemoved.forEach((data) => {
            if (data) {
              const index = data.praiseMe.indexOf(user.id);
              if (~index) data.praiseMe.splice(index, 1);
            }

            user.praise.splice(answer - 1, 1);
          });

          if (willRemoved.length > 1) {
            const list = willRemoved
              .map((data) => {
                if (!data) data = { name: "Неопределенного пользователя" };

                return data.name || `ID: ${data.id}`;
              })
              .map((name) => `• ${name}`)
              .join("\n");

            const description = `Вы удалили следующих пользователей из списка похвал:\n${list}`;
            const author = {
              name: msg.author.tag,
              iconURL: msg.author.avatarURL(),
            };
            await msg.msg({ author, description });
          }

          if (willRemoved.length === 1) {
            const data = willRemoved[0];

            const discordUser = client.users.cache.get(data.id);
            const name = discordUser
              ? discordUser.username
              : data.name || data.id;
            const author = discordUser
              ? { name, iconURL: discordUser.avatarURL() }
              : null;

            await msg.msg({
              title: `Вы удалили ${name} из списка похвал`,
              author,
            });
          }

          if (throwOut.out) {
            const main = `Введите число в диапазоне от 1 до ${user.praise.length} включительно.\nУкажите несколько чисел или знак "+" (все похвалы), чтобы за раз удалить несколько похвал.`;
            const description = `${main}\n${throwOut.message}`;
            msg.msg({
              title: "Отчёт возникших проблем:",
              description,
              color: "#ff0000",
              delete: 12000,
            });
          }

          iPraise = user.praise.length
            ? user.praise
                .map(
                  (id, i) =>
                    i +
                    1 +
                    ". " +
                    (DataManager.getUser(id)
                      ? Discord.escapeMarkdown(DataManager.getUser(id).name)
                      : "пользователь не определен"),
                )
                .join(`\n`)
            : isAuthor
              ? "Вы никого не хвалили \nиспользуйте **!похвалить**"
              : "Никого не хвалил";
          iPraise += "\n• (пусто)".repeat(
            Math.max(maximumPraises - user.praise.length, 0),
          );
          await message.msg({
            title: isAuthor ? "Похвалы" : "Похвалил",
            color: "#00ffaf",
            description: Discord.escapeMarkdown(iPraise),
            author: { name: memb.tag, iconURL: memb.avatarURL() },
            footer: {
              text: isAuthor
                ? `Если вы хотите отменить,\nпохвалу кликните на *галочку* ниже.`
                : "Have a good goose",
            },
            edit: true,
          });

          react = "640449848050712587";
          break;

        default:
          msg.reactions.removeAll();
          return;
      }
    }
  }

  options = {
    name: "praises",
    id: 6,
    media: {
      description:
        "\n\nОтображает список людей, которых вы похвалили и которые похвалили вас.\n\n✏️\n```python\n!praises <memb>\n```\n\n",
    },
    allias: "похвалы похвали лайки likes",
    allowDM: true,
    cooldown: 2_00_00,
    type: "user",
  };
}

export default Command;
