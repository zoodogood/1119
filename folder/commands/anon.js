import EventsManager from '#lib/modules/EventsManager.js';
import { random } from '#lib/util.js';

class Command {
  async onChatInput(msg, interaction) {

	const { stroke, count } = this.generateLines();
	const question = await msg.msg({content: `Введи число: сколько здесь палочек? (знаки пока не в счёт):\n${ stroke }`});
	const answer = await interaction.channel.awaitMessage({user: msg.author});
	
	
	if (!answer){
		question.delete();
		return;
	}

	const anseredCount = parseInt(answer.content);
	if (anseredCount !== count){
		msg.msg({reference: answer.id, content: Number.isNaN(anseredCount) ? "Отмена" : `неть || ${ count } ||`});
		return
	}

	const reward = Math.floor((2 * count) ** 1.007);
	const userData = interaction.user.data;
	userData.exp += reward;
	msg.msg({reference: question.id, content: `Получено немного опыта: ${ reward } (по формуле: количество блоб * 2 ** 1.007). Шанс получить коин: ${ Math.ceil(count / 3) }%`});

	if (random(Math.ceil(count / 3)) === 0){
		EventsManager.emitter.emit("users/getCoinsFromMessage", {userData, answer});
	}

  }

  generateLines() {
    const count = random(5, 35);
    const stroke = [
      ..."|".repeat(count),
      ..."  ".repeat(random(count / 7)),
		..." + ".repeat(random(1)),
		..." * ".repeat(random(1)),
		..." - ".repeat(random(1)),
		..." % ".repeat(random(1)),
		..." . ".repeat(random(1))
    ].sort(() => Math.random() - 0.5).join(",");

    return { stroke, count };
  }

  options = {
    name: "anon",
    id: 63,
    media: {
      description:
        "Медленно адаптируется\n\n✏️\n```python\n!anon <max count>\n```\n\n",
    },
    allias: "анон",
    allowDM: true,
    cooldown: 60_000,
    type: "other",
  };
}

export default Command;
