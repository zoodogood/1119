import * as Util from '#src/modules/util.js';

class Command {

	async onChatInput(msg, interaction){

    if (interaction.mention){
      msg.msg({title: "Вы не можете просматривать содержимое сумки у других пользователей", color: "#ff0000", delete: 15_000});
      return;
    }

    const user = interaction.userData;


    class ItemTaker {
      display(...args){
        return this.ending(...args);
      }

      // Default getter
      getter({target}){
        return target[this.key];
      }
      setter({target, count}){
        return target[this.key] = count;
      };

      getLimit(){
        return this.limit || null;
      }
    }

    const ITEMS = [
      {
        key: "coins",
        names: ["коина", "коины", "коин", "коинов", "coins", "coin", "c", "к"],
        ending: (count) => `<:coin:637533074879414272> ${ Util.ending(count, "Коин", "ов", "", "а") }`
      },
      {
        key: "exp",
        names: ["опыта", "опыт", "опытов", "exp", "experience"],
        ending: (count) => `<:crys2:763767958559391795> ${ Util.ending(count, "Опыт", "а", "", "а") }`
      },
      {
        key: "chestBonus",
        names: ["бонусов", "бонус", "бонуса", "сундука", "сундуков", "сундук", "бонусов сундука", "chestbonus"],
        ending: (count) => `<a:chest:805405279326961684> ${ Util.ending(count, "Бонус", "ов", "", "а") } сундука`
      },
      {
        key: "void",
        names: ["нестабильности", "нестабильность", "void", "камень", "камней", "камня"],
        ending: (count) => `<a:void:768047066890895360> ${ Util.ending(count, "Кам", "ней", "ень", "ня") } нестабильности`
      },
      {
        key: "berrys",
        names: ["клубник", "клубники", "клубника", "клубниу", "ягоды", "ягод", "ягода", "berry", "berrys"],
        ending: (count) => `<:berry:756114492055617558> ${ Util.ending(count, "Клубник", "", "а", "и") }`
      },
      {
        key: "chilli",
        names: ["перец", "перцев", "перца", "chilli"],
        ending: (count) => `🌶️ ${ Util.ending(count, "Пер", "цев", "ец", "ца") }`
      },
      {
        key: "monster",
        names: ["монстр", "монстров", "монстра", "monster"],
        ending: (count) => `🐲 ${ Util.ending(count, "Монстр", "ов", "", "а") }`
      },
      {
        key: "thiefGloves",
        names: ["перчатки", "перчатку", "перчатка", "перчаток", "glove", "gloves"],
        ending: () => `🧤 ${ Util.ending(count, "Перчат", "ки", "у", "ки") }`,
        display: (count) => `🧤 Перчатки ${ count }шт.`,
        getter: ({target}) => {
          const isUser = "id" in target;

          if (isUser){
            const thiefGloves = (target.thiefGloves || "0|0")
              .split("|");

            const [gloves, ...rest] = thiefGloves;
            return +gloves;
          }

          if (!isUser){
            return target.thiefGloves;
          }
        },
        setter: ({target, count}) => {
          const isUser = "id" in target;

          if (isUser){
            const thiefGloves = (target.thiefGloves || "0|0")
              .split("|");

            thiefGloves[0] = count;
            return target.thiefGloves = thiefGloves.join("|");
          }

          if (!isUser){
            return target.thiefGloves = count;
          }
        }
      },
      {
        key: "keys",
        names: ["ключ", "ключей", "ключа", "ключи", "key"],
        ending: (count) => `🔩 ${ Util.ending(count, "Ключ", "ей", "", "а") }`
      },
      {
        key: "seed",
        names: ["семечко", "семечек", "семян", "семечка", "семячек", "seed"],
        ending: (count) => `🌱 ${ Util.ending(count, "Сем", "ян", "ечко", "ечка", {unite: (_quantity, word) => word}) }`
      },
      {
        key: "iq",
        names: ["iq", "icq", "iqbanana", "айкью"],
        ending: (count) => `<a:iq:768047041053196319> ${ count } IQ`
      },
      {
        key: "coinsPerMessage",
        names: ["коинов за сообщение", "награда коин-сообщений", "coinsPerMessage"],
        ending: (count) => `✨ ${ Util.ending(count, "Коин", "ов", "", "а") } за сообщение`
      },
      {
        key: "voidCooldown",
        names: ["уменьшений кулдауна", "уменьшение кулдауна", "уменьшения кулдауна", "voidcooldown"],
        limit: 20,
        ending: (count) => `🌀 ${ Util.ending(count, "Бонус", "ов", "", "а") }`,
        display: (count) => `🌀 Бонус "Уменьшение кулдауна" ${ count }/20`
      },
      {
        key: "voidPrise",
        names: ["скидок на котёл", "скидок на котел", "voidprise"],
        limit: 5,
        ending: (count) => `⚜️ ${ Util.ending(count, "Бонус", "ов", "", "а") }`,
        display: (count) => `⚜️ Бонус "Скидок на котёл" ${ count }/5`
      },
      {
        key: "voidDouble",
        names: ["нестабилити", "voiddouble"],
        limit: 1,
        ending: (count) => `🃏 ${ Util.ending(count, "Бонус", "ов", "", "а") }`,
        display: (count) => `🃏 Бонус "Нестабилити" ${ count }/1`
      },
      {
        key: "voidQuests",
        names: ["усиление квестов", "усиление квеста", "voidquests"],
        limit: 5,
        ending: (count) => `🔱 ${ Util.ending(count, "Бонус", "ов", "", "а") }`,
        display: (count) => `🔱 Бонус "Усиление квестов" ${ count }/5`
      },
      {
        key: "voidCoins",
        names: ["шанс коина", "шанс коинов", "voidcoins"],
        limit: 7,
        ending: (count) => `♦️ ${ Util.ending(count, "Бонус", "ов", "", "а") }`,
        display: (count) => `♦️ Бонус "Шанс коина" ${ count }/7`
      },
      {
        key: "voidMonster",
        names: ["монстр-защитник", "монстр защитник", "voidmonster"],
        limit: 1,
        ending: (count) => `💖 ${ Util.ending(count, "Бонус", "ов", "", "а") }`,
        display: (count) => `💖 Бонус "Монстр-защитник" ${ count }/1`
      },
      {
        key: "voidThief",
        names: ["бонусы от перчаток", "voidthief"],
        ending: (count) => `💠 ${ Util.ending(count, "Бонус", "ов", "", "а") }`,
        display: (count) => `💠 Бонус "Бонусы от перчаток" ${ count }`
      },
      {
        key: "voidMysticClover",
        names: ["умение заворож. клевер", "умение заворожить клевер", "заворожение клевера", "заворожить клевер", "заворожения клевера", "voidmysticclover"],
        ending: (count) => `🍵 ${ Util.ending(count, "Бонус", "ов", "", "а") }`,
        display: (count) => `🍵 Бонус "Умение заворож. Клевер" ${ count }/50`
      },
      {
        key: "voidTreeFarm",
        names: ["фермер", "фермеров", "фермера", "voidtreefarm"],
        ending: (count) => `📕 ${ Util.ending(count, "Бонус", "ов", "", "а") }`,
        display: (count) => `📕 Бонус "Фермер" ${ count }`
      },
      {
        key: "voidCasino",
        names: ["казино", "voidcasino"],
        limit: 1,
        ending: (count) => `🥂 ${ Util.ending(count, "Бонус", "ов", "", "а") }`,
        display: (count) => `🥂 Бонус "Казино" ${ count }/1`
      }
    ];

    ITEMS.forEach(item => item.__proto__ = ItemTaker.prototype);




    const displayBag = () => {

      const items = Object.entries( user.bag || {} )
        .map(([key, count]) => ({
          itemData: ITEMS.find(item => item.key === key),
          count
        }))
        .filter(({itemData}) => itemData !== undefined)
        .map(({itemData, count}) => itemData.display(count))
        .map(str => `– ${ str }`);


      const description = items.length ?
        items.join("\n") :
        "Она пустая!! Гады, положите туда что-нибудь..\n!bag put 1 coin";

      const embed = {
        title: "Сэр, Ваша сумка?",
        description,
        footer: {
          text: `Ты, Сэр ${ msg.author.tag }`,
          iconURL: msg.author.avatarURL()
        }
      }
      msg.msg(embed);
      return;
    };




    const moveItem = (key, count, isToBag) => {

      const item = ITEMS.find(item => item.key === key);
      const targetFrom = isToBag ?   user   : user.bag;
      const targetTo   = isToBag ? user.bag : user;

      if (count === "+"){

        const value = item.getter({ target: targetFrom });
        count = value || 0;
      }
      count = Math.max(Math.floor( count ), 0);


      if (user[key] === undefined)
        item.setter({ count: 0, target: user });

      if (user.bag[key] === undefined)
        item.setter({ count: 0, target: user.bag });

      const currentCount = item.getter({ target: targetFrom });
      if (currentCount < count){
        const description = `Надо на ${ item.ending(count - currentCount) } больше!`;
        msg.msg({title: "Недостаточно ресурса", delete: 7000, description});
        return;
      }

      if (item.getLimit() && !isToBag){
        const current = item.getter({ target: targetTo });
        const limit = item.getLimit();
        count = Math.min(count, limit - current);
      }


      item.setter({
        target: targetFrom,
        count: item.getter({ target: targetFrom }) - count
      })
      item.setter({
        target: targetTo,
        count: item.getter({ target: targetTo   }) + count
      })

      const bagDescription = isToBag ? "в а-ля вакуумный объект" : "из черной дыры";
      const description = `Вы успешно ${ isToBag ? "положили" : "взяли" } ${ item.ending(count) } ${ bagDescription }.`;
      msg.msg({title: `Действие с сумка ${ msg.author.tag }`, delete: 9000, description});
    }


    let action = interaction.params.match(/взять|take|положить|put/);
    action = action && action[0];

    let count = interaction.params.match(/\d+|\+/);
    count = count && count[0];
    let item;

    if (action && count){
      interaction.params = interaction.params.replace(action, "");
      interaction.params = interaction.params.replace(count, "");
      const itemName = interaction.params = interaction.params.trim().toLowerCase();

      item = ITEMS.find(item => item.names.includes(itemName));
      if (!item){
        const list = ITEMS.reduce((acc, item) => acc.concat(item.names), []);
        const similarItem = Util.getSimilar(list, itemName);
        msg.msg({title: "Не удалось найти такой предмет:", description: `\`${ itemName }\`${ similarItem ? `\n\nВозможно, Вы имели ввиду: ${ similarItem }?` : "" }`, delete: 7000});
      }
    }



    // Run;

    if (item){
      const isToBag = action === "положить" || action === "put";

      if (!user.bag)
        user.bag = {};

      moveItem(item.key, count, isToBag);
      return;
    }

    displayBag();
    return;
  }


	options = {
	  "name": "bag",
	  "id": 58,
	  "media": {
	    "description": "\n\nНикто кроме владельца не может просматривать содержимое сумки. В неё можно положить любой предмет будь то нестабильность, клубника и даже бонусы\nСумка это альтернатива использования казны как личного хранилища. При этом она всегда под рукой!\n\n:pencil2:\n```python\n!bag <\"take\" | \"put\"> <item> <count | \"+\"> # аргументы могут быть указаны в любом порядке\n```\n\n"
	  },
	  "allias": "сумка рюкзак",
		"allowDM": true,
		"type": "user"
	};
};

export default Command;