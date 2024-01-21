import { BaseCommand } from "#lib/BaseCommand.js";
import * as Util from "#lib/util.js";
import { client } from "#bot/client.js";
import { Actions } from "#lib/modules/ActionManager.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import { PresenceUpdateStatus } from "discord.js";

class Command extends BaseCommand {
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

  displayYouNeedBoughtGloves(context) {
    const { channel, userData } = context;
    const title =
      userData.thiefGloves === undefined
        ? "Для использования этой команды нужно купить перчатки"
        : "Вы потеряли все свои перчатки — сначала купите новые";

    return channel.msg({
      title,
      description: "Их, иногда, можно найти в !лавке, по цене 700 коинов",
      color: "#ff0000",
      delete: 7000,
    });
  }

  displayCannotRobOfflineUser(context) {
    const { channel } = context;
    return channel.msg({
      title:
        "Вы не можете ограбить пользователя, находящегося в оффлайн режиме",
      description:
        "Кто ходит по утрам, бродит по утрам и иногда выходит на связь, тоже по утрам",
      color: "#ff0000",
      delete: 7000,
    });
  }

  displayCannotRobRobot(context) {
    const { channel, memb } = context;
    return channel.msg({
      title: `В попытках ограбить бота ${memb.username} вы не учли скорость его реакции.`,
      description: "К счастью роботы не обижаются...",
      color: "#ff0000",
    });
  }

  getContext(interaction) {
    const { user, channel, params } = interaction;
    const userData = user.data;
    const memb = interaction.mention;
    const member = interaction.guild.members.resolve(memb);

    const note = params.replace(memb.toString(), "").trim();
    const isTargetHurted = memb.data.thiefWins < -5;
    const isMonsterCanHelp =
      memb.data.voidMonster && !(memb.data.CD_39 > Date.now());
    const isDetectiveTraced =
      isTargetHurted &&
      Util.random(1 / (-memb.data.thiefWins * 2.87), { round: false }) <= 0.01;

    return {
      interaction,
      user,
      userData,
      channel,
      memb,
      member,
      params,
      note,
      isTargetHurted,
      isMonsterCanHelp,
      isDetectiveTraced,
      robCoinsValue: null,
      robCoinsReturned: null,
      mailYouAreRobbed: null,
      isCaughtByMonster: null,
      isCaughtByDetective: null,
      isRob: null,
      isRobSuccess: null,
      isCaught: null,
      isHurtedForgave: null,
    };
  }

  resetCombo(context) {
    const { user, userData } = context;
    Util.addResource({
      user,
      value: -(userData.thiefCombo ?? 0),
      resource: PropertiesEnum.thiefCombo,
      executor: user,
      source: "command.rob.resetCombo",
      context,
    });
  }

  resetThiefWins(context) {
    const { user, userData, memb } = context;
    Util.addResource({
      user: memb,
      value: -(userData.thiefWins ?? 0),
      resource: PropertiesEnum.thiefWins,
      executor: user,
      source: "command.rob.resetThiefWins",
      context,
    });
  }

  calculateRobValue(context) {
    const { userData, memb } = context;
    const combo = userData.thiefCombo || 0;
    const membWins = memb.data.thiefWins || 0;
    let k =
      1 + (membWins > 0 ? membWins * 1.2 : Math.max(membWins, -10) * 0.07);

    if (memb.data.voidMonster) {
      k *= 12;
    }

    return (
      Math.floor(Util.random(21, 49) * (combo / 10 + 1) * k) +
      memb.data.level * 3
    );
  }

  displayYouAreRobbed(context) {
    const { memb, robCoinsValue } = context;
    return memb.msg({
      title: "❕ Вы были ограблены",
      description: `Ловкий вор средь бело-дня украл у вас ${robCoinsValue} <:coin:637533074879414272>\nУ вас есть минута, нажмите реакцию ниже, чтобы среагировать, догнать преступника и вернуть коины`,
      color: "#ff0000",
    });
  }

  displayMailOfRobNotDelivered(context) {
    const { user } = context;
    user.msg({
      title: "Не удалось ограбить пользователя",
      description:
        'Скорее всего у участника включена функция "Не принимать личные сообщения от участников сервера" — из-за чего бот не может оповестить о краже... Попробуйте ограбить другого участника',
    });
  }

  onSelfRob(context) {
    const { channel } = context;
    channel.msg({
      title: "Среди бела-дня вы напали на себя по непонятной причине",
      description:
        'Пока вы кричали "Вор! Вор! Ловите вора!", к вам уже подъежала лесная скорая',
      image:
        "https://media.discordapp.net/attachments/629546680840093696/1048500012360929330/rob.png",
    });
    return;
  }

  rob() {}

  sendCaughtMessagesToThief(context) {
    const { user, memb } = context;
    const { isCaughtByDetective, isCaughtByMonster, isHurtedForgave } = context;
    if (isCaughtByMonster) {
      user.msg({
        title: `Вас настиг огромный монстр. Неудалось похитить коины.`,
        color: "#ff0000",
      });
      return;
    }

    if (isCaughtByDetective) {
      user.msg({
        title: `Вас поймал на горячем местный детектив`,
        description: `Он давно заинтересовался ${memb} ввиду частых нападений. Теперь вам светит потеря перчаток с компенсацией ущерба.`,
        color: "#ff0000",
      });
      return;
    }

    if (isHurtedForgave) {
      user.msg({
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
      return;
    }
  }

  displayRobMessage(context) {
    const { channel, robCoinsValue, memb, userData, user } = context;
    channel.msg({
      title: "Ограблено и украдено, теперь бежать",
      description: `Вы успешно украли ${robCoinsValue} <:coin:637533074879414272> у ${memb.username}, но это ещё не конец, если вас догонят, награбленное вернётся к владельцу.\nУ ${memb.username} есть минута, чтобы среагировать, в ином случае добыча останется с вами навсегда.`,
      author: { name: user.username, iconURL: user.avatarURL() },
      footer: { text: `Серия ограблений: ${userData.thiefCombo}` },
      delete: 10_000,
    });
  }

  applyThiefVoidBonus(context) {
    const { user, userData } = context;
    if (userData.voidThief) {
      Util.addResource({
        user,
        resource: PropertiesEnum.chestBonus,
        value: userData.voidThief * 15,
        source: "command.rob.voidThief",
        executor: user,
        context,
      });
    }
  }

  async processRob(context) {
    const {
      mailYouAreRobbed,
      interaction,
      user,
      memb,
      robCoinsValue,
      userData,
      channel,
    } = context;

    context.isRob = true;
    this.transferCoins(user, memb, robCoinsValue, context);
    interaction.userData.CD_39 += 7_200_000;

    this.displayRobMessage(context);
    const react = await mailYouAreRobbed.awaitReact(
      { user: memb, removeType: "none", time: 60_000 },
      "❗",
    );

    const { note, isDetectiveTraced, isMonsterCanHelp, isTargetHurted } =
      context;

    if (react || isMonsterCanHelp || isDetectiveTraced) {
      context.isCaught = true;
      this.transferCoins(user, memb, -robCoinsValue, context);

      if (react) {
        Util.addResource({
          user,
          resource: PropertiesEnum.thiefGloves,
          value: -1,
          executor: user,
          source: "command.rob.caught",
          context,
        });
        let accusation = "";
        let action = "Вы вернули свои коины и хорошо с ним посмеялись";
        const explanation = `${memb.username} успел среагировать и вернул коины`;

        if (isTargetHurted) {
          const hurtMessage = await memb.msg({
            title: "❔ Простить Вора?",
            description: `Если вы его простите, возможно, он украдёт снова, по статистике 98% воров делают это опять, и опять.\nОсторожно! Вы не сможете узнать кто вас ограбил и не обнулите серию пропущенных атак.\nВ ином случае часть его коинов уйдет к вам.`,
          });
          const react = await hurtMessage.awaitReact(
            { user: memb, removeType: "none", time: 60_000 },
            "😇",
            "😈",
          );

          context.isHurtedForgave = react === "😇";
          if (context.isHurtedForgave) {
            mailYouAreRobbed.msg({
              footer: { text: "— 💚." },
              author: {
                iconURL: client.user.avatarURL(),
                name: "Что-же... Это было мило. Наверное...",
              },
            });
            return;
          }

          context.robCoinsReturned = Math.floor(interaction.userData.coins / 3);
          this.transferCoins(user, memb, -context.robCoinsReturned, {
            interaction,
            mode: "coinsReturn",
          });

          accusation = `Сейчас он обвиняется как миниум в ${-memb.data
            .thiefWins} грабежах и других серьёзных преступлениях, к его горю пострадавший не смог простить такого предательства. В качестве компенсации 30% коинов пользователя (${
            context.robCoinsReturned
          }) <:coin:637533074879414272> переданы их новому владельцу.`;
          action = `Однако вы не смогли простить предательства, будучи уверенными, что все ${Util.ending(
            -memb.data.thiefWins,
            "раз",
            "",
            "а",
            "",
          )} были ограблены именно им.`;
        }

        channel.msg({
          title: "Пойманный вор",
          description: `Сегодня енотовская полиция задержала всеми знакомого жителя ${user.toString()}, он был пойман при попыке стащить коины у ${
            memb.username
          }, как утверждает сам задержанный, эти коины ему нужны были, чтобы сделать подарок детишкам.`,
          color: "#ff0000",
          author: {
            name: user.username,
            iconURL: user.avatarURL(),
          },
          footer: { text: memb.username, iconURL: memb.avatarURL() },
        });

        !(memb.data.thiefWins > 0) && this.resetThiefWins(context);
        Util.addResource({
          user: memb,
          resource: PropertiesEnum.thiefWins,
          value: 1,
          executor: user,
          source: "command.rob.caught",
          context,
        });
        mailYouAreRobbed.msg({
          title: "Ого какая скорость, вы в спортзал ходили?",
          description: `Вы быстро догнали воришку, им оказался ваш знакомый ${user.username}\n${action}`,
        });
        return;
      }

      if (isMonsterCanHelp) {
        context.isCaughtByMonster = true;
        channel.msg({
          title: "Почти съеденный вор",
          description: `Сегодня огромный монстр 🐲 задержал всеми знакомого жителя ${user.toString()}, он был пойман при попыке стащить коины у ${
            memb.username
          }, как утверждает сам задержанный, эти коины ему нужны были, чтобы сделать подарок детишкам.`,
          color: "#ff0000",
          author: {
            name: user.username,
            iconURL: user.avatarURL(),
          },
          footer: { text: memb.username, iconURL: memb.avatarURL() },
        });
        mailYouAreRobbed.msg({
          title: "Ваш ручной монстр догнал воришку 🐲",
          description: `Чуть не съев беднягу, монстр вернул ваши коины, грабителем оказался ваш глупый знакомый ${user.username}...`,
        });

        if (note) {
          mailYouAreRobbed.msg({
            title: "У себя в карманах вы также обнаружили записку:",
            description: note,
          });
        }
        return;
      }

      if (isDetectiveTraced) {
        context.robCoinsReturned =
          -memb.data.thiefWins * 20 * Math.round(userData.thiefCombo / 2 + 2);
        this.transferCoins(user, memb, -context.robCoinsReturned, {
          interaction,
          mode: "detective",
        });

        context.isCaughtByDetective = true;

        interaction.userData.thiefGloves = -2;
        this.resetCombo(context);
        memb.data.thiefWins += 5;

        channel.msg({
          title: "Вора на горячем поймал герой-детектив",
          description: `Известный следователь уже давно наблюдал за ${
            memb.username
          }, и не зря! Сегодня на него напал вор — ${user}  был пойман при попытке украсть коины. Как утверждает сам задержанный, эти коины ему нужны были, чтобы сделать подарок детишкам. Однако за серию в ${-memb
            .data
            .thiefWins} нападений, он обязан заплатить компенсацию в размере ${
            context.robCoinsReturned
          } <:coin:637533074879414272> коинов и сдать любые свои перчатки.\nЭтот детектив убеждён, пока он защищает этот лес — боятся нечего!`,
          color: "#ff0000",
          author: {
            name: user.username,
            iconURL: user.avatarURL(),
          },
          footer: { text: memb.username, iconURL: memb.avatarURL() },
        });
        mailYouAreRobbed.msg({
          title: "Вас снова попытались ограбить",
          description: `Местный детектив давно следил за вами ввиду того, что вас грабили не один раз. Вам повезло, что сейчас он оказался рядом и смог поймать вора!`,
        });
        return;
      }
    }
  }
  async onChatInput(msg, interaction) {
    const context = this.getContext(interaction);
    const { userData, user, memb, member } = context;

    if (!userData.thiefGloves || userData.thiefGloves < 1) {
      this.displayYouNeedBoughtGloves(context);
      return;
    }

    if (memb.id === user.id) {
      this.onSelfRob(context);
      return;
    }

    if (memb.bot) {
      this.displayCannotRobRobot(context);
      return;
    }

    const robCoinsValue = this.calculateRobValue(context);
    context.robCoinsValue = robCoinsValue;

    if (
      !member.presence ||
      member.presence.status === PresenceUpdateStatus.Offline
    ) {
      this.displayCannotRobOfflineUser(context);
      return;
    }

    context.mailYouAreRobbed = await this.displayYouAreRobbed(context).catch(
      () => {},
    );

    if (!context.mailYouAreRobbed) {
      this.displayMailOfRobNotDelivered(context);
      return;
    }

    await this.processRob(context);
    context.mailYouAreRobbed.reactions.cache.get("❗").users.remove();

    if (context.isCaught) {
      this.sendCaughtMessagesToThief(context);
    }

    if (!context.isCaught) {
      this.onSuccessRob(context);
    }

    this.checkQuestsAvailable(context);
    this.applyThiefVoidBonus(context);
  }

  onSuccessRob(context) {
    context.isRobSuccess = true;

    const { mailYouAreRobbed, user, memb, note, isMonsterCanHelp } = context;

    Util.addResource({
      user,
      value: 1,
      resource: PropertiesEnum.thiefCombo,
      executor: user,
      source: "command.rob.classic",
      context,
    });

    !(memb.data.thiefWins < 0) && this.resetThiefWins(context);
    Util.addResource({
      user: memb,
      resource: PropertiesEnum.thiefWins,
      value: -1,
      executor: user,
      source: "command.rob.successRob",
      context,
    });

    let description = "";
    if (note) {
      description = `У себя в карманах вы обнаружили записку:\n— ${note}`;
    }

    if (memb.data.voidMonster && !isMonsterCanHelp) {
      description =
        "Ваш монстр не захотел вам помочь, известно, что недавно вы сами ограбили своего друга.\n" +
        description;
    }
    mailYouAreRobbed.msg({
      title: "Вы слишком долго не могли прийти в себя — вор ушёл.",
      description: description,
      color: "#ff0000",
    });

    this.displayCurrentCombo(context);
  }

  displayCurrentCombo(context) {
    const { user, userData } = context;
    user.msg({
      title: `Всё прошло успешно — вы скрылись и вас не узнали!\nТекущее комбо: ${
        userData.thiefCombo || 0
      }`,
    });
  }

  checkQuestsAvailable(context) {
    const { memb, userData, user } = context;
    if (userData.thiefCombo === 7)
      user.action(Actions.globalQuest, { name: "thief" });

    if (memb.data.thiefWins >= 9)
      user.action(Actions.globalQuest, { name: "crazy" });
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
    alias: "ограбить роб украсть вкрасти крадіжка",
    expectMention: true,
    allowDM: true,
    cooldown: 3_000,
    type: "user",
  };
}

export default Command;
