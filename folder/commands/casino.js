import * as Util from '#lib/util.js';

class Command {

	async onChatInput(msg, interaction){
    msg.msg({title: "Казино закрыто", description: "Казино закрыто. Боюсь что оно больше не откроется.\nЭтого не могло не случится, извините.\n\n — Прощайте. ©️Мэр-Миллиардер Букашка", delete: 20000});
    return;

    let bet = interaction.params.match(/\d+|\+/);

    if (bet === null){
      msg.msg({title: "Укажите Ставку в числовом виде!", color: "#ff0000", delete: 3000});
      return;
    }
    bet = bet[0];

    if (bet === "+")
      bet = interaction.userData.coins;

    bet = Math.max(0, Math.floor(bet));

    if (interaction.userData.coins < bet){
      msg.msg({title: "Недостаточно коинов", color: "#ff0000", delete: 3000});
      return;
    }

    const diceRoll = Util.random(100);
    const options = {
      title: "Лесовитое казино",
      author: { name: msg.author.username, iconURL: msg.author.avatarURL() },
      delete: 20000,
      footer: {text: `Ставка: ${ bet }`}
    }
    const isWon = diceRoll % 2;
    options.description = `
**${ isWon ? "Вы выиграли." : "Проиграли" }**
**Кидаем кубик.. выпадает:** \`${ diceRoll }\`; ${ isWon ? "🦝" : "❌" }

${ isWon ? `\\*Вам достается куш — ${ Util.ending(bet * 2, "коин", "ов", "", "а") } <:coin:637533074879414272>\\*` : "Чтобы выиграть дожно выпасть число, которое не делится на 2" }
    `;

    interaction.userData.coins -= (-1) ** isWon * bet;
    msg.msg(options);
  }


	options = {
	  "name": "casino",
	  "id": 57,
	  "media": {
	    "description": "\n\nМеня долго просили сделать Казино. И вот оно здесь!\nТакое же пустое как и ваши кошельки\n\n✏️\n```python\n!casino {coinsBet | \"+\"}\n```\n\n"
	  },
	  "allias": "казино bet ставка",
		"allowDM": true,
		"type": "other"
	};
};

export default Command;