import client from "#bot/client.js";

export default {
  emoji: "🖌️",
  label: "🖌️Рассылка",
  description: "Отправляет в указаный канал с интервалом в 15 минут",
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
