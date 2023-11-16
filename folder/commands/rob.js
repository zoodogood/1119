import * as Util from "#lib/util.js";
import { client } from "#bot/client.js";
import { Actions } from "#lib/modules/ActionManager.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";

class Command {
  transferCoins(target, source, value, context) {
    Util.addResource({
      user: source,
      value: -value,
      executor: source,
      source: "command.rob.transfer",
      resource: PropertiesEnum.coins,
      context,
    });
    Util.addResource({
      user: target,
      value: value,
      executor: source,
      source: "command.rob.transfer",
      resource: PropertiesEnum.coins,
      context: { ...context, source, target },
    });
  }
  async onChatInput(msg, interaction) {
    const memb = interaction.mention;
    const user = interaction.user;
    const member = interaction.guild.members.resolve(memb);

    if (!interaction.userData.thiefGloves)
      return msg.msg({
        title: "Для использования этой команды нужно купить перчатки",
        description: "Их, иногда, можно найти в !лавке, по цене 700 коинов",
        color: "#ff0000",
        delete: 7000,
      });

    let count = interaction.userData.thiefGloves;
    let combo = interaction.userData.thiefCombo || 0;

    if (memb.id === msg.author.id) {
      msg.msg({
        title: "Среди бела-дня вы напали на себя по непонятной причине",
        description:
          'Пока вы кричали "Вор! Вор! Ловите вора!", к вам уже подъежала лесная скорая',
        image:
          "https://media.discordapp.net/attachments/629546680840093696/1048500012360929330/rob.png",
      });
      return;
    }

    if (!count || +count < 1)
      return msg.msg({
        title: "Вы потеряли все свои перчатки — сначала купите новые",
        color: "#ff0000",
        delete: 7000,
      });

    if (memb.bot)
      return msg.msg({
        title: `В попытках ограбить бота ${memb.username} вы не учли скорость его реакции.`,
        description: "К счастью роботы не обижаются...",
        color: "#ff0000",
      });

    let membWins = (memb.data.thiefWins |= 0);
    let k =
      1 + (membWins > 0 ? membWins * 1.2 : Math.max(membWins, -10) * 0.07);

    if (memb.data.voidMonster) {
      k *= 12;
    }

    const rand =
      ~~(Util.random(21, 49) * (combo / 10 + 1) * k) + memb.data.level;

    if (!member.presence || member.presence.status === "offline")
      return msg.msg({
        title:
          "Вы не можете ограбить пользователя, находящегося в оффлайн режиме",
        description:
          "Кто ходит по утрам, бродит по утрам и иногда выходит на связь, тоже по утрам",
        color: "#ff0000",
        delete: 7000,
      });

    const message = await memb
      .msg({
        title: "❕ Вы были ограблены",
        description: `Ловкий вор средь бело-дня украл у вас ${rand} <:coin:637533074879414272>\nУ вас есть минута, нажмите реакцию ниже, чтобы среагировать, догнать преступника и вернуть коины`,
        color: "#ff0000",
      })
      .catch(() => {});

    if (!message) {
      msg.author.msg({
        title: "Не удалось ограбить пользователя",
        description:
          'Скорее всего у участника включена функция "Не принимать личные сообщения от всех участников сервера" Из-за чего бот не может оповестить о краже...',
      });
      return;
    }

    this.transferCoins(user, memb, rand, {
      interaction,
      mode: "classic",
    });
    interaction.userData.CD_39 += 7_200_000;

    msg.msg({
      title: "Ограблено и украдено, теперь бежать",
      description: `Вы успешно украли ${rand} <:coin:637533074879414272> у ${memb.username}, но это ещё не конец, если вас догонят, награбленное вернётся к владельцу.\nУ ${memb.username} есть минута, чтобы среагировать, в ином случае добыча останется с вами навсегда.`,
      author: { name: msg.author.username, iconURL: msg.author.avatarURL() },
      footer: { text: "Серия ограблений: " + ++combo },
      delete: 10000,
    });
    let react = await message.awaitReact(
      { user: memb, removeType: "none", time: 60000 },
      "❗",
    );

    const note = interaction.params
        .slice(interaction.mention.toString().length + 1)
        .trim(),
      monsterHelps = memb.data.voidMonster && !(memb.data.CD_39 > Date.now()),
      hurt = memb.data.thiefWins < -5,
      detective =
        hurt &&
        Util.random(1 / (-memb.data.thiefWins * 2.87), { round: false }) <=
          0.01;

    if (react || monsterHelps || detective) {
      this.transferCoins(user, memb, -rand, {
        interaction,
        mode: "caught",
      });
      let coinsReturn;

      if (react) {
        interaction.userData.thiefGloves = --count;
        interaction.userData.thiefCombo = 0;
        let accusation = "";
        let action = "Вы вернули свои коины и хорошо с ним посмеялись";
        const explanation = `${memb.username} успел среагировать и вернул коины`;

        if (hurt) {
          const hurtMessage = await memb.msg({
            title: "❔ Простить Вора?",
            description: `Если вы его простите, возможно, он украдёт снова, по статистике 98% воров делают это опять, и опять.\nОсторожно! Вы не сможете узнать кто вас ограбил и не обнулите серию пропущенных атак.\nВ ином случае часть его коинов уйдет к вам.`,
          });
          react = await hurtMessage.awaitReact(
            { user: memb, removeType: "none", time: 60000 },
            "😇",
            "😈",
          );
          if (react === "😇") {
            msg.author.msg({
              title: `Вы были пойманы`,
              description: `${
                memb.username
              } уверен, что это вы его ограбили ${Util.ending(
                -memb.data.thiefWins,
                "раз",
                "",
                "а",
                "",
              )} подряд, но также решил просто простить вас за это и не требовать с вас никаких денег.`,
              color: "#ff0000",
            });
            message.msg({
              footer: { text: "— 💚." },
              author: {
                iconURL: client.user.avatarURL(),
                name: "Что-же... Это было мило. Наверное...",
              },
            });
            return;
          }

          coinsReturn = Math.floor(interaction.userData.coins / 3);
          this.transferCoins(user, memb, -coinsReturn, {
            interaction,
            mode: "coinsReturn",
          });

          accusation = `Сейчас он обвиняется как миниум в ${-memb.data
            .thiefWins} грабежах и других серьёзных преступлениях, к его горю пострадавший не смог простить такого предательства. В качестве компенсации 30% коинов пользователя (${coinsReturn}) <:coin:637533074879414272> переданы их новому владельцу.`;
          action = `Однако вы не смогли простить предательства, будучи уверенными, что все ${Util.ending(
            -memb.data.thiefWins,
            "раз",
            "",
            "а",
            "",
          )} были ограблены именно им.`;
        }

        msg.msg({
          title: "Пойманный вор",
          description: `Сегодня енотовская полиция задержала всеми знакомого жителя ${msg.author.toString()}, он был пойман при попыке стащить коины у ${
            memb.username
          }, как утверждает сам задержанный, эти коины ему нужны были, чтобы сделать подарок детишкам.`,
          color: "#ff0000",
          author: {
            name: msg.author.username,
            iconURL: msg.author.avatarURL(),
          },
          footer: { text: memb.username, iconURL: memb.avatarURL() },
        });
        memb.data.thiefWins = Math.max(1, ++membWins);
        message.msg({
          title: "Ого какая скорость, вы в спортзал ходили?",
          description: `Вы быстро догнали воришку, им оказался ваш знакомый ${msg.author.username}\n${action}`,
        });
        return;
      }

      if (monsterHelps) {
        msg.author.msg({
          title: `Вас настиг огромный монстр. Неудалось похитить коины.`,
          color: "#ff0000",
        });
        msg.msg({
          title: "Почти съеденный вор",
          description: `Сегодня огромный монстр 🐲 задержал всеми знакомого жителя ${msg.author.toString()}, он был пойман при попыке стащить коины у ${
            memb.username
          }, как утверждает сам задержанный, эти коины ему нужны были, чтобы сделать подарок детишкам.`,
          color: "#ff0000",
          author: {
            name: msg.author.username,
            iconURL: msg.author.avatarURL(),
          },
          footer: { text: memb.username, iconURL: memb.avatarURL() },
        });
        message.msg({
          title: "Ваш ручной монстр догнал воришку 🐲",
          description: `Чуть не съев беднягу, монстр вернул ваши коины, грабителем оказался ваш глупый знакомый ${msg.author.username}...`,
        });

        if (note) {
          message.msg({
            title: "У себя в карманах вы также обнаружили записку:",
            description: note,
          });
        }
        return;
      }

      if (detective) {
        coinsReturn = -memb.data.thiefWins * 20 * Math.round(combo / 2 + 2);
        this.transferCoins(user, memb, -coinsReturn, {
          interaction,
          mode: "detective",
        });

        interaction.userData.thiefGloves = -2;
        interaction.userData.thiefCombo = 0;
        memb.data.thiefWins += 5;

        msg.author.msg({
          title: `Вас поймал на горячем местный детектив`,
          description: `Он давно заинтересовался ${memb} ввиду частых нападений. Теперь вам светит потеря перчаток с компенсацией ущерба.`,
          color: "#ff0000",
        });
        msg.msg({
          title: "Вора на горячем поймал герой-детектив",
          description: `Известный следователь уже давно наблюдал за ${
            memb.username
          }, и не зря! Сегодня на него напал вор — ${
            msg.author
          }  был пойман при попытке украсть коины. Как утверждает сам задержанный, эти коины ему нужны были, чтобы сделать подарок детишкам. Однако за серию в ${-memb
            .data
            .thiefWins} нападений, он обязан заплатить компенсацию в размере ${coinsReturn} <:coin:637533074879414272> коинов и сдать любые свои перчатки.\nЭтот детектив убеждён, пока он защищает этот лес — боятся нечего!`,
          color: "#ff0000",
          author: {
            name: msg.author.username,
            iconURL: msg.author.avatarURL(),
          },
          footer: { text: memb.username, iconURL: memb.avatarURL() },
        });
        message.msg({
          title: "Вас снова попытались ограбить",
          description: `Местный детектив давно следил за вами ввиду того, что вас грабили не один раз. Вам повезло, что сейчас он оказался рядом и смог поймать вора!`,
        });
        return;
      }
    }

    if (combo === 7) msg.author.action(Actions.globalQuest, { name: "thief" });

    if (memb.data.thiefWins >= 9)
      msg.author.action(Actions.globalQuest, { name: "crazy" });

    if (interaction.userData.voidThief)
      interaction.userData.chestBonus =
        (interaction.userData.chestBonus || 0) +
        interaction.userData.voidThief * 15;

    let description = "";
    if (note) {
      description = `У себя в карманах вы обнаружили записку:\n— ${note}`;
    }

    if (memb.data.voidMonster && !monsterHelps) {
      description =
        "Ваш монстр не захотел вам помочь, известно, что недавно вы сами ограбили своего друга.\n" +
        description;
    }
    message.msg({
      title: "Вы слишком долго не могли прийти в себя — вор ушёл.",
      description: description,
      color: "#ff0000",
    });

    interaction.userData.thiefGloves = count;
    interaction.userData.thiefCombo = combo;
    msg.author.msg({
      title: `Всё прошло успешно — вы скрылись и вас не узнали!\nТекущее комбо: ${combo}`,
    });

    message.reactions.cache.get("❗").users.remove();
    memb.data.thiefWins = Math.min(-1, --membWins);
  }

  options = {
    name: "rob",
    id: 39,
    media: {
      description:
        "Правила просты:\nВаши перчатки позволяют ограбить участника, при условии, что он находится онлайн.\nВ течении минуты у ограбленного есть возможность догнать вас и вернуть деньги.\nЕсли попадётесь дважды, то перчатки нужно покупать заново — риск.\nНужно быть осторожным и ловким, искать момента.\n\nА пользователям стоит применять хитрость, если кто-то обнаружил, что у вас есть перчатки.\nЦель участников спровоцировать на них напасть и поймать вас на горячем, а вор, то есть вы, должен выждать хорошего момента и совершить атаку.\n\n✏️\n```python\n!rob {memb} <note> # С помощью `note` вы можете оставлять записки пользователям, которых грабите\n```",
      poster:
        "https://static.tumblr.com/3f31d88965fd2e42728392a079958659/ngjf4de/g0np1hy8q/tumblr_static_filename_2048_v2.gif",
    },
    allias: "ограбить роб украсть вкрасти крадіжка",
    expectMention: true,
    allowDM: true,
    cooldown: 3_000,
    type: "user",
  };
}

export default Command;
