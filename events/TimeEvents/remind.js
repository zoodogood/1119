import { client } from '#src/index.js';

class Event {

	run(isLost, authorId, channelId, phrase){
		const channel = client.channels.cache.get(channelId);
		const author  = client.users.cache.get(authorId);

		const target = channel || author;

		if (target !== author)
			target.msg({content: author.toString(), mentions: [author.id]});
			
		target.msg({title: "Напоминание:", description: phrase, footer: isLost ? null : "Ваше напоминание не могло быть доставлено вовремя."});
	}


	options = {
		name: "TimeEvent/remind"
	}
}

export default Event;