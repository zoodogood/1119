import { BaseCommand } from "#lib/BaseCommand.js";
import * as Util from "#lib/util.js";
import CommandsManager from "#lib/modules/CommandsManager.js";
import { BirthdayMember } from "#folder/commands/birthdays.js";

class Command extends BaseCommand {
  async onChatInput(msg, interaction) {
    const userData = interaction.userData,
      args = interaction.params.split(" "),
      item = args[0].toLowerCase();

    const { user, channel } = interaction;
    let value = args.splice(1).join(" ");

    if (
      ![
        "description",
        "осебе",
        "описание",
        "опис",
        "просебе",
        "color",
        "цвет",
        "колір",
        "birthday",
        "др",
        "confidentiality",
        "конфиденциальность",
      ].includes(item)
    ) {
      const problemsMessage = await msg.msg({
        title:
          "<a:who:638649997415677973> Вы не указали то, что вы хотите изменить\nПовторите попытку",
        delete: 10000,
        description:
          "Поддерживаемые значения:\n`• осебе/description`\n`• цвет/color`\n`• др/birthday`\n`• конфиденциальность/confidentiality`",
      });

      //** Реакция-помощник
      const react = await problemsMessage.awaitReact(
        { user: msg.author, removeType: "all" },
        "❓",
      );
      if (!react) {
        return;
      }

      const helper = await CommandsManager.collection
        .get("commandinfo")
        .onChatInput(interaction.message, {
          ...interaction,
          params: "setprofile",
        });
      await Util.sleep(20000);
      helper.delete();
      /**/

      return;
    }

    if (!value) {
      msg.msg({ title: "Вы не ввели значение", delete: 3000 });
      return;
    }

    const data = {};
    switch (item) {
      case "description":
      case "описание":
      case "опис":
      case "осебе":
      case "просебе":
        data.minus = (value.match(/<a?:.+?:\d+?>|\\?!\{.+?\}/g) || []).join(
          "",
        ).length;
        if (value.length - data.minus > 121)
          return msg.msg({
            title: "Длина описания не должна превышать 120 символов",
            delete: 5000,
            color: "#ff0000",
            description: `Ваша длина: ${
              value.length - data.minus
            }\nТекст:\n${value}`,
          });
        data.line = "";
        data.lineMinus = 0;
        data.minus = 0;

        data.words = value.split(" ");
        value = "";
        for (let i = 0; i < data.words.length; i++) {
          const e = data.words[i];

          data.lineMinus += (e.match(/<a?:.+?:\d+?>|\\?!\{.+?\}/g) || []).join(
            "",
          ).length;
          let indent;
          if ((indent = e.match(/\n/))) {
            data.words.splice(i + 1, 0, e.slice(indent.index + 1));
            value += `${data.line} ${e.slice(0, indent.index)}\n`;
            data.line = "";
            data.lineMinus = 0;
            continue;
          }

          if (data.line.length - data.lineMinus + e.length < 30) {
            data.line += " " + e;
          } else {
            value += data.line + "\n" + e;
            data.line = "";
            data.lineMinus = 0;
          }
        }
        value += data.line;

        userData.profile_description = value;
        msg.msg({ title: "Описание установлено!", delete: 5000 });
        break;

      case "color":
      case "цвет":
      case "колір":
        if (value === "0") {
          delete userData.profile_color;
          msg.msg({
            title: "Готово! Пользовательский цвет удалён",
            delete: 5000,
          });
        }

        data.color = value.match(/[abcdef0-9]{6}|[abcdef0-9]{3}/i);
        if (!data.color) {
          return msg.msg({
            title: "Неверный формат, введите цвет в формате HEX `#38f913`",
            color: "#ff0000",
            delete: 5000,
          });
        }
        data.color = data.color[0].toLowerCase();
        data.color =
          data.color.length === 3
            ? [...data.color].map((hexSymbol) => hexSymbol + hexSymbol).join("")
            : data.color;

        userData.profile_color = data.color;
        msg.msg({
          title: `Готово! Пользовательский цвет установлен #${data.color.toUpperCase()}\nЕсли вы захотите его удалить - установите цвет в значение 0`,
          color: data.color,
          delete: 5000,
        });
        break;

      case "birthday":
      case "др":
        new BirthdayMember(user).processUpdate(channel, value);
        break;

      case "confidentiality":
      case "конфиденциальность":
        data.message = await msg.msg({
          title: `Реж. конфиденциальности ${
            userData.profile_confidentiality
              ? "включен, отлючить?"
              : "выключен, включить?"
          }`,
        });
        data.react = await data.message.awaitReact(
          { user: msg.author, removeType: "all" },
          "685057435161198594",
          "763807890573885456",
        );
        if (data.react !== "685057435161198594") {
          return msg.msg({
            title: "Действие отменено",
            color: "#ff0000",
            delete: 4000,
          });
        }
        userData.profile_confidentiality = userData.profile_confidentiality
          ? false
          : true;

        msg.msg({
          title: `Режим конфиденциальность переключен в значение ${userData.profile_confidentiality}`,
          delete: 7000,
        });
        break;
    }
  }

  options = {
    name: "setprofile",
    id: 20,
    media: {
      description:
        '\n\nНастройки вашего профиля: Цвет, описание, день рождения и режим конфиденциальности\n\n✏️\n```python\n!setProfile {"осебе" | "цвет" | "др" | "конфиденциальность"} {value} #для реж. конфиденциальности аргумент value не нужен\n```\n\n',
    },
    accessibility: {
      publicized_on_level: 10,
    },
    alias: "настроитьпрофиль about осебе sp нп налаштуватипрофіль",
    allowDM: true,
    cooldown: 200_000,
    cooldownTry: 5,
    type: "user",
  };
}

export default Command;
