import * as Util from '#src/modules/util.js';

class Command {

	async onChatInput(msg, interaction){
    const isAdmin = !interaction.mentioner.wastedPermissions(32)[0];
    const manager = new GuildVariablesManager(msg.guild.id);
    const targetName = (message) => target === "guild" ? "Сервера" : `Пользователя ${message.mentions.users.first().toString()}`;

    let target = interaction.params.match(/^(?:<@!?\d{17,19}>|guild|сервер|server)/i);
    if (target) {
      interaction.params = interaction.params.replace(target[0], "").replace(/\s{1,}/g, " ").trim();
      target = target[0].startsWith("<") ? target[0].match(/\d{17,19}/)[0] : "guild";

      if (!interaction.params){
        let fields = manager.variables[target] ?
          Object.entries(manager.variables[target]).map(([name, value]) => ({name, value}))
          :
          [{name: "Тут пусто", value: "Возможно, когда-то здесь что-то появится"}];

        msg.msg({title: "Свойства", 
          color: "#ffc135",
          description: `Все переменные ${targetName(msg)}`,
          footer: {text: `(${manager.variables[target] ? Object.keys(manager.variables[target]).length : 0}/20)`},
          fields,
        });
        return;
      }

      if (!isAdmin){
        msg.msg({title: "Вы должны обладать правами администратора", color: "#ff0000", delete: 4000});
        return;
      }

      let [name, ...value] = interaction.params.replace(/\s{1,}/g, " ").split(" ");
      value = value.join(" ");

      let output = manager[value ? "set" : "get"](target, name, value);
      if (output.err){
        let err;
        switch (output.err) {
          case 1:
            err = "Имя переменной содержит нежелательные символы";
            break;
          case 2:
            err = "Достигнут максимум: 20 свойств на персону";
            break;
          default:
          err = "Неизвестный тип ошибки";
        }
        msg.msg({title: err, color: "#ff0000", delete: 4000});
        return;
      }

      return msg.msg({title: "Переменная " + (value ? "изменена" : "получена"), description: value ? `Переменная \`${output.name}\` ${targetName(msg)} установлена в значение ${output.value}` : `Переменная \`${output.name}\` у ${targetName(msg)} сейчас уставновлена в значении ${output.value}`});
    }

    let youre = manager.variables[msg.author.id] ? Object.keys(manager.variables[msg.author.id]) : [];
    manager.embed = {
      title: "Окно управления переменными сервера",
      description: `Количество переменных сервера: ${Object.values(manager.variables).reduce((acc, last) => acc + Object.keys(last).length, 0)}${youre.length ? "\nУ вас свойств: " + youre.length : ""}\n\n🐵 Установить новую переменную.\n🙊 Получить значение переменной.\n\n🐭 Открыть Список.\n🦅 Найти по названию.\n🐣 Топ пользователей по свойству.\n🐲 Удалить переменную.`,
      color: "#ffc135"
    };
    let baseReactions = ["🐭", "🦅", "🐣"];
    if (isAdmin){
      baseReactions.unshift("🐵", "🙊");
      baseReactions.push("🐲");
    }

    manager.interface = await msg.msg(manager.embed);
    manager.embed.edit = true;
    delete manager.embed.description;

    let
      react, answer, fields = [],
      page = 0, pages = [];

    let output;
    while (true) {
      react = await manager.interface.awaitReact({user: msg.author, type: "one"}, ...baseReactions, (page != 0 ? "640449848050712587" : null), ((pages[1] && page != pages.length - 1) ? "640449832799961088" : null));
      switch (react) {
        case "🐵":
          answer = await msg.channel.awaitMessage(msg.author, {title: "Для установки...", embed: {description: "Упомяните пользователя, укажите имя переменной и её значение, в указанном порядке.\nВместо упоминания можете использовать слово \"сервер\"\nНазвание переменной должно состоять из одного слова."}});
          if (!answer){
            return;
          }

          target = answer.content.match(/^(<@!?(\d{17,19})>|guild|сервер|server)/i);
          if (!target){
            msg.msg({title: "Не указана цель для которой нужно установить значение", color: "#ff0000", delete: 5000});
            break;
          }

          answer.content = answer.content.replace(target[0], "").replace(/\s{1,}/g, " ").trim();
          target = target[0].startsWith("<") ? target[0].match(/\d{17,19}/)[0] : "guild";
          answer.content = answer.content.replace(/\s{1,}/g, " ").split(" ");

          if (!answer.content[1]){
            msg.msg({title: "Должно быть указано имя и значение", color: "#ff0000", delete: 3000});
            break;
          }

          output = manager.set(target, answer.content[0], answer.content.slice(1).join(" "));
          if (output.err){
            let err;
            switch (output.err) {
              case 1:
                err = "Имя переменной содержит нежелательные символы";
                break;
              case 2:
                err = "Достигнут максимум: 20 свойств на персону";
                break;
              default:
                err = "Неизвестный тип ошибки";
            }
            msg.msg({title: err, color: "#ff0000", delete: 4000});
            return;
          }

          msg.msg({title: "Переменная изменена:", description: `Переменная \`${output.name}\` ${targetName(answer)} установлена в значение ${output.value}`});
          fields = [{name: "Вы успешно установили переменную", value: `🐵`}];
          break;

        case "🙊":
          answer = await msg.channel.awaitMessage(msg.author, {title: "Для установки...", embed: {description: "Упомяните пользователя, укажите имя переменной и её значение, в указанном порядке.\nВместо упоминания можете использовать слово \"сервер\"\nНазвание переменной должно состоять из одного слова."}});
          if (!answer){
            return;
          }

          target = answer.content.match(/^(<@!?(\d{17,19})>|guild|сервер|server)/i);
          if (!target){
            msg.msg({title: "Не указана цель, значение свойства которой нужно получить", color: "#ff0000", delete: 5000});
            break;
          }

          answer.content = answer.content.replace(target[0], "").replace(/\s{1,}/g, " ").trim();
          target = target[0].startsWith("<") ? target[0].match(/\d{17,19}/)[0] : "guild";
          answer.content = answer.content.replace(/\s{1,}/g, " ").split(" ");

          if (!answer.content[0]){
            msg.msg({title: "Должно быть указано имя свойства", color: "#ff0000", delete: 3000});
            break;
          }

          output = manager.get(target, answer.content[0]);
          fields = [{name: `Переменная ${targerName(answer)} ${output.name}...`, value: `сейчас установлена в значении \`${output.value}\`🐵`}];
          break;

        case "🐭":
          fields = Object.entries(manager.list()).map(([name, count]) => ({name, value: `Повторяется: ${Util.ending(count, "раз", "", "", "а")}`}));
          break;

        case "🦅":
          answer = await msg.channel.awaitMessage(msg.author, {title: `Введите имя переменной, для её поиска среди пользователей`, description: ""});
          if (!answer){
              return;
          }
          fields = Object.entries(manager.search(answer.content)).map(([id, value], i) => ({name: `${id === "guild" ? "Сервер" : msg.guild.members.cache.get(id).displayName}:`, value: `\`${value}\``}));
          break;

        case "🐣":
          answer = await msg.channel.awaitMessage(msg.author, {title: `Введите имя переменной для отображения по ней ТОП-а пользователей`, description: ""});
          if (!answer){
              return;
          }

          fields = manager.top(answer.content).filter(e => e[0] != "guild").map(([id, value], i) => ({name: `${i + 1}. ${msg.guild.members.cache.get(id).displayName}`, value}));
          break;

        case "🐲":
          answer = await msg.channel.awaitMessage(msg.author, {title: `Введите имя переменной, она будет удалена у всех пользователей`, embed: {description: "Через пробел вы можете указать цель, тогда свойство удалится только у неё"}});
          target = answer.content.match(/(?:<@!?\d{17,19}>|guild|сервер|server)$/i);
          if (target){
            answer.content = answer.content.replace(target[0], "").replace(/\s{1,}/g, " ").trim();
            target = target[0].startsWith("<") ? target[0].match(/\d{17,19}/)[0] : "guild";
          }

          output = manager.remove(answer.content, target);
          fields = [{name: "Удалено", value: `Удалено ${ Util.ending(+output, "свойств", "", "о", "а")} с названием ${answer.content}`}];
          break;


        default: return;
      }
      if (react != "640449848050712587" && react != "640449832799961088"){
        page = 0;
        pages = [];
        while (fields.length) pages.push(fields.splice(0, 10));
      }
      fields = (pages[0]) ? pages[page] : [{name: "Здесь пусто", value: "А здесь и вправду пусто..."}];
      manager.embed.footer = (pages[1]) ? {text: `Страница: ${page + 1} / ${pages.length}`} : null;
      manager.embed.fields = fields;

      manager.interface.msg({title: `${ react } Окно управления переменными сервера`, ...manager.embed});
    }

  }


	options = {
	  "name": "variables",
	  "id": 35,
	  "media": {
	    "description": "\n\nВы можете присваивать пользователям информацию, удобно изменять её и просматривать.\nЭто полезная и универсальная функция для РП серверов, хотя для большенства она может оказаться бесполезной.\n\n:pencil2:\n```python\n!variables <memb | \"сервер\"> <propertyName> <properyValue> # propery переводится как: \"свойство\"\n```\n\n"
	  },
	  "allias": "variable вар var переменная переменные",
		"allowDM": true,
		"type": "guild",
		"Permissions": 256
	};
};

export default Command;