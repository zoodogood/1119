import { BaseCommand } from "#lib/BaseCommand.js";
import DataManager from "#lib/modules/DataManager.js";
import { Actions } from "#lib/modules/ActionManager.js";
import { addMultipleResources } from "#lib/util.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import { createDefaultPreventable } from "#lib/createDefaultPreventable.js";

class Command extends BaseCommand {
  static INFLATION = 0.2;
  static BERRYS_LIMIT = 1_500;
  static TAX = 0.02;

  static getMaxCountForBuy(coins, price) {
    const a = this.INFLATION / 2;
    const b = price;
    const c = -coins;

    const discriminant = b ** 2 - 4 * a * c;
    const x2 = (discriminant ** 0.5 - b) / (2 * a);

    return x2;
  }

  static calculatePrice = (quantity, marketPrice, isBuying = false) => {
    quantity = isBuying
      ? quantity
      : Math.min(marketPrice / this.INFLATION, quantity);

    // Налог
    const tax = isBuying ? 1 : 1 - this.TAX;
    // Инфляция
    const inflation = ((quantity * this.INFLATION) / 2) * (-1) ** !isBuying;

    const price = Math.round((marketPrice + inflation) * quantity * tax);
    return price;
  };

  exchanger(context, quantity, isBuying) {
    const { interaction, userData, marketPrice } = context;
    const { user } = interaction;

    const myBerrys = userData.berrys;

    if (quantity === "+") {
      quantity = isBuying
        ? Command.getMaxCountForBuy(userData.coins, marketPrice)
        : myBerrys;
    }

    quantity = Math.floor(quantity);

    if (isNaN(quantity)) {
      interaction.channel.msg({
        title: "Указана строка вместо числа",
        color: "#ff0000",
        delete: 5000,
      });
      return;
    }

    if (quantity < 0) {
      interaction.channel.msg({
        title:
          "Введено отрицательное значение.\n<:grempen:753287402101014649> — Укушу.",
        color: "#ff0000",
        delete: 5000,
      });
      return;
    }

    if (!isBuying && quantity > myBerrys) {
      interaction.channel.msg({
        title: `Вы не можете продать ${quantity} <:berry:756114492055617558>, у вас всего ${myBerrys}`,
        color: "#ff0000",
        delete: 5000,
      });
      return;
    }

    if (isBuying && myBerrys + quantity > context.MAX_LIMIT) {
      quantity = Math.max(context.MAX_LIMIT - myBerrys, 0);
    }

    const price = Command.calculatePrice(quantity, marketPrice, isBuying);

    if (isBuying && userData.coins < price) {
      interaction.channel.msg({
        title: `Не хватает ${
          price - userData.coins
        } <:coin:637533074879414272>`,
        delete: 5000,
      });
      return;
    }

    const _context = {
      quantity,
      interaction,
      isBuying,
      price,
      channel: interaction.channel,
      primary: context,
      ...createDefaultPreventable(),
    };

    interaction.user.action(Actions.beforeBerryBarter, _context);

    if (_context.defaultPrevented()) {
      interaction.channel.msg({
        description:
          "Взаимодействие с клубникой заблокировано внешним эффектом",
      });
      return;
    }

    interaction.user.action(Actions.berryBarter, _context);

    addMultipleResources({
      user,
      executor: user,
      source: "command.berry.barter",
      context: _context,
      resources: {
        [PropertiesEnum.coins]: price * (-1) ** isBuying,
        [PropertiesEnum.berrys]: quantity * (-1) ** !isBuying,
      },
    });

    context.marketPrice = DataManager.data.bot.berrysPrice = Math.max(
      DataManager.data.bot.berrysPrice +
        quantity * context.INFLATION * (-1) ** !isBuying,
      0,
    );
    interaction.channel.msg({
      title:
        isBuying > 0
          ? `Вы купили ${quantity} <:berry:756114492055617558>! потратив ${price} <:coin:637533074879414272>!`
          : `Вы продали ${quantity} <:berry:756114492055617558> и заработали ${price} <:coin:637533074879414272>!`,
      delete: 5000,
    });
  }

  displayUserBerrys(context) {
    const { interaction, marketPrice } = context;
    const user = interaction.mention;
    const berrys = user.data.berrys || 0;

    interaction.channel.msg({
      title: "Клубника пользователя",
      description: `Клубничек — **${berrys}** <:berry:756114492055617558>\nРыночная цена — **${Math.round(
        marketPrice,
      )}** <:coin:637533074879414272>`,
      author: {
        name: user.tag,
        iconURL: user.avatarURL(),
      },
      footer: {
        text: `Общая цена ягодок: ${Command.calculatePrice(
          berrys,
          marketPrice,
          -1,
        )}`,
      },
    });
    return;
  }

  handleParams(context) {
    const { interaction } = context;
    const parsed = interaction.params.split(" ").filter(Boolean);
    const [action, quantity] = parsed;

    if (action === "buy" || action === "купить") {
      this.exchanger(context, quantity, true);
    }
    if (action === "sell" || action === "продать") {
      this.exchanger(context, quantity, false);
    }
  }

  async updateMessageInterface(context) {
    const { interaction, userData, marketPrice } = context;
    const isMessageExists = !!context.interfaceMessage;
    const target = isMessageExists
      ? context.interfaceMessage
      : interaction.channel;
    context.interfaceMessage = await target.msg({
      edit: isMessageExists ? true : false,
      description: `У вас клубничек — **${
        userData.berrys
      }** <:berry:756114492055617558>\nРыночная цена — **${Math.round(
        marketPrice,
      )}** <:coin:637533074879414272>\n\nОбщая цена ваших ягодок: ${Command.calculatePrice(
        userData.berrys,
        marketPrice,
      )} (с учётом налога ${
        context.TAX * 100
      }% и инфляции)\n\n📥 - Покупка | 📤 - Продажа;`,
      author: {
        name: interaction.user.tag,
        iconURL: interaction.user.avatarURL(),
      },
    });

    return context.interfaceMessage;
  }

  getContext(interaction) {
    const MAX_LIMIT = this.constructor.BERRYS_LIMIT;
    const INFLATION = this.constructor.INFLATION;
    const TAX = this.constructor.TAX;

    const botData = DataManager.data.bot;
    const userData = interaction.userData;

    const marketPrice = botData.berrysPrice;

    const context = {
      interaction,
      userData,
      marketPrice,
      interfaceMessage: null,
      MAX_LIMIT,
      INFLATION,
      TAX,
    };

    return context;
  }

  async onChatInput(msg, interaction) {
    const context = this.getContext(interaction);
    const { userData } = context;

    if (interaction.mention) {
      this.displayUserBerrys(context);
    }

    interaction.params && this.handleParams(context);

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const message = await this.updateMessageInterface(context);
      const react = await message.awaitReact(
        { user: msg.author, removeType: "all" },
        "📥",
        "📤",
      );
      let answer, _questionMessage, maxCount;

      switch (react) {
        case "📥":
          if (userData.berrys >= context.MAX_LIMIT) {
            interaction.channel.msg({
              title: `Вы не можете купить больше. Лимит ${context.MAX_LIMIT}`,
              color: "#ff0000",
              delete: 5000,
            });
            break;
          }

          maxCount = Command.getMaxCountForBuy(
            userData.coins,
            context.marketPrice,
          );

          maxCount = Math.min(maxCount, context.MAX_LIMIT - userData.berrys);
          _questionMessage = await interaction.channel.msg({
            title: `Сколько клубник вы хотите купить?\nПо нашим расчётам, вы можете приобрести до (${maxCount.toFixed(
              2,
            )}) ед. <:berry:756114492055617558>`,
            description:
              "[Посмотреть способ расчёта](https://pastebin.com/t7DerPQm)",
          });
          answer = await msg.channel.awaitMessage({ user: msg.author });
          _questionMessage.delete();

          if (!answer) {
            break;
          }

          this.exchanger(context, answer.content, true);
          break;
        case "📤":
          _questionMessage = await interaction.channel.msg({
            title: "Укажите колич-во клубничек на продажу",
          });
          answer = await msg.channel.awaitMessage({ user: msg.author });
          _questionMessage.delete();

          if (!answer) {
            break;
          }

          this.exchanger(context, answer.content, false);
          break;
        default:
          return message.delete();
      }
    }
  }

  options = {
    name: "berry",
    id: 27,
    media: {
      description:
        "Клубника — яркий аналог золотых слитков, цена которых зависит от спроса.\nЧерез эту команду осуществляется её покупка и продажа, тут-же можно увидеть курс.",
      example: `!berry <"продать" | "купить"> <count>`,
    },
    accessibility: {
      publicized_on_level: 3,
    },
    alias: "клубника клубнички ягода ягоды berrys берри полуниця полуниці",
    allowDM: true,
    cooldown: 15_000,
    cooldownTry: 3,
    type: "user",
  };
}

export default Command;
