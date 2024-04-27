import { BaseCommand } from "#lib/BaseCommand.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import * as Util from "#lib/util.js";
import { AttachmentBuilder } from "discord.js";

class Command extends BaseCommand {
  async onChatInput(msg, interaction) {
    const { default: canvas } = await import("canvas");

    let i = 9;
    const canv = canvas.createCanvas(300, i * 30 + 30),
      ctx = canv.getContext("2d"),
      rules = {
        "!111": "3",
        "!222": "32",
        "!11": "21",
        "!22": "22",
        "!33": "23",
        "!1": "11",
        "!2": "12",
        "!3": "13",
      };

    let last = String(Util.random(1, 1));

    ctx.font = "bold 20px sans-serif";
    ctx.shadowBlur = 2;
    ctx.shadowColor = "rgba(19, 202, 36, 0.3)";
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    while (i > 0) {
      let input = "";
      i--;
      ctx.fillStyle = "#13ca24";
      ctx.fillText(
        last,
        150 - ctx.measureText(last).width / 2,
        canv.height - (i + 1) * 30,
      );
      while (last) {
        const found = Object.keys(rules).find((e) =>
          last.startsWith(e.slice(1)),
        );
        input += rules[found];
        last = last.slice(found.length - 1);
        ctx.fillStyle = "#f2fafa";
        ctx.fillRect(Util.random(canv.width), Util.random(canv.height), 2, 2);
        ctx.fillRect(Util.random(canv.width), Util.random(canv.height), 1, 1);
        ctx.fillStyle = "rgba(242, 250, 250, 0.5)";
        ctx.fillRect(Util.random(canv.width), Util.random(canv.height), 3, 3);
      }

      last = input;
    }
    ctx.shadowColor = "rgba(150, 75, 0, 0.3)";
    ctx.fillStyle = "#964B00";
    ctx.fillText("???", 134, canv.height);

    ctx.strokeStyle = "rgba(19, 202, 36, 0.5)";
    ctx.shadowColor = "rgba(19, 202, 36, 0.3)";
    ctx.beginPath();

    ctx.moveTo(150, 7.5);
    ctx.lineTo(50, canv.height - 20);
    ctx.lineTo(135, canv.height - 20);
    ctx.lineTo(135, canv.height - 24);

    ctx.moveTo(150, 7.5);
    ctx.lineTo(250, canv.height - 20);
    ctx.lineTo(165, canv.height - 20);
    ctx.lineTo(165, canv.height - 24);

    ctx.stroke();

    ctx.shadowColor = "rgba(255, 255, 0, 0.3)";
    ctx.fillStyle = "#ff0";
    ctx.beginPath();
    ctx.moveTo(150, 0);
    ctx.lineTo(145, 5);
    ctx.lineTo(150, 10);
    ctx.lineTo(155, 5);
    ctx.closePath();
    ctx.fill();

    const image = canv.toBuffer("image/png");

    let reward = (Date.now() - 1607558400000) / 500000;
    reward = reward - (reward % 5);

    const message = await msg.msg({
      title: "Новогодняя ёлочка",
      description: `Решите головоломку и получите награду!\nЗамените "???", в конце ёлочки, на число, чтобы ответить правильно, обязательно используйте голову.\nДля ввода ответ, нажмите реакцию ниже*. Удачи.\nТекущая награда: **${reward}** <:coin:637533074879414272>`,
      image: "attachment://pazzle.png",
      files: [new AttachmentBuilder(image, { name: "puzzle.png" })],
      color: "#f2fafa",
      author: { name: msg.author.username, iconURL: msg.author.avatarURL() },
      delete: 100_000,
    });
    const react = await message.awaitReact(
      { user: msg.author, removeType: "all" },
      "✅",
    );

    if (!react) return message.delete();

    const _questionMessage = await interaction.channel.msg({
      title: "3... 2.. 1.! Пробуем...!",
      color: "#f2fafa",
    });
    let answer = await msg.channel.awaitMessage({ user: msg.author });
    _questionMessage.delete();

    answer = answer.content;
    if (isNaN(answer))
      return msg.msg({
        title: "Ответом должно быть число!",
        color: "#ff0000",
        delete: 5000,
      });

    if (answer === String(last)) {
      Util.addResource({
        user: interaction.user,
        value: reward,
        executor: interaction.user,
        source: "command.puzzle",
        resource: PropertiesEnum.coins,
        context: { interaction },
      });

      return msg.msg({
        title: "И это... Правильный ответ! Ваша награда уже у вас в карманах!",
        delete: 5000,
      });
    }

    const percent = Math.round(
      (1 - Util.similarity(last, answer) / last.length) * 100,
    );
    let phrase;
    switch (true) {
      case percent < 10:
        phrase = `Ответ не верный.\nСовет: в ответе ровно **${last.length}** цифр`;
        break;
      case percent < 25:
        phrase = `Похоже вы встали на верный путь и скоро разгадаете эту задачку, не сдавайтесь!`;
        break;
      case percent < 80:
        phrase = `На ${percent}% вы ответили — правильно! Интересный факт: картошка — это фонарь, лишь на 11.76%.`;
        break;
      case percent < 101:
        phrase = `Осталось совсем чуть-чуть! У вас получится, ||но ответ всё ещё не верный.||`;
    }
    message.delete();
    msg.msg({ title: phrase, color: "#f2fafa", delete: 9000 });
  }

  options = {
    name: "puzzle",
    id: 34,
    media: {
      description:
        "Только величайшие из невеличайших смогут разгадать этот пазл, и то, почему-же он удалён...\n🧐",
      example: `!puzzle <answer> #answer — ответ на головоломку, ответите правильно, получите 3000 золотых`,
    },
    alias: "пазл ёлка елка",
    allowDM: true,
    type: "delete",
  };
}

export default Command;
