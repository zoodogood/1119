import client from "#src/bot/client/singleton.js";
import { question } from "#src/discord/utils.js";

export default {
	emoji: "🪧",
	label: "Имя канала",
	description: "Отображает информацию в имени канала",
	key: "channel_header",
	setup: async (context) => {
		const { board, interaction } = context.interaction;
		const { guild, channel, user } = interaction;

		const target = await (async () => {
			const { content } = await question({
				user,
				channel,
				message: {
					title: "Введите айди канала или упомяните его",
				},
			});

			if (!content) {
				return null;
			}
			const id = content.match(/\d{17,19}/)?.[0];
			if (!id) {
				channel.msg({
					color: "#ff0000",
					delete: 8_000,
					description: "Не удалось обнаружить метку канала",
				});
				return false;
			}
			const target = guild.channels.cache.get(id);
			if (!target) {
				channel.msg({
					color: "#ff0000",
					delete: 8_000,
					description: `Не найдено канала с ID \`${id}\``,
				});
				return false;
			}

			return target;
		})();

		if (!target) {
			return;
		}

		board.cid = target.id;
		board.content = content;

		return board;
	},
	async render(board, templater) {
		const { cid, content } = board;
		const channel = client.channels.cache.get(cid);
		const vm = templater.createVM();
		const value = await vm.run(content);
		await channel.setName(
			value,
			`!commandInfo board, initialized by <@${board.uid}>`,
		);
	},
};
