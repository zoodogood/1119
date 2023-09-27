import DataManager from '#lib/modules/DataManager.js';

class Command {

	async onChatInput(msg, interaction){
    DataManager.file.write();
    const message = await msg.channel.send({
      files: [{
        attachment: "data/main.json",
        name: new Intl.DateTimeFormat("ru-ru", {year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric"}).format()
      }]
    });

    setTimeout(() => message.delete(), 1_000_000);
  }


	options = {
	  	"name": "dump",
	  	"id": 60,
	  	"media": {
	   	"description": ""
	  	},
	  	"allias": "дамп",
		"allowDM": true,
		"cooldown": 1_00_000,
		"type": "dev"
	};
};

export default Command;