import * as Util from '#src/modules/util.js';
import DataManager from '#src/modules/DataManager.js';
import FileSystem from 'fs';
import Discord from 'discord.js';

class Command {

	async onChatInput(msg, interaction){
    let __inServer = msg.channel.id === "753687864302108913";
    interaction.params = interaction.params.toLowerCase().replace(/[^a-zа-яёьъ]/g, "").trim();
    let cmd = commands[interaction.params];

    let typesList = {
      dev: "Команда в разработке или доступна только разработчику",
      delete: "Команда была удалена",
      guild: "Управление сервером",
      user: "Пользователи",
      bot: "Бот",
      other: "Другое"
    };

    if (!cmd){
      let helpMessage = await msg.msg({title: "Не удалось найти команду", description: `Не существует вызова \`!${interaction.params}\`\nВоспользуйтесь командой !хелп или нажмите реакцию ниже для получения списка команд.\nВы можете предложить новое слово для вызова одной из существующих команд.`});
      //** Реакция-помощник
      let react = await helpMessage.awaitReact({user: msg.author, type: "all"}, "❓");
      if (!react){
        return;
      }

      await commands.help.code(msg);
      /**/
      return;
    }

    let originalName = Object.keys(commands)[cmd.id - 1];
    let allNamesList = Object.entries(commands).filter(([k, v]) => v.id === cmd.id).map(([k, v]) => k).filter(e => e !== originalName);
    let guideDescription;


    guideDescription = FileSystem.readFileSync("resources/descriptions-commands.txt", "utf-8").split("---")[cmd.id - 1] || "Описание для этой команды пока отсуствует...";
    let gifURL = Util.match(guideDescription, /(?<=\n)http\S+/);
    if (gifURL){
      guideDescription = guideDescription.replace(gifURL, "").trim();
    }

    let used = DataManager.data.bot.commandsUsed[cmd.id] || 0;
    let percentUsed = +(used / Object.values(DataManager.data.bot.commandsUsed).reduce((acc, e) => acc + e, 0) * 100).toFixed(1) + "%";




    let embed = {
      title: `— ${originalName.toUpperCase()}`,
      description: guideDescription.trim() + (__inServer ? `\nДругие названия:\n${allNamesList.map(e => `!${e}`).join(" ")}` : ""),
      color: __inServer ? null : "1f2022",
      image: gifURL || (__inServer ? null : "https://media.discordapp.net/attachments/629546680840093696/963343808886607922/disboard.jpg"),
      fields: __inServer ? null : [{name: "Другие способы вызова:", value: Discord.escapeMarkdown( allNamesList.map(e => `!${e}`).join(" ") )}, {name: "Категория:", value: typesList[cmd.type]}, {name: "Необходимые права", value: cmd.Permissions ? new Discord.Permissions(cmd.Permissions).toArray().map(e => Command.permissions[e]) : "Нет"}, {name: "Количество использований", value: `${used} (${percentUsed})`}],
      footer: __inServer ? null : {text: `Уникальный идентификатор команды: ${ cmd.id }`}
    }
    let message = await msg.msg(embed);
    return message;
  }


	options = {
	  "name": "commandinfo",
	  "id": 53,
	  "media": {
	    "description": "\n\nПоказывает информацию об указанной команде, собственно, на её основе вы и видите это сообщение\n\n\n:pencil2:\n```python\n!commandInfo {command}\n```\n\n"
	  },
	  "allias": "command команда"
	};
};

export default Command;