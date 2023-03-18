import * as Util from '#lib/util.js';
import DataManager from '#lib/modules/DataManager.js';
import CurseManager from '#lib/modules/CurseManager.js';
import { Actions } from '#lib/modules/ActionManager.js';

class Chest {
  static callOpen({userData}){

    const nowBirthday = userData.BDay === DataManager.data.bot.dayDate;
    nowBirthday && (userData.chestBonus = 30 + (userData.chestBonus || 0));

    
    const openCount = this.calculateOpenCount({userData});
    delete userData.chestBonus;
    
    return this.#openBy({userData, openCount});
  }

  static applyTreasures({userData, treasures}){
    const apply = (item, quantity) => {
      switch (item) {
        case "void":
          userData.void += quantity;
          break;

        case "keys":
          userData.keys += quantity;
          break;

        case "coins":
          userData.coins += quantity;
          break;

        case "exp":
          userData.exp += quantity;
          break;

        case "berrys":
          userData.berrys += quantity;
          break;

        case "gloves":
          userData.thiefGloves = (userData.thiefGloves || 0) + quantity;
          break;

        case "chilli":
          userData.chilli = (userData.chilli || 0) + quantity;
          break;

        default:
          break;
      }
    }

    Object.entries(treasures)
      .forEach(([item, quantity]) => apply(item, quantity));
  }

  static calculateOpenCount({userData}){
    const bonuses = userData.chestBonus || 0;
    return 2 + Math.ceil(bonuses / 3);
  }

  static #openBy({userData, openCount}){
    const pushTreasure = (item, count) => treasures[item] = treasures[item] ? count + treasures[item] : count;
    const treasuresPull = this.TREASURES_PULL[userData.chestLevel ?? 0];
    const treasures = {};

    let i = openCount;
    while (i > 0){
      i--;
      let {item, quantity} = treasuresPull.random({weights: true});
      switch (item){
        case "bonus":
          i += quantity;
          openCount += quantity;
      }
      pushTreasure(item, openCount);
    }
    

    return {treasures, openCount};
  }

  static TREASURES_PULL = [
    [
      {item: "void", count: 1, _weight: 1},
      {item: "berrys", count: 1, _weight: 4},
      {item: "keys", count: Util.random(2, 3), _weight: 9},
      {item: "trash", count: 0, _weight: 13},
      {item: "exp", count: Util.random(19, 89), _weight: 22},
      {item: "coins", count: Util.random(23, 40), _weight: 46},
      {item: "chilli", count: 1, _weight: 4},
      {item: "gloves", count: 1, _weight: 1}
    ],
    [
      {item: "void", count: 1, _weight: 1},
      {item: "berrys", count: Util.random(1, 2), _weight: 8},
      {item: "keys", count: Util.random(3, 5), _weight: 7},
      {item: "trash", count: 0, _weight: 3},
      {item: "exp", count: Util.random(39, 119), _weight: 22},
      {item: "coins", count: Util.random(88, 148), _weight: 54},
      {item: "chilli", count: 1, _weight: 3},
      {item: "gloves", count: 1, _weight: 2}
    ],
    [
      {item: "void", count: 1, _weight: 1},
      {item: "berrys", count: Util.random(1, 3), _weight: 12},
      {item: "keys", count: 9, _weight: 1},
      {item: "exp", count: Util.random(229), _weight: 22},
      {item: "coins", count: Util.random(304, 479), _weight: 62},
      {item: "gloves", count: 1, _weight: 1},
      {item: "bonus", count: 5, _weight: 1}
    ]
  ];
}

class Command {

	async onChatInput(msg, interaction){

    const cooldown = interaction.userData.CD_32 - Date.now();
    if (cooldown > 0) {
      msg.msg({title: `Сундук заперт, возвращайтесь позже!`, color: "#ffda73", footer: {text: "До открытия: " + Util.timestampToDate(cooldown), iconURL: "https://vignette.wikia.nocookie.net/e2e-expert/images/b/b3/Chest.png/revision/latest?cb=20200108233859"}});
      return;
    }

    const userData = interaction.userData;

    const chest = {
      icon: ["https://cdn.discordapp.com/attachments/629546680840093696/778990528947027988/ezgif.com-gif-maker.gif", "https://cdn.discordapp.com/attachments/629546680840093696/778990564779229234/ezgif.com-gif-maker_1.gif"].random(),
      color: "#ffda73"
    }

    
    const {treasures, openCount} = Chest.callOpen({userData});
    Chest.applyTreasures({userData, treasures});

    let actualOpenCount = openCount;


    

    const handleTreasure = (item, count) => {
      switch (item) {
        case "trash":
          actualOpenCount -= count
          delete treasures.trash;
          break;

        case "void":
          Object.assign(chest, { color: "#3d17a0", icon: "https://media.discordapp.net/attachments/631093957115379733/842122055527694366/image-removebg-preview.png" });
          itemsOutput.push( `${ Util.ending(count, "Уров", "ней", "ень", "ня")} нестабильности <a:void:768047066890895360>` );
          break;

        case "keys":
          itemsOutput.push( `${ Util.ending(count, "Ключ", "ей", "", "а")} 🔩` );

          if (count > 99){
            msg.author.action(Actions.globalQuest, {name: "bigHungredBonus"});
          }
          break;

        case "coins":
          itemsOutput.push( `${ Util.ending(count, "Коин", "ов", "", "а")} <:coin:637533074879414272>` );
          break;

        case "exp":
          let emoji = ["<:crys:637290406958202880>", "<:crys2:763767958559391795>", "<:crys3:763767653571231804>"][Math.min(2, Math.floor(count / 10))];
          itemsOutput.push( `${ Util.ending(count, "Опыт", "а", "", "а")} ${emoji}` );
          break;

        case "berrys":
          itemsOutput.push( `${ Util.ending(count, "Клубник", "", "а", "и")} <:berry:756114492055617558>` );
          break;

        case "cake":
          itemsOutput.push("Один Тортик 🎂");
          break;

        case "bonus":
          itemsOutput.push( `${ Util.ending(count, "Сокровищ", "", "е", "а")} для этого сундука <a:chest:805405279326961684>`);
          break;

        case "gloves":
          

          itemsOutput.push( `${ Util.ending(count, "Перчат", "ок", "ка", "ки")} 🧤`);
          break;

        case "chilli":
          itemsOutput.push( `${ Util.ending(count, "Пер", "цев", "ец", "ца")} 🌶️`);
          break;

        default:
          break;
      }
    }

    const itemsOutput = [];
    Object.entries(treasures)
      .forEach(([item, quantity]) => handleTreasure(item, quantity));


    msg.author.action(Actions.openChest, {msg, interaction, treasures});

    userData.CD_32 = new Date().setHours(23, 59, 0) + 120000;
    msg.author.action(Actions.globalQuest, {name: "firstChest"});

    const embed = {
      title: actualOpenCount > 30 ? "Невероятный сундук" : "Ежедневный сундук",
      description: (itemsOutput.length) ? `БОНУСОВ СУНДУКА — ${ actualOpenCount }:` : "Ежедневный сундук — пуст. Всего-лишь пара бесполезных крабьих ножек и горы песка... <a:penguin:780093060628873296>",
      color: chest.color,
      thumbnail: !itemsOutput.length ? chest.icon : null,
      footer: {text: `Уровень сундука: ${ userData.chestLevel + 1 }`}
    }
    const message = await msg.msg(embed);
    embed.edit = true;

    while (itemsOutput.length){
      await Util.sleep(1500 / (itemsOutput.length / 2));
      embed.description += itemsOutput.splice(0, 1).map(e => `\n${e}`).join("");
      embed.thumbnail = itemsOutput.length ? null : chest.icon;
      await message.msg(embed);
    }

    if (itemsOutput.length === 0 && Util.random(2) === 0){
      const curse = CurseManager.generate({hard: null, user: interaction.user, guild: interaction.guild});
      CurseManager.init({user: interaction.user, curse});
    }
  }


	options = {
	  "name": "chest",
	  "id": 32,
	  "media": {
	    "description": "\n\nЕжедневный-обычный сундук, ничем не примечательный...\nПожалуйста, не пытайтесь в него заглядывать 20 раз в сутки.\n\n❓ Может быть улучшен:\nУлучшение происходит через проведение ритуала в котле при достаточном количестве ресурса, Ключей.\nДля улучшения сундука до второго надо 150 ключей, и 500 до третьего.\n\n:pencil2:\n```python\n!chest #без аргументов\n```\n\n"
	  },
	  "allias": "сундук daily",
		"allowDM": true,
		"type": "other"
	};
};

export default Command;
export { Chest };