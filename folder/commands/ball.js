import * as Util from "#lib/util.js";

class Command {
  async onChatInput(msg, interaction) {
    if (!interaction.params.includes(" ")) {
      return msg.msg({
        title: "Это не вопрос",
        delete: 4000,
        color: "#ff0000",
      });
    }

    msg.channel.sendTyping();
    await Util.sleep(700);
    const answer = [
      { _weight: 1, answer: "*Что-то на призрачном*" },
      { _weight: 1, answer: "Ты скучный, я спать" },
      { _weight: 2, answer: "\\*Звуки свёрчков\\*" },
      { _weight: 3, answer: "нет-нет-нет." },
      { _weight: 3, answer: "Я проверил — нет" },
      { _weight: 3, answer: "Может быть в другой вселенной" },
      { _weight: 4, answer: "Абсолютно и беспрекословно, мой ответ — нет." },
      { _weight: 5, answer: "Меч лжи говорит, что да" },
      { _weight: 6, answer: "Точно нет" },
      { _weight: 7, answer: "неа" },
      { _weight: 8, answer: "нет" },
    ].random({ weights: true }).answer;
    msg.msg({ content: answer, reference: msg.id });
  }

  options = {
    name: "ball",
    id: 40,
    media: {
      description:
        'Всегда отвечающий "нет" Шар, почему все думают, что он всевидящий?\n\n✏️\n```python\n!ball {question?} # Не спрашивайте у него как его дела\n```',
      poster:
        "https://media.discordapp.net/attachments/769566192846635010/872442452152307762/ball.gif",
    },
    allias: "8ball шар куля",
    allowDM: true,
    expectParams: true,
    cooldown: 3_000,
    type: "other",
  };
}

export default Command;
