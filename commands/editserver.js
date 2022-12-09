

class Command {

	async onChatInput(msg, interaction){
    let guild = msg.guild
    let server = guild.data;
    let settingsAll = [
      ["description", "🪧 Настроить описание сервера", "Описание сервера удачно настроено"],
      ["banner", "🌌 Установите баннер", "На сервере есть свой баннер!"],
      ["chatFilter", "🚸 Фильтр чата выключен", "Фильтр чата включён :)"],
      ["hi", "👋 Не настроено приветсвие новых участников ", "«Привет тебе, новый участник»"],
      //["globalXp", "📯 Опыт участников только с этого сервера", "Вы видите настоящий опыт всех участников!"]
    ]

    let channels = [server.chatChannel, server.logChannel, server.hiChannel].map(e => e ? (guild.channels.cache.get(e) || "не найден") : "не установлен").map((e, i) => ["Чат: ", "Для логов: ", "Для приветсвий: "][i] + e);
    let settings = settingsAll.map(e => (server[e[0]]) ? "<a:yes:763371572073201714> " + e[2] : e[1]);

    let randomEmoji = ["🔧", "🔨", "💣", "🛠️", "🔏"].random(),
     message = await msg.msg({title: "Идёт Настройка сервера... " + randomEmoji, description: settings.join("\n"), footer: {text: "🔂 - отобразить все действия"}, fields: [{name: "🏝️ Назначенные каналы", value: channels}]}),
     react = await message.awaitReact({user: msg.author, type: "all"}, ...settings.map(e => e.split(" ")[0]).filter(e => e != "<a:yes:763371572073201714>"), "🏝️", "🔂"),
     answer, bot_msg;

    while (true) {
      let reactions;
      switch (react) {
        case "🪧":
          bot_msg = await msg.msg({title: "Введите описание вашего чудесного сервера", description: "Не забывайте использовать шаблоны **{ }** 💚"});
          answer = await bot_msg.channel.awaitMessage(msg.author);

          bot_msg.delete();
          if (answer.content){
            server.description = answer.content;
            msg.msg({title: "Описание установлено! Юху!", delete: 3000});
          }
          else msg.msg({title: "Время вышло ⏰", color: "#ff0000", delete: 3000});
          break;

        case "🌌":
          bot_msg = await msg.msg({title: "Укажите ссылку на изображение", description: "Апчхи"});
          answer = await bot_msg.channel.awaitMessage(msg.author);

          answer = answer.content || null;
          bot_msg.delete();
          if (answer && answer.startsWith("http")){
            server.banner = answer;
            msg.msg({title: "Баннер установлен!", delete: 3000});
          }
          else msg.msg({title: "Вы должны были указать ссылку на изображение", color: "#ff0000", delete: 3000});
          break;

        case "🚸":
          bot_msg = await msg.msg({title: "Включить фильтр чата?", description: "Подразумивается удаление сообщений которые содержат: рекламу, нецензурную лексику, капс и т.д.\nСейчас эта функция является \"сырой\" и будет продолжать развиваться со временем"});
          answer = await bot_msg.awaitReact({user: msg.author, type: "all"}, "685057435161198594", "763804850508136478");
          bot_msg.delete();

          if (answer == "685057435161198594"){
            server.chatFilter = 1;
            msg.msg({title: "Фильтр включён", delete: 3000});
          }
          else if (answer == "763804850508136478"){
            server.chatFilter = 0;
            msg.msg({title: "Фильтр выключен", delete: 3000});
          }
          break;

        case "👋":
          await commands["sethello"].code(msg, interaction);
          channels = [server.chatChannel, server.logChannel, server.hiChannel].map(e => (e) ? (guild.channels.cache.get(e).toString() || "не найден") : "не установлен").map((e, i) => [ "Чат: ", "Для логов: ", "Для приветсвий: "][i] + e);
          break;

        case "📯":
          bot_msg = await msg.msg({title: "Отображать только опыт заработанный в этой гильдии?", description: "По стандарту бот показывает весь опыт пользователя, допустим если пользователь заработал 15 уровень на другом сервере, то и на этом сервере у него будет тоже 15\nВы можете изменить это нажав <:mark:685057435161198594>. В этом случае уровень пользователей будет сброшен до 1-го и будучи активными на других серверах, они не будут получать опыт на этом сервере"});
          answer = await bot_msg.awaitReact({user: msg.author, type: "all"}, "685057435161198594", "763804850508136478");
          if (answer == "685057435161198594"){
            server.globalXp = 0;
            msg.msg({title: "Готово.", delete: 3000});
          }
          else if (answer == "763804850508136478"){
            server.globalXp = 1;
            msg.msg({title: "Ограничение снято!", delete: 3000});
          }
          break;

        case "🏝️":
          bot_msg = await msg.msg({fields: [{name: "Каналы", value: [server.chatChannel, server.logChannel, server.hiChannel].map(e => (e) ? (guild.channels.cache.get(e).toString() || "не найден") : "не установлен").map((e, i) => [ "🔥 Чат: ", "📒 Для логов: ", "👌 Для приветсвий: "][i] + e)}]});
          let channel = await bot_msg.awaitReact({user: msg.author, type: "all"}, "🔥", "📒", "👌");
          bot_msg = await bot_msg.msg({title: "Упомяните канал или введите его айди", edit: true});
          answer = await bot_msg.channel.awaitMessage(msg.author);
          bot_msg.delete();
          answer = answer.mentions.channels.first() || guild.channels.cache.get(bot_msg.content);

          if (answer){
            server[(channel == "🔥") ? "chatChannel" : (channel == "📒") ? "logChannel" : "hiChannel"] = answer.id;
            channels = [server.chatChannel, server.logChannel, server.hiChannel].map(e => (e) ? (guild.channels.cache.get(e).toString() || "не найден") : "не установлен").map((e, i) => [ "Чат: ", "Для логов: ", "Для приветсвий: "][i] + e);
            msg.msg({title: `Канал ${answer.name} успешно установлен! ${channel}`, delete: 3000})
          }
          else msg.msg({title: "Не удалось найти канал", color: "#ff0000"});
          break;

        case "🔂":
          reactions = [...settingsAll.map(e => e[1].split(" ")[0]), "🏝️"];
          break;

        default:
          message.reactions.removeAll();
          message.delete();
          return;
      }
      settings = settingsAll.map(e => (server[e[0]]) ? "<a:yes:763371572073201714> " + e[2] : e[1]);
      message = await message.msg({title: "Идёт Настройка сервера... " + randomEmoji, description: settings.join("\n"), footer: {text: "🔂 - отобразить все действия"}, edit: true, fields: [{name: "🏝️ Назначенные каналы", value: channels}]});
      reactions = reactions || [...settings.map(e => e.split(" ")[0]).filter(e => e != "<a:yes:763371572073201714>"), "🏝️", "🔂"];
      react = await message.awaitReact({user: msg.author, type: "all"}, ...reactions);
    }

  }


	options = {
	  "name": "editserver",
	  "id": 29,
	  "media": {
	    "description": "\n\nНастройки сервера (бот) — Фильтр чата, канал логов, основной чат, описание и баннер для команды `!сервер` — способы управления сервером.\n\n:pencil2:\n```python\n!editserver #без аргументов\n```\n\n"
	  },
	  "allias": "настроитьсервер серватиус servatius",
		"allowDM": true,
		"type": "guild",
		"Permissions": 32
	};
};

export default Command;