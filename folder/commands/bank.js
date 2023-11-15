import { Actions } from "#lib/modules/ActionManager.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import * as Util from "#lib/util.js";

class Command {
  getContext(interaction) {
    const guildData = interaction.guild.data;
    const isAdmin = !interaction.member.wastedPermissions(32n)[0];

    const context = {
      parsedParams: {
        action: null,
        coins: null,
        cause: null,
      },
      interaction,
      guildData,
      isAdmin,
    };
    if (interaction.params) {
      const target = context.parsedParams;
      target.action = interaction.params.split(" ")[0];
      target.coins = interaction.params.split(" ")[1];
      target.cause = interaction.params.split(" ").slice(2).join(" ");
    }

    return context;
  }

  async interactWithBank(context, { value, isPut, cause }) {
    const { guildData, interaction, isAdmin } = context;
    const { user } = interaction;

    if (value === "+") {
      value = isPut ? interaction.userData.coins : guildData.coins;
    }
    value = Math.max(Math.floor(value), 0);

    if (isNaN(value)) {
      return interaction.channel.msg({
        title: "Указана строка вместо числа",
        color: "#ff0000",
        delete: 5000,
      });
    }

    if (value === 0) {
      return interaction.channel.msg({
        title: "Невозможно положить/взять 0 коинов",
        color: "#ff0000",
        delete: 5000,
      });
    }

    if (isPut) {
      const heAccpet = await Util.awaitUserAccept({
        name: "bank_put",
        message: {
          title: "Вы точно хотите это сделать?",
          description:
            "<a:message:794632668137652225> Отправленненные в общую казну коины более не будут предналежать вам, и вы не сможете ими свободно распоряжаться.\nПродолжить?",
        },
        channel: interaction.channel,
        userData: interaction.userData,
      });
      if (!heAccpet) return;

      if (interaction.userData.coins < value) {
        interaction.channel.msg({
          title: "Образовались проблемки..",
          description: "Недостаточно коинов",
          color: "#ff0000",
          delete: 7000,
        });
        return;
      }

      user.action(Actions.resourceChange, {
        value: -value,
        executor: user,
        source: "command.bank.interacted",
        resource: PropertiesEnum.coins,
      });
      interaction.userData.coins -= value;
      guildData.coins += value;

      interaction.guild.logSend({
        title: "Содержимое банка изменено:",
        description: `${
          interaction.member.displayName
        } отнёс в казну ${Util.ending(value, "коин", "ов", "", "а")}`,
        footer: {
          iconURL: interaction.user.avatarURL(),
          text: interaction.user.tag,
        },
      });
      interaction.message.react("👌");
      interaction.channel.msg({
        title: `Вы успешно вложили **${Util.ending(
          value,
          "коин",
          "ов",
          "",
          "а",
        )}** на развитие сервера`,
        delete: 5000,
      });
      return;
    }

    if (!isPut) {
      const heAccpet = await Util.awaitUserAccept({
        name: "bank",
        message: {
          title: "Осторожно, ответственность!",
          description:
            "<a:message:794632668137652225> Не важно как сюда попадают коины, главное — они предналежат пользователям этого сервера\nРаспоряжайтесь ими с пользой, умом.",
        },
        channel: interaction.channel,
        userData: interaction.userData,
      });
      if (!heAccpet) return;
      const problems = [];

      if (!isAdmin)
        problems.push(
          'Для использования содержимого казны требуется право "Управление сервером"',
        );
      if (guildData.coins < value)
        problems.push(
          `Похоже, тут пусто. В хранилище лишь ${Util.ending(
            guildData.coins,
            "коин",
            "ов",
            "",
            "а",
          )}.`,
        );
      if (!cause)
        problems.push(
          `Вы должны указать причину использования ${Util.ending(
            value,
            "коин",
            "ов",
            "а",
            "ов",
          )}.`,
        );
      if (!cause || !cause.match(/.{2,}\s+?.{2,}/i))
        problems.push(`Причина обязана содержать минимум 2 слова.`);

      if (problems[0]) {
        interaction.channel.msg({
          title: "Образовались проблемки..",
          description: problems.join("\n"),
          color: "#ff0000",
          delete: 7000,
        });
        return;
      }

      user.action(Actions.resourceChange, {
        value,
        executor: user,
        source: "command.bank.interacted",
        resource: PropertiesEnum.coins,
      });
      interaction.userData.coins += value;
      guildData.coins -= value;

      interaction.guild.logSend({
        title: "Содержимое банка изменено:",
        description: `${
          interaction.member.displayName
        } обналичил казну на сумму **${Util.ending(
          value,
          "коин",
          "ов",
          "а",
          "ов",
        )}**\nПричина: ${cause}`,
        footer: {
          iconURL: interaction.user.avatarURL(),
          text: interaction.user.tag,
        },
      });
      interaction.message.react("👌");
      const title = `Вы успешно взяли **${Util.ending(
        value,
        "коин",
        "ов",
        "а",
        "ов",
      )}** из казны сервера\nПо причине: ${cause}`;
      interaction.channel.msg({ title, delete: 5000 });
      return;
    }
  }

  async onReaction(data, context) {
    const { interaction, isAdmin } = context;

    switch (data.react) {
      case "637290387655884800":
        data.questionMessage = await interaction.channel.msg({
          title: "Укажите сумму коинов, которую хотите внести в казну",
        });
        data.answer = await interaction.channel.awaitMessage({
          user: interaction.user,
        });
        data.questionMessage.delete();
        if (!data.answer) {
          break;
        }

        data.cause = data.answer.content
          .replace(/\d+/, (number) => {
            data.value = number;
            return "";
          })
          .trim();

        await this.interactWithBank(context, {
          value: data.value,
          isPut: true,
          cause: data.cause,
        });
        data.embed.description = `В казну внесли коины`;
        break;
      case "755844134677512273":
        data.questionMessage = await interaction.channel.msg({
          title:
            "Укажите сумму коинов. А также причину их извлечения из общей казны.",
        });
        data.answer = await interaction.channel.awaitMessage({
          user: interaction.user,
        });
        data.questionMessage.delete();
        if (!data.answer) {
          break;
        }

        data.cause = data.answer.content
          .replace(/\d+/, (number) => {
            data.value = number;
            return "";
          })
          .trim();

        await this.interactWithBank(context, {
          value: data.value,
          isPut: false,
          cause: data.cause,
        });
        data.embed.description = `Из казны извлекли коины`;
        break;
      case "794632668137652225":
        data.professions =
          interaction.guild.data.professions ||
          (interaction.guild.data.professions = {});

        data.workers = new Set();
        data.costs = 0;
        data.workersList = [];

        data.workersContent =
          "<a:message:794632668137652225> Здесь пока пусто, также тут может быть ваша реклама";

        if (Object.keys(data.professions).length) {
          // Clean not exists professions
          Object.keys(data.professions).forEach(([id]) =>
            interaction.guild.roles.cache.get(id)
              ? true
              : delete data.professions[id],
          );

          interaction.guild.members.cache.each((memb) => {
            Object.entries(data.professions).forEach(([id, cost]) =>
              memb.roles.cache.has(id)
                ? data.workers.add(memb) && (data.costs += +cost)
                : false,
            );
          });

          data.workersList = Object.entries(data.professions).map(
            ([id, cost]) => {
              const allCost = [...data.workers].filter((memb) =>
                memb.roles.cache.has(id),
              ).length;
              return `${interaction.guild.roles.cache.get(
                id,
              )}\n${cost} <:coin:637533074879414272> в день (${Util.ending(
                allCost,
                "Пользовател",
                "ей",
                "ь",
                "я",
              )})`;
            },
          );
          data.workersContent = data.workersList.filter((e) => e).join("\n");
        }
        data.professionManager = await interaction.channel.msg({
          title: "- Работы сервера",
          description: `**Созданные профессии ${
            Object.keys(data.professions).length
          }/20**\n${data.workersContent}\n\n\`\`\`Доходы: ${
            interaction.guild.memberCount * 2
          }\nРасходы: ${data.costs}\n${Util.ending(
            data.workers.size,
            "пользовател",
            "ей",
            "ь",
            "я",
          )} получает зарплату\`\`\``,
          footer: {
            text: "Используйте реакции, чтобы создать, удалить профессию или закрыть это окно.",
          },
        });
        while (true) {
          data.react = await data.professionManager.awaitReact(
            { user: interaction.user, removeType: "all" },
            isAdmin ? "✅" : null,
            isAdmin && Object.keys(data.professions).length ? "❎" : null,
            "❌",
          );
          data.embed.description = `<a:message:794632668137652225> Без изменений`;
          if (data.react === "✅") {
            if (Object.keys(data.professions).length >= 20) {
              interaction.channel.msg({
                title: `Лимит 20 профессий`,
                delete: 4500,
                color: "#ff0000",
              });
              continue;
            }

            data.questionMessage = await interaction.channel.msg({
              title:
                "Укажите айди роли, а также количество коинов, выдаваемое ежедневно",
            });
            data.answer = await interaction.channel.awaitMessage({
              user: interaction.user,
            });

            data.questionMessage.delete();
            if (!data.answer) {
              data.professionManager.delete();
              return;
            }
            data.answer = data.answer.content.split(" ");

            const role = interaction.guild.roles.cache.get(data.answer[0]);
            if (!role) {
              interaction.channel.msg({
                title: `Не удалось найти роль с айди ${data.answer[0]}`,
                delete: 4500,
                color: "#ff0000",
              });
              continue;
            }
            if (isNaN(data.answer[1]) || +data.answer[1] === 0) {
              interaction.channel.msg({
                title: `Не указано выдаваемое количество коинов`,
                delete: 4500,
                color: "#ff0000",
              });
              continue;
            }
            interaction.guild.data.professions[data.answer[0]] = Math.max(
              Math.floor(data.answer[1]),
              1,
            );
            data.embed.description = `<a:message:794632668137652225> Вы успешно создали новую профессию!\n(${role} ${data.answer[1]} <:coin:637533074879414272>)`;
          }

          if (data.react === "❎") {
            data.questionMessage = interaction.channel.msg({
              title: "Укажите айди роли профессии, для её удаления",
            });
            data.answer = await interaction.channel.awaitMessage({
              user: interaction.user,
            });
            data.questionMessage.delete();

            if (!data.answer) {
              data.professionManager.delete();
              return;
            }
            if (data.answer.content in data.professions) {
              delete data.professions[data.answer.content];
              data.embed.description = `<a:message:794632668137652225> Вы успешно удалили профессию! ${interaction.guild.roles.cache.get(
                data.answer.content,
              )}`;
            } else {
              interaction.channel.msg({
                title: `Не удалось найти роль с айди ${data.answer.content} для удаления связанной с ней профессии`,
                delete: 4500,
                color: "#ff0000",
              });
              continue;
            }
          }
          break;
        }

        data.professionManager.delete();
        break;
      default:
        return data.message.delete();
    }
  }
  async displayMessageInterface(context) {
    const { guildData, isAdmin, interaction } = context;

    const embed = {
      title: "Казна сервера",
      description: `В хранилище **${Util.NumberFormatLetterize(
        guildData.coins,
      )}** <:coin:637533074879414272>\n\n<a:message:794632668137652225> ⠿ Заработные платы\n<:meow:637290387655884800> ⠿ Положить\n<:merunna:755844134677512273> ${[
        ..."⠯⠷⠟⠻",
      ].random()} Взять`,
      author: {
        name: interaction.guild.name,
        iconURL: interaction.guild.iconURL(),
      },
      image:
        "https://media.discordapp.net/attachments/629546680840093696/830774000597991434/96-967226_tree-forest-green-vector-map-of-the-trees.png",
    };

    const startsCoinsCount = guildData.coins;
    let react;
    const reactions = [
      "637290387655884800",
      isAdmin ? "755844134677512273" : null,
      "794632668137652225",
    ];
    let message = await interaction.channel.msg(embed);
    embed.edit = true;

    while (true) {
      message = await message.msg(embed);
      react = await message.awaitReact(
        { user: interaction.user, removeType: "all" },
        ...reactions,
      );

      await this.onReaction({ react, embed, message }, context);

      embed.description += `\n\nВ хранилище: ${Util.ending(
        guildData.coins,
        "золот",
        "ых",
        "ая",
        "ых",
      )}!\nКоличество коинов ${
        guildData.coins - startsCoinsCount === 0
          ? "не изменилось"
          : guildData.coins - startsCoinsCount > 0
          ? "увеличилось на " + (guildData.coins - startsCoinsCount)
          : "уменьшилось на " + (startsCoinsCount - guildData.coins)
      } <:coin:637533074879414272>`;
    }
  }

  async onChatInput(msg, interaction) {
    const context = this.getContext(interaction);

    if (context.parsedParams) {
      const { action, coins, cause } = context.parsedParams;
      if (action === "положить" || action === "put") {
        await this.interactWithBank(context, {
          value: coins,
          isPut: true,
          cause,
        });
        return;
      }

      if (action === "взять" || action === "take") {
        await this.interactWithBank(context, {
          value: coins,
          isPut: false,
          cause,
        });
        return;
      }
    }

    await this.displayMessageInterface(context);
  }

  onDayStats(guild, context) {
    const workers = new Set();
    let costs = 0;
    let entries = Object.entries(guild.data.professions);
    if (!entries.length) {
      delete guild.data.professions;
      return;
    }

    entries = entries.filter(([id]) =>
      guild.roles.cache.get(id) ? true : delete guild.data.professions[id],
    );

    guild.members.cache.each((memb) => {
      entries.forEach(([id, cost]) =>
        memb.roles.cache.has(id)
          ? workers.add(memb) && (costs += +cost)
          : false,
      );
    });
    if (guild.data.coins < costs) {
      guild.logSend({
        title: `Сегодня не были выданы зарплаты`,
        description: `В казне сервера слишком мало коинов, лишь ${guild.data.coins}, в то время как на выплаты требуется ${costs} <:coin:637533074879414272>`,
        color: "#ffff00",
      });
      return;
    }

    [...workers].forEach((memb) => {
      entries.forEach(([id, cost]) =>
        memb.roles.cache.has(id) ? (memb.user.data.coins += +cost) : false,
      );
    });
    guild.data.coins -= costs;
    guild.logSend({
      title: `Были выданы зарплаты`,
      description: `С казны было автоматически списано ${Util.ending(
        costs,
        "коин",
        "ов",
        "",
        "а",
      )} на заработные платы пользователям\nИх список вы можете просмотреть в команде \`!банк\`\nУчастников получило коины: ${
        workers.size
      }`,
    });
  }

  options = {
    name: "bank",
    id: 50,
    media: {
      description:
        'Во-первых, банк позволяет не смешивать приключения с обязанностями, а во-вторых, это просто удобно.\nТакже с их помощью вы можете создать на сервере профессии с автоматически выдаваемыми зарплатами!\n\n✏️\n```python\n!bank <"взять" | "положить"> <coins | "+"> #"+" обозначает "Все коины, которые у вас есть"\n```',
      poster:
        "https://cdn.discordapp.com/attachments/769566192846635010/872463081672949890/bank.gif",
    },
    allias: "cash банк казна скарбниця",
    allowDM: true,
    cooldown: 5_00_00,
    type: "guild",
  };
}

export default Command;
