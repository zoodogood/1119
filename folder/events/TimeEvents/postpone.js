import { client } from '#src/index.js';


class Event {
	async run(isLost, authorId, channelId, content){
		if (isLost) client.users.cache.get(authorId).msg({title: "Ваше сообщение не было доставлено вовремя", description: content});
		const channel = client.channels.cache.get(channelId);

		if (!channel){
			return;
		}
		const author = channel.guild.members.cache.get(authorId);
		const webhook = await channel.createWebhook(author.displayName, {avatar: author.user.avatarURL()});
		await webhook.msg({content});
		webhook.delete();
	}

	

	options = {
		name: "TimeEvent/postpone"
	}
}

export default Event;