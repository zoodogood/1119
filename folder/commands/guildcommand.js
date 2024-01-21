import { BaseCommand } from "#lib/BaseCommand.js";
import * as Util from "#lib/util.js";
import Template from "#lib/modules/Template.js";

class Command extends BaseCommand {
  async onChatInput(msg, interaction) {
    const heAccpet = await Util.awaitUserAccept({
      name: "guildCommand",
      message: {
        description:
          'Здравствуйте, эта команда очень универсальна и проста, если её не боятся конечно. Она поможет вам создать свои собсвенные команды основанные на "[Шаблонных строках](https://discord.gg/7ATCf8jJF2)".\nЕсли у вас возникнут сложности, обращайтесь :)',
        title: "Команда для создания команд 🤔",
      },
      channel: msg.channel,
      userData: interaction.userData,
    });
    if (!heAccpet) return;

    let answer, react;
    const commands = msg.guild.data.commands || (msg.guild.data.commands = {});

    answer = await msg.channel.awaitMessage(msg.author, {
      title: "Шаг 1. Введите уникальное название команды",
      embed: {
        description: `Оно будет использоватся для вызова.\nСделайте его понятным для пользователей :)`,
        time: 1000000,
      },
    });
    if (!answer) return false;
    answer.content = answer.content
      .replace(/[^a-zа-яїё_$]/gi, "")
      .toLowerCase();

    let cmd;
    if (commands[answer.content]) {
      const oldCommand = await msg.msg({
        title:
          "Команда с таким названием уже существует, вы хотите перезаписать её?",
        description:
          "✏️ — Хочу просто изменить текст этой команды\n🗑️ — Просто удалите это!",
      });
      react = await oldCommand.awaitReact(
        { user: msg.author, removeType: "all" },
        "685057435161198594",
        "763807890573885456",
        "✏️",
        "🗑️",
      );
      oldCommand.delete();
      if (react == 763807890573885456)
        return (
          msg.msg({ title: "Создание команды отменено", delete: 4500 }), false
        );
      else
        cmd = commands[answer.content] = {
          name: answer.content,
          author: msg.author.id,
        };

      if (react == "✏️") {
        answer = await msg.channel.awaitMessage(msg.author, {
          title: "Введите новое сообщение",
        });
        if (!answer) return;
        cmd.message = answer.content;
        return msg.msg({ title: "Новое описание установлено!", delete: 5000 });
      }

      if (react == "🗑️") {
        delete commands[answer.content];
        return msg.msg({
          title: "Команда была полностью удалена.",
          delete: 5000,
        });
      }
    } else
      cmd = commands[answer.content] = {
        name: answer.content,
        author: msg.author.id,
      };

    while (true) {
      answer = await msg.channel.awaitMessage(msg.author, {
        title: "Шаг 2. Введите сообщение содержащее шаблоны `{}`",
        embed: {
          description: `Интересные примеры:\n_Бросок кубика! Выпало: \\{bot.methods.random(6)}._\nНа этом сервере \\{guild.members.count} участников.\nНе бойтесь экспериментировать, это самый простой путь познания такой простой вещи как шаблоны, так же как и лего.`,
          time: 3600000,
        },
      });
      if (!answer) return false;
      cmd.message = answer.content;

      if (!answer.content.match(/!\{.+?\}/g)) {
        const notTemplate = await msg.msg({
          title:
            "В сообщении отсуствуют шаблоны, вы уверены, что хотите продолжить без них?",
        });
        react = await notTemplate.awaitReact(
          { user: msg.author, removeType: "all" },
          "685057435161198594",
          "763807890573885456",
        );
        notTemplate.delete();
        if (react == 685057435161198594) break;
      }
      break;
    }

    let message = await msg.msg({
      title: "Шаг 3. Вашему сообщению нужен эмбед?",
      description: `Подразумивается эмбед-обёртка, цвет и заглавие`,
    });
    react = await message.awaitReact(
      { user: msg.author, removeType: "all" },
      "685057435161198594",
      "763807890573885456",
    );
    message.delete();
    if (react == 685057435161198594) {
      answer = await msg.channel.awaitMessage(msg.author, {
        title: "Укажите оглавление эмбеда",
        embed: {
          description: `Оглавление — голова эмбед сообщения...\nК слову, она также поддерживает шаблоны`,
          time: 1200000,
        },
      });
      if (!answer) return false;
      cmd.title = answer.content;

      answer = await msg.channel.awaitMessage(msg.author, {
        title: "Введите цвет в HEX формате",
        embed: {
          description: `HEX — #ff0000, где первые два числа в 16-значной системе (0,1,2,...,e,f) — красный, потом зеленый и синий`,
          time: 1200000,
        },
      });
      if (!answer) return false;
      cmd.color = answer.content.replace("#", "");
    }

    message = await msg.msg({
      title: "Шаг 4. Перезарядка команды",
      description: `Укажите кулдаун в секундах, на использование команды, этот пункт можно пропустить.`,
    });
    while (true) {
      answer = await Util.awaitReactOrMessage(message, msg.author, "❌");
      if (!answer) return false;
      if (answer != "❌") {
        if (isNaN(answer.content)) {
          msg.msg({
            title: "Указано не число",
            color: "#ff0000",
            delete: 3000,
          });
          continue;
        }
        cmd.cooldown = answer.content * 1000;
        break;
      }
      break;
    }
    message.delete();

    message = await msg.msg({
      title: "Шаг 5. Последний.",
      description: "Нужно ли удалять сообщения вызова команды?",
    });
    react = await message.awaitReact(
      { user: msg.author, removeType: "all" },
      "685057435161198594",
      "763807890573885456",
    );
    if (react == "685057435161198594") cmd.delete = true;
    message.delete();

    msg.msg({
      title: "Готово!",
      description: `Вы создали команду \`!${cmd.name}\`. Самое время её опробовать 😋`,
    });
  }

  options = {
    name: "guildcommand",
    id: 36,
    media: {
      description:
        "\n\nСоздание пользовательских команд на сервере — ещё один этап к многофункциональной системе шаблонов и переменных сервера, обязательно комбинируйте эти технологии\n_устарело*_\n\n✏️\n```python\n!guildCommand #без аргументов\n```\n\n",
    },
    alias:
      "guildcommands createcommand командасерверу командасервера customcommand",
    allowDM: true,
    type: "guild",
    Permissions: 8n,
  };
}

export default Command;
