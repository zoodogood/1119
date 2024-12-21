import client from "#src/bot/client/singleton.js";
import { question, resolve_message_in_answer } from "#src/discord/utils.js";

export default {
	emoji: "🖊️",
	label: "Сообщение",
	description:
		"Единожды получает сообщение и после, ненавязчиво, изменяет его содержимое",
	key: "message_content",
	setup: async (context) => {
		const { interaction, board } = context;
		const { channel, user } = interaction;

		const { value } = await question({
			channel,
			user,
			message: {
				description:
					"Привет! Это исключительное руководство по созданию табла-сообщения. Принцип работы: содержимое табла будет генерироваться на основе кода внутри сообщения. бот имеет полномочие редактировать только свои сообщения. Чтобы не дублировать функционал команды !эмбед\nУкажите сообщение, отправленное Призраком. Сделать это можно ответив на него, отправив сообщение, содержащее ссылку на сообщение или идентификатор сообщения",
			},
		});

		const id = resolve_message_in_answer(value);
		channel.messages.fetch(id);
		return board;
	},
	async render(board, templater) {
		const options = board.message;
		const { cid, mid } = board;

		const channel = client.channels.cache.get(cid);
		const message = await channel.messages.fetch(mid);
		const { embed } = message;
		embed.content = message.content;
		const vm = templater.createVM();

		for (const [key, value] of Object.entries(options)) {
			embed[key] = await vm.run(value);
		}

		message.msg({ ...embed, edit: true });
		return message;
	},
};
