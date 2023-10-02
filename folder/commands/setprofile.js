import * as Util from '#lib/util.js';
import { Actions } from '#lib/modules/ActionManager.js';

class Command {

	async onChatInput(msg, interaction){
    let
      user  = interaction.userData,
      args  = interaction.params.split(" "),
      value = args.splice(1).join(" "),
      item  = args[0].toLowerCase();

      if (!["description", "осебе", "описание", "color", "цвет", "birthday", "др", "confidentiality", "конфиденциальность"].includes(item)) {
        let problemsMessage = await msg.msg({title: "<a:who:638649997415677973> Вы не указали то, что вы хотите изменить\nПовторите попытку", delete: 10000, description: "Поддерживаемые значения:\n`• осебе/description`\n`• цвет/color`\n`• др/birthday`\n`• конфиденциальность/confidentiality`"});

        //** Реакция-помощник
        let react = await problemsMessage.awaitReact({user: msg.author, removeType: "all"}, "❓");
        if (!react){
          return;
        }

        let helper = await commands.commandinfo.code(msg, {args: "setprofile"});
        await Util.sleep(20000);
        helper.delete();
        /**/

        return;
      }

      if (!value) {
        msg.msg({title: "Вы не ввели значение", delete: 3000});
        return;
      }

      switch (item) {
        case "description":
        case "описание":
        case "осебе":
          let minus = (value.match(/<a?:.+?:\d+?>|\\?!\{.+?\}/g) || []).join("").length;
          if (value.length - minus > 121) return msg.msg({title: "Длина описания не должна превышать 120 символов", delete: 5000, color: "#ff0000", description: `Ваша длина: ${value.length - minus}\nТекст:\n${value}`});
          let line = "";
          let lineMinus = 0;
          minus = 0;

          let words = value.split(" ");
          value = "";
          for (let i = 0; i < words.length; i++){
            let e = words[i];

            lineMinus += (e.match(/<a?:.+?:\d+?>|\\?!\{.+?\}/g) || []).join("").length;
            let indent;
            if (indent = e.match(/\n/)) {
              words.splice(i + 1, 0, e.slice(indent.index + 1));
              value += `${line} ${e.slice(0, indent.index)}\n`;
              line = "";
              lineMinus = 0;
              continue;
            }

            if (line.length - lineMinus + e.length < 30) {
              line += " " + e;
            }
            else {
              value += line + "\n" + e;
              line = "";
              lineMinus = 0;
            }
          }
          value += line;

          user.profile_description = value;
          msg.msg({title: `Описание установлено!`, delete: 5000})
        break;

        case "color":
        case "цвет":
          if (value == "0"){
             delete user.profile_color;
             msg.msg({title: "Готово! Пользовательский цвет удалён", delete: 5000})
          }

          let color = value.match(/[abcdef0-9]{6}|[abcdef0-9]{3}/i);
          if (!color) {
            return msg.msg({title: "Неверный формат, введите цвет в формате HEX `#38f913`", color: "#ff0000", delete: 5000});
          }
          color = color[0].toLowerCase();
          color = color.length === 3 ? [...color].map(e => e + e).join("") : color;

          user.profile_color = color;
          msg.msg({title: `Готово! Пользовательский цвет установлен #${color.toUpperCase()}\nЕсли вы захотите его удалить - установите цвет в значение 0`, color: color, delete: 5000});
        break;

        case "birthday":
        case "др":
          if (user.BDay){
            let price = [1200, 3000, 12000][user.chestLevel];
            let message = await msg.msg({title: `Вы уже устанавливали дату своего дня рождения, повторная смена будет стоить вам ${price} коинов\nПродолжить?`});
            let react = await message.awaitReact({user: msg.author, removeType: "all"}, "685057435161198594", "763807890573885456");

            if (react != "685057435161198594"){
              return msg.msg({title: "Действие отменено", color: "#ff0000", delete: 4000});
            }
            if (user.coins < price){
              return msg.msg({title: "Недостаточно коинов", color: "#ff0000", delete: 4000});
            }
            user.coins -= price;
          }

          let day = value.match(/\d\d\.\d\d/);
          if (!day){
            return msg.msg({title: "Укажите в формате \"19.11\" - день, месяц", color: "#ff0000", delete: 5000});
          }

          day = day[0];

          const [date, month] = day.split(".").map(Number);
          if (date > 31 || date < 1 || month < 1 || month > 12){
            return msg.msg({title: "Укажите в формате \"19.11\" - день, месяц", color: "#ff0000", delete: 5000});
          }
          user.BDay = day;
          msg.author.action(Actions.globalQuest, {name: "setBirthday"});
          msg.msg({title: "Установлено! 🎉", delete: 3000});
        break;

        case "confidentiality":
        case "конфиденциальность":
          let message = await msg.msg({title: `Реж. конфиденциальности ${user.profile_confidentiality ? "включен, отлючить?" : "выключен, включить?"}`});
          let react = await message.awaitReact({user: msg.author, removeType: "all"}, "685057435161198594", "763807890573885456");
          if (react != "685057435161198594") {
            return msg.msg({title: "Действие отменено", color: "#ff0000", delete: 4000});
          }
          user.profile_confidentiality = user.profile_confidentiality ? false : true;
        break;
      }
  }


	options = {
	  "name": "setprofile",
	  "id": 20,
	  "media": {
	    "description": "\n\nНастройки вашего профиля: Цвет, описание, день рождения и режим конфиденциальности\n\n✏️\n```python\n!setProfile {\"осебе\" | \"цвет\" | \"др\" | \"конфиденциальность\"} {value} #для реж. конфиденциальности аргумент value не нужен\n```\n\n"
	  },
	  "allias": "настроитьпрофиль about осебе sp нп",
		"allowDM": true,
		"cooldown": 2_00_00,
		"type": "user"
	};
};

export default Command;