import DataManager from '#lib/modules/DataManager.js';
import { Actions } from '#lib/modules/ActionManager.js';

class Command {
  static INFLATION = 0.2;
  static BERRYS_LIMIT = 35000;
  static TAX = 0.02;

	async onChatInput(msg, interaction){
    const MAX_LIMIT = this.constructor.BERRYS_LIMIT;
    const INFLATION = this.constructor.INFLATION;
    const TAX = this.constructor.TAX;

    let
      user        = interaction.userData,
      myBerrys    = user.berrys || (user.berrys = 0),
      marketPrise = DataManager.data.bot.berrysPrise,

      action      = interaction.params && interaction.params.split(" ")[0],
      quantity    = interaction.params && interaction.params.split(" ")[1];



    const getPrice = (quantity, isBuying = -1) => {
      quantity = isBuying === -1 ?
        Math.min(marketPrise / INFLATION, quantity)
        : quantity;

      // Налог
      const tax = isBuying !== -1 ? 1 : (1 - TAX);
      // Инфляция
      const inflation = (quantity * INFLATION / 2) * isBuying;


      const price = Math.round( (marketPrise + inflation) * quantity * tax );
      return price;
    };

    if (interaction.mention) {
      myBerrys = interaction.mention.data.berrys || 0;
      msg.msg({title: "Клубника пользователя", 
        description: `Клубничек — **${ myBerrys }** <:berry:756114492055617558>\nРыночная цена — **${ Math.round(marketPrise) }** <:coin:637533074879414272>`,
        author: {name: interaction.mention.tag, iconURL: interaction.mention.avatarURL()},
        footer: {text: `Общая цена ягодок: ${ getPrice(myBerrys, -1) }`}
      });
      return;
    }

    const store = (quantity, isBuying) => {
      // buying == -1 || 1
      myBerrys = user.berrys;

      if (quantity === "+")
        quantity = myBerrys;

      quantity = Math.floor(quantity);

      if ( isNaN(quantity) ){
        msg.msg({title: "Указана строка вместо числа", color: "#ff0000", delete: 5000});
        return;
      }

      if (quantity < 0){
        msg.msg({title: "Введено отрицательное значение.\n<:grempen:753287402101014649> — Укушу.", color: "#ff0000", delete: 5000});
        return;
      }

      if (isBuying < 0 && quantity > myBerrys){
        msg.msg({title: `Вы не можете продать ${ quantity } <:berry:756114492055617558>, у вас всего ${myBerrys}`, color: "#ff0000", delete: 5000});
        return;
      }

      if (isBuying > 0 && myBerrys + quantity > MAX_LIMIT){
        quantity = Math.max(MAX_LIMIT - myBerrys, 0);
      }

      let prise = getPrice(quantity, isBuying);


      if (isBuying > 0 && user.coins < prise) {
        msg.msg({title: `Не хватает ${prise - user.coins} <:coin:637533074879414272>`, delete: 5000});
        return;
      }

      user.coins -= prise * isBuying;
      user.berrys = myBerrys += quantity * isBuying;
      marketPrise = DataManager.data.bot.berrysPrise = Math.max(DataManager.data.bot.berrysPrise + quantity * INFLATION * isBuying, 0);

      msg.msg({title: (isBuying > 0) ? `Вы купили ${quantity} <:berry:756114492055617558>! потратив ${ prise } <:coin:637533074879414272>!` : `Вы продали ${quantity} <:berry:756114492055617558> и заработали ${prise} <:coin:637533074879414272>!`, delete: 5000});
      msg.author.action(Actions.berryBarter, {quantity, msg, interaction, isBuying, prise});
    }

    if (quantity === "+")
      quantity = user.berrys;

    if (action == "buy"  || action == "купить")  store(quantity, 1);
    if (action == "sell" || action == "продать") store(quantity, -1);

    let message = await msg.msg({description: `У вас клубничек — **${ myBerrys }** <:berry:756114492055617558>\nРыночная цена — **${ Math.round(marketPrise) }** <:coin:637533074879414272>\n\nОбщая цена ваших ягодок: ${ getPrice(myBerrys, -1) } (с учётом налога ${ TAX * 100 }% и инфляции)\n\n📥 - Покупка | 📤 - Продажа;`, author: {name: msg.author.tag, iconURL: msg.author.avatarURL()}})
    let react = await message.awaitReact({user: msg.author, removeType: "all"}, "📥", "📤");
    let answer, _questionMessage;

    while (true) {
      switch (react) {
        case "📥":
          if (myBerrys >= MAX_LIMIT){
            msg.msg({title: `Вы не можете купить больше. Лимит ${ MAX_LIMIT }`, color: "#ff0000", delete: 5000});
            break;
          }

          const getMaxCount = (coins, price) => {

            const a = INFLATION / 2;
            const b = price;
            const c = -coins;

            const discriminant = b ** 2 - 4 * a * c;
            const x2 = (discriminant ** 0.5 - b) / (2 * a);

            return x2;
          }

          let maxCount = getMaxCount(interaction.userData.coins, marketPrise);

          maxCount = Math.min(maxCount, MAX_LIMIT - myBerrys);
          _questionMessage = await msg.msg({title: `Сколько клубник вы хотите купить?\nПо нашим расчётам, вы можете приобрести до (${maxCount.toFixed(2)}) ед. <:berry:756114492055617558>`, description: "[Посмотреть способ расчёта](https://pastebin.com/t7DerPQm)"})
          answer = await msg.channel.awaitMessage({user: msg.author});
          _questionMessage.delete();

          if (!answer)
            break;

          if (answer.content === "+")
            answer.content = maxCount;

          store(answer.content, 1);
          break;
        case "📤":
          _questionMessage = await msg.msg({title: "Укажите колич-во клубничек на продажу"});
          answer = await msg.channel.awaitMessage({user: msg.author});
          _questionMessage.delete();

          if (!answer)
            break;

          store(answer.content, -1);
          break;
        default: return message.delete();
      }
      message = await message.msg({edit: true, description: `У вас клубничек — **${myBerrys}** <:berry:756114492055617558>\nРыночная цена — **${ Math.round(marketPrise) }** <:coin:637533074879414272>\n\nОбщая цена ваших ягодок: ${getPrice(myBerrys)} (с учётом налога ${ TAX * 100 }% и инфляции)\n\n📥 - Покупка | 📤 - Продажа;`, author: {name: msg.author.tag, iconURL: msg.author.avatarURL()}});
      react = await message.awaitReact({user: msg.author, removeType: "all"}, "📥", "📤");
    }
  }


	options = {
	  "name": "berry",
	  "id": 27,
	  "media": {
	    "description": "\n\nКлубника — яркий аналог золотых слитков, цена которых зависит от спроса.\nЧерез эту команду осуществляется её покупка и продажа, тут-же можно увидеть курс.\n\n✏️\n```python\n!berry <\"продать\" | \"купить\"> <count>\n```\n\n"
	  },
	  "allias": "клубника клубнички ягода ягоды berrys берри",
		"allowDM": true,
		"cooldown": 15_000,
		"type": "user"
	};
};

export default Command;