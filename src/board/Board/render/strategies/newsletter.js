import client from "#src/bot/client/singleton.js";

export default {
	emoji: "🖌️",
	label: "Лента",
	description: "Отправляет сообщение через промежутки времени",
	key: "newsletter",

	setup: async (context) => {
		return board;
	},
	async render(board, templater) {
		const { cid, content } = board;
		const channel = client.channels.cache.get(cid);
		const vm = templater.createVM();
		channel.msg(await vm.run(content));
	},
};
