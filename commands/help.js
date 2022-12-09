import Discord from 'discord.js';

class Command {

	async onChatInput(msg, interaction){
    let endingIndex = Object.values(commands).findIndex((e, i) => i != 0 && e.id === 1);
    let guildCommands = [];

    if (msg.guild.data.commands) {
      guildCommands.push({
        name: "Кастомные команды <:cupS:806813704913682442>",
        value: Object.keys(msg.guild.data.commands).map(e => `\`!${e}\``).join(" ")
      });
    }

    let fields = [
      {
        name: "Управление сервером <a:diamond:725600667586134138>",
        value: Object.entries(commands).filter(([k, v], i) => v.type === "guild" && i < endingIndex && !v.hidden).map(([k, v]) => `\`!${k}\``).join(" ")
      },
      {
        name: "Пользователи <:berry:756114492055617558>",
        value: Object.entries(commands).filter(([k, v], i) => v.type === "user" && i < endingIndex && !v.hidden).map(([k, v]) => `\`!${k}\``).join(" ")
      },
      {
        name: "Бот <:piggeorg:758711403027759106>",
        value: Object.entries(commands).filter(([k, v], i) => v.type === "bot" && i < endingIndex && !v.hidden).map(([k, v]) => `\`!${k}\``).join(" ")
      },
      ...guildCommands,
      {
        name: "Другое <:coin:637533074879414272>",
        value: Object.entries(commands).filter(([k, v], i) => v.type === "other" && i < endingIndex && !v.hidden).map(([k, v]) => `\`!${k}\``).join(" ")
      }
    ];

    const embed = {
      title: "Команды, которые не сломают ваш сервер",
      description: `Знаете все-все мои возможности? Вы точно молодец!`,
      fields,
      components: {
        type: 2,
        label: "Discord",
        style: 5,
        url: "https://discord.gg/76hCg2h7r8",
        emoji: {id: "849587567564554281"}
      }
    }

    msg.msg(embed);
  }


	options = {
	  "name": "help",
	  "id": 4,
	  "media": {
	    "description": "\n\nСтандартная команда отображающую основную информацию о возможностях бота. Она нужна чтобы помочь новым пользователям. Её так же можно вызвать отправив `/help`\n\n:pencil2:\n```python\n!help #без аргументов\n```\n\n"
	  },
	  "allias": "хелп помощь cmds commands команды х",
		"allowDM": true,
		"cooldown": 15000000,
		"type": "other"
	};
};

export default Command;