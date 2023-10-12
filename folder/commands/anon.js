import EventsManager from "#lib/modules/EventsManager.js";
import { random, TimeAuditor, timestampToDate } from "#lib/util.js";
import { TextTableBuilder, CellAlignEnum } from "@zoodogood/utils/primitives";

class Command {
  async onChatInput(msg, interaction) {
    const context = this.getContext(interaction);


    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { stroke, count } = this.generateLines(context.average);
      context.strokeContent = stroke;
      context.timeAuditor.start();

      await this.updateMessageInterface(context);
      const answer = await interaction.channel.awaitMessage({
        user: interaction.user,
      });

      answer && (context.lastAnswer = answer);

      if (!answer) {
        return this.end(context);
      }

      const anseredCount = parseInt(answer.content.match(/\d+/)?.[0]);

      if (anseredCount !== count) {
        msg.msg({
          reference: answer.id,
          content: Number.isNaN(anseredCount)
            ? "Отмена"
            : `неть || ${count} ||`,
        });
        return this.end(context);
      }

  
      answer.delete();
      context.userScore += count;

      context.auditor.push({
        count,
        timeResult: context.timeAuditor.getDifference(),
      });

      context.average *= 1.35;
      context.average **= 1.05;
    }
  }

  getContext(interaction) {
    const START_AVERAGE = 3;
    return {
      interaction,
      average: START_AVERAGE,
      messageInterface: null,
      strokeContent: null,
      userScore: 0,
      lastAnswer: null,
      timeAuditor: new TimeAuditor(),
      auditor: [],
    };
  }

  calculateReward(context) {
    const { interaction, userScore } = context;
    const experience = Math.floor((2 * userScore) ** 1.007) + 1;
    const userData = interaction.user.data;
    userData.exp += experience;

    const coinOdds = userScore / 3;

    return { experience, coinOdds };
  }

  displayReward(context, { experience, coinOdds }) {
    const { interaction } = context;
    interaction.channel.msg({
      reference: context.messageInterface.id,
      content: `Получено немного опыта: ${experience} (по формуле: количество блоб * 2 ** 1.007). Шанс получить коин: ${Math.ceil(
        Math.min(100, coinOdds)
      )}%`,
    });
  }

  end(context) {
    if (!context.auditor.length) {
      context.messageInterface.delete();
      return;
    }
    const userData = context.interaction.user.data;
    const { coinOdds, experience } = this.calculateReward(context);

    if (random(Math.floor(99 / coinOdds)) === 0) {
      EventsManager.emitter.emit("users/getCoinsFromMessage", {
        userData,
        message: context.lastAnswer,
      });
    }

    userData.exp += experience;

    this.displayReward(context, { coinOdds, experience });

    this.displayAudit(context);
  }

  displayAudit(context){

    const builder = new TextTableBuilder()
      .setBorderOptions()
      .addEmptyRow()
      .addCellAtRow(-1, "Колонна 1.", {align: CellAlignEnum.Right, removeNextSeparator: true})
      .addCellAtRow(-1, "Колонна 2.", {align: CellAlignEnum.Left})
      .addRowSeparator(({metadata}, index) => index === metadata.tableWidth - 1 || index === 0 ? "|" : " ");

    const fields = context.auditor
      .map(
        ({ count, timeResult }, i) => `${ this.getStageCodename(i) } ${ i + 1 }.(${count}):\n${timestampToDate(timeResult)}`
      );

    
    

    while (fields.length){
      builder.addMultilineRowWithElements([fields.shift(), fields.shift() ?? "0"], {align: CellAlignEnum.Center});
      builder.addRowSeparator(({metadata}, index) => metadata.separatorsIndexesInRow.includes(index) ? "+" : "-" );
    }
    
    const content = `\`\`\`\n${ builder.generateTextContent() }\`\`\``;
    

    
    context.interaction.channel.msg({
      content,
    });
  }

  async updateMessageInterface(context) {
    const { interaction, strokeContent } = context;
    const isMessageExists = !!context.messageInterface;
    const target = isMessageExists
      ? context.messageInterface
      : interaction.channel;

    context.messageInterface = await target.msg({
      edit: isMessageExists,
      content: `Введи число: количество палочек. Математические операции между ними включены (округление всегда к меньшему):\n${strokeContent}`,
      reference: interaction.message.id,
    });

    return context.messageInterface;
  }

  generateLines(average) {
    const count = random(average / 1.2, average * 1.2);
    const stroke = [
      ..."|".repeat(count),
      ..."  ".repeat(random(count / 7)),
      ..." + ".repeat(random(1)),
      ..." * ".repeat(random(1)),
      ..." - ".repeat(random(1)),
      ..." % ".repeat(random(1)),
      ..." , ".repeat(random(1)),
      ..." . ".repeat(random(1)),
    ]
      .sort(() => Math.random() - 0.5)
      .join(",");

    return { stroke, count };
  }

  getStageCodename(stageIndex){
    return ["Степь", "Джунгли", "База"].at(stageIndex) ?? "Отпечаток";
  }

  options = {
    name: "anon",
    id: 63,
    media: {
      description:
    "Медленно адаптируется\n\n✏️\n```python\n!anon # без аргументов\n```\n\n",
    },
    allias: "анон",
    allowDM: true,
    cooldown: 10_000,
    type: "other",
  };
}

export default Command;
