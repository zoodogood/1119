import * as Util from '#src/modules/util.js';
import DataManager from '#src/modules/DataManager.js';
import FileSystem from 'fs';
import Discord from 'discord.js';
import CommandsManager from '#src/modules/CommandsManager.js';

class Command {

	async onChatInput(msg, interaction){
    let __inServer = msg.channel.id === "753687864302108913";
    const params = interaction.params.toLowerCase().replace(/[^a-zа-яёьъ]/g, "").trim();
    const command = CommandsManager.callMap.get(params);

    const typesEnum = {
      dev: "Команда в разработке или доступна только разработчику",
      delete: "Команда была удалена",
      guild: "Управление сервером",
      user: "Пользователи",
      bot: "Бот",
      other: "Другое"
    };

    if (!command){
      let helpMessage = await msg.msg({title: "Не удалось найти команду", description: `Не существует вызова \`!${interaction.params}\`\nВоспользуйтесь командой !хелп или нажмите реакцию ниже для получения списка команд.\nВы можете предложить новое слово для вызова одной из существующих команд.`});
      //** Реакция-помощник
      let react = await helpMessage.awaitReact({user: msg.author, type: "all"}, "❓");
      if (!react){
        return;
      }

      await CommandsManager.callMap.get("help").onChatInput(msg);
      /**/
      return;
    }


    const originalName = command.options.name;
    const namesList = command.options.allias.split(" ");
    const guideDescription = command.options.media?.description || "Описание для этой команды пока отсуствует...";
    const poster = command.options.media?.poster;

    const usedCount = DataManager.data.bot.commandsUsed[command.options.id] ?? 0;
    const usedPercent = +(usedCount / Object.values(DataManager.data.bot.commandsUsed).reduce((acc, count) => acc + count) * 100).toFixed(1) + "%";




    const embed = {
      title: `— ${ originalName.toUpperCase() }`,
      description: guideDescription.trim() + (__inServer ? `\nДругие названия:\n${allNamesList.map(e => `!${e}`).join(" ")}` : ""),
      color: __inServer ? null : "#1f2022",
      image: poster || (__inServer ? null : "https://media.discordapp.net/attachments/629546680840093696/963343808886607922/disboard.jpg"),
      fields: __inServer ? null : [
        {name: "Другие способы вызова:", value: Discord.escapeMarkdown( namesList.map(name => `!${ name }`).join(" ") )},
        {name: "Категория:", value: String(typesEnum[command.options.type])}, {name: "Необходимые права", value: "to-do"},
        {name: "Количество использований", value: `${ usedCount } (${ usedPercent })`}
      ],
      footer: __inServer ? null : {text: `Уникальный идентификатор команды: ${ command.options.id }`}
    }
    const message = await msg.msg(embed);
    return message;
  }


	options = {
	  "name": "commandinfo",
	  "id": 53,
	  "media": {
	    "description": "\n\nПоказывает информацию об указанной команде, собственно, на её основе вы и видите это сообщение\n\n\n:pencil2:\n```python\n!commandInfo {command}\n```\n\n"
	  },
	  "allias": "command команда",
		"allowDM": true,
		"expectParams": true,
		"cooldown": 5000000,
		"type": "bot"
	};
};

export default Command;