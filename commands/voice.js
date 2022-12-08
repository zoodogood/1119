

class Command {

	async onChatInput(msg, interaction){
    return false;
    let connection;
    if (msg.member.voice.channel) connection = await msg.member.voice.channel.join();
    else msg.msg({title: "Быстро зашёл в войс!"});


    const dispatcher = connection.play(ytdl('https://youtu.be/tbr9dXoFKh8', { filter: 'audioonly' }));
    //main/images/one.mp3
  }


	options = {
	  "name": "voice",
	  "id": 21,
	  "media": {
	    "description": "\n\nСтарые тестирования муз. команд.\n\n:pencil2:\n```python\n!voice #без аргументов\n```\n\n"
	  },
	  "allias": "войс"
	};
};

export default Command;