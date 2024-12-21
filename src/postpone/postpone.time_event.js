import { client } from "#src/bot/client/singleton.js";

class Event {
	options = {
		name: "timeEvent/postpone",
	};

	async run(timeEventData, authorId, channelId, content) {
		if (timeEventData.isLost)
			client.users.cache.get(authorId).msg({
				title: "Ваше сообщение не было доставлено вовремя",
				description: content,
			});
		const channel = client.channels.cache.get(channelId);

		if (!channel) {
			return;
		}
		const author = channel.guild.members.cache.get(authorId);
		const webhook = await channel.createWebhook(author.displayName, {
			avatar: author.user.avatarURL(),
		});
		await webhook.msg({ content });
		webhook.delete();
	}
}

export default Event;
