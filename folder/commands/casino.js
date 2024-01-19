import { Actions } from "#lib/modules/ActionManager.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import * as Util from "#lib/util.js";

class Command {
  parseParams(interaction) {
    let bet = interaction.params.match(/\d+|\+/);

    if (bet === null) {
      interaction.channel.msg({
        title: "Укажите Ставку в числовом виде!",
        color: "#ff0000",
        delete: 3000,
      });
      return null;
    }
    bet = bet[0];

    if (bet === "+") {
      bet = interaction.userData.coins;
    }

    bet = Math.max(0, Math.floor(bet));

    return { bet };
  }
  async onChatInput(msg, interaction) {
    const { bet } = this.parseParams(interaction) ?? {};
    if (bet === null) {
      return;
    }

    const { userData, user } = interaction;
    if (userData.coins < bet) {
      msg.msg({ title: "Недостаточно коинов", color: "#ff0000", delete: 3000 });
      return;
    }

    const diceRoll = Util.random(8);
    const embed = {
      title: "Лесовитое казино",
      author: { name: msg.author.username, iconURL: msg.author.avatarURL() },
      delete: 20_000,
      footer: { text: `Ставка: ${bet}` },
    };
    const isWon = diceRoll % 2;

    user.action(Actions.casinoSession, {
      isWon,
      bet,
    });

    embed.description = `
**${isWon ? "Вы выиграли." : "Проиграли"}**
**Кидаем кубик.. выпадает:** \`${diceRoll}\`; ${isWon ? "🦝" : "❌"}

${
  isWon
    ? `\\*Вам достается куш — ${Util.ending(
        bet * 2,
        "коин",
        "ов",
        "",
        "а",
      )} <:coin:637533074879414272>\\*`
    : "Чтобы выиграть, дожно выпасть число, которое не делится на 2"
}
`;

    Util.addResource({
      user,
      value: (-1) ** !isWon * bet,
      executor: user,
      source: "command.casino",
      resource: PropertiesEnum.coins,
      context: { interaction, isWon },
    });
    msg.msg(embed);
  }

  options = {
    name: "casino",
    id: 57,
    media: {
      description:
        '\n\nМеня долго просили сделать Казино. И вот оно здесь!\nТакое же пустое как и ваши кошельки\n\n✏️\n```python\n!casino {coinsBet | "+"}\n```\n\n',
    },
    alias: "казино bet ставка",
    cooldown: 300_000,
    expectParams: true,
    allowDM: true,
    type: "other",
  };
}

export default Command;
