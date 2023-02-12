import { client } from '#bot/client.js';

class Event {

	run(isLost, authorId, channelId, phrase){
		const channel = client.channels.cache.get(channelId);
		const author  = client.users.cache.get(authorId);

		const target = channel || author;

		if (target !== author)
			target.msg({content: author.toString(), mentions: [author.id]});
			
		target.msg({
			title: "Напоминание:",
			description: phrase,
			footer: isLost ? {text: "Ваше напоминание не могло быть доставлено вовремя."} : null
		});
	}


	options = {
		name: "TimeEvent/remind"
	}
}

export default Event;