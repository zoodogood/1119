import { question } from "#bot/util.js";

export default {
  emoji: "🖊️",
  label: "🖊️Сообщение",
  description:
    "Единожды отправляет сообщение и после, ненавязчиво, изменяет его содержимое",
  key: "message_content",
  setup: async (context) => {
    const { interaction, counter, typeBase } = context.interaction;
    const { channel, user, guild } = interaction;
    counter.type = typeBase.key;
    counter.channelId = channel.id;
    counter.guildId = guild.id;
    counter.authorId = user.id;

    question({
      channel,
      user,
      message: {
        description:
          "Привет! Это исключительное руководство по созданию счётчиков-сообщений. \nУкажите сообщение, отправленное Призраком. Сделать это можно ответив на него, отправив сообщение, содержащее ссылку на сообщение или идентификатор сообщения",
      },
    });

    const questionNeedEmbed = async () => {
      const message = await interaction.message.msg({
        title: "Вашему сообщению нужен эмбед?",
        description: "Вы сможете передать JSON-набор для эмбед сообщения",
      });
      const react = await message.awaitReact(
        { user: interaction.user, removeType: "all" },
        "685057435161198594",
        "763807890573885456",
      );
      message.delete();
      return react === "685057435161198594";
    };

    context.needEmbed = await questionNeedEmbed();

    if (context.needEmbed) {
    }

    return counter;
  },
  async render({ channel, counter }, templater) {
    const options = counter.message;
    options.title &&= await templater.replaceAll(options.title);
    options.description &&= await templater.replaceAll(options.description);
    options.content &&= await templater.replaceAll(options.content);

    const message = await channel.messages.fetch(counter.messageId);
    message.msg({ ...options, edit: true });
    return message;
  },
};
