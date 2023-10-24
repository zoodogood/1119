import { ExpressionParser } from "#lib/ExpressionParser.js";
import EventsManager from "#lib/modules/EventsManager.js";
import {
  escapeRegexp,
  getRandomElementFromArray,
  match,
  random,
  ROMAN_NUMERALS_TABLE,
  romanToDigit,
  TimeAuditor,
  timestampToDate,
} from "#lib/util.js";
import { getRandomNumberInRange } from "@zoodogood/utils/objectives";
import { TextTableBuilder, CellAlignEnum } from "@zoodogood/utils/primitives";
import { escapeMarkdown } from "discord.js";

const ModesEnum = {
  Default: 0,
  BitsOperations: 1,
  RomanNumerals: 2,
  JustCount: 3,
  Mirror: 4,
  ExpressionsInstead: 5,
  NoComma: 6,
  NoCommaSafe: 7,
  BooleanOperators: 8,
};

const ModesData = {
  [ModesEnum.Default]: {
    label: "По умолчанию",
    description: "Подсчёт палочек, с соответсвующими операциями, в выражении",
    weights: 15,
  },
  [ModesEnum.BitsOperations]: {
    label: "Побитовые операции",
    description:
      "Включены следующие операторы: `[~^&|]`\nМысленно преобразуйте оба операнда в последовательность бит (пример: 0b001) и выполните операцию",
    weights: 3,
  },
  [ModesEnum.RomanNumerals]: {
    label: "Римские числа",
    description: `Числа, выше по иеархии, рекурсивно отнимают от себя, или прибавляют, значения сторонних элементов соответсвенно стороне: ${Object.keys(
      ROMAN_NUMERALS_TABLE,
    ).join(", ")}`,
    weights: 3,
  },
  [ModesEnum.JustCount]: {
    label: "Только количество",
    description:
      "Игнорируйте арифметические знаки, посчитайте лишь общее количество элементов",
    weights: 3,
  },
  [ModesEnum.Mirror]: {
    label: "Зеркало",
    description:
      "Выражение отражено по горизонтали. Читайте его справа на лево",
    weights: 1,
  },
  [ModesEnum.ExpressionsInstead]: {
    label: "Задача со звёздочкой :sparkles:",
    description: "Награда также будет другой",
    weights: 1,
  },
  [ModesEnum.NoComma]: {
    label: "Нет запятых",
    description: "Используйте фишку себе во благо",
    weights: 1,
  },
  [ModesEnum.NoCommaSafe]: {
    label: "Нет запятых S",
    description: "\\*Избавлено\\* от надоедливых запятых",
    weights: 1,
  },
  [ModesEnum.BooleanOperators]: {
    label: "Истина/Ложь",
    description: "Возможно, вам потребуется вернуть 0 или 1",
    weights: 1,
  },
};

class Command {
  async onChatInput(msg, interaction) {
    const context = this.getContext(interaction);

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const task = this.setCurrentTask(context);

      context.timeAuditor.start();

      await this.updateMessageInterface(context);
      const answer = await interaction.channel.awaitMessage({
        user: interaction.user,
      });

      answer && (context.lastAnswer = answer);

      if (!answer) {
        return this.end(context);
      }

      const answerValue = this.parseUserInput(context);
      // to-do: will be removed

      task.userInput = answerValue;

      if (this.checkUserInput(context, answerValue) === false) {
        msg.msg({
          reference: answer.id,
          content: this.generateTextContentOnFail(context),
        });

        return this.end(context);
      }

      answer.delete();
      context.userScore += this.calculateScore(context);

      context.auditor.push({
        count: this.justCalculateStickCount(context),
        task,
        timeResult: context.timeAuditor.getDifference(),
      });

      this.increaseAverageSticksCount(context);
    }
  }

  increaseAverageSticksCount(context) {
    context.averageSticksCount *= 1.35;
    context.averageSticksCount **= 1.05;
    context.averageSticksCount = Math.min(context.averageSticksCount, 300);
  }

  getContext(interaction) {
    const START_AVERAGE = 3;
    return {
      interaction,
      averageSticksCount: START_AVERAGE,
      messageInterface: null,
      userScore: 0,
      lastAnswer: null,
      timeAuditor: new TimeAuditor(),
      auditor: [],
      currentTask: null,
    };
  }

  processMonkeyPaschal(context) {
    if (context.auditor.length < 9) {
      return;
    }

    const MONKEY_TO_SPACE =
      "https://media.discordapp.net/attachments/629546680840093696/1166087241932755138/monkeytospace.png?ex=6549365f&is=6536c15f&hm=c17fde1d51c7d9323deeddaaf6d1cd74af723b05d47144122ac49766a5a05691&=";
    const MONKEY_HAPPY =
      "https://media.discordapp.net/attachments/629546680840093696/1166087575098892288/IMG_20230808_151010.jpg?ex=654936ae&is=6536c1ae&hm=1ec0785014ab36c96deead92bbe572d090d4cfa3066e2c6e7372be33379d7154&=&width=876&height=657";

    const url = random(20) ? MONKEY_TO_SPACE : MONKEY_HAPPY;
    context.interaction.channel.msg({ content: url });
  }

  calculateReward(context) {
    const { userScore } = context;
    const experience = Math.floor((2 * userScore) ** 1.007) + 1;
    const coinOdds = userScore / 3;
    const bonuses =
      3 *
      context.auditor.filter(
        ({ task }) =>
          task.mode === ModesEnum.ExpressionsInstead &&
          !task.userInput.match(/\d/),
      ).length;

    return { experience, coinOdds, bonuses };
  }

  displayReward(context, { experience, coinOdds, bonuses }) {
    const { interaction } = context;
    interaction.channel.msg({
      reference: context.messageInterface.id,
      content: `Получено немного опыта: ${experience} (по формуле: количество блоб * 2 ** 1.007). Шанс получить коин: ${Math.ceil(
        Math.min(100, coinOdds),
      )}%\n${
        bonuses
          ? `Получено немного сокровищ с обратных выражений: ${bonuses}`
          : ""
      }`,
    });
  }

  end(context) {
    if (!context.auditor.length) {
      context.messageInterface.delete();
      return;
    }
    const userData = context.interaction.user.data;
    const { coinOdds, experience, bonuses } = this.calculateReward(context);

    if (random(Math.floor(99 / coinOdds)) === 0) {
      EventsManager.emitter.emit("users/getCoinsFromMessage", {
        userData,
        message: context.lastAnswer,
      });
    }

    userData.exp += experience;

    this.displayReward(context, { coinOdds, experience, bonuses });

    this.displayAudit(context);
  }

  displayAudit(context) {
    const builder = new TextTableBuilder()
      .setBorderOptions()
      .addRowSeparator(({ metadata: { tableWidth } }, index) =>
        [0, 1, tableWidth - 1, tableWidth - 2].includes(index) ? "|" : " ",
      )
      .addRowSeparator(({ metadata: { tableWidth } }, index) =>
        [0, tableWidth - 1].includes(index) ? "|" : index % 2 ? " " : "/",
      )
      .addRowSeparator(({ metadata: { tableWidth } }, index) =>
        [0, tableWidth - 1].includes(index) ? "|" : " ",
      );

    const isExpressionInstead = (task) =>
      task.mode === ModesEnum.ExpressionsInstead;

    const fields = context.auditor.map(
      ({ count, task, timeResult }, i) =>
        `${this.getStageCodename(i)} ${i + 1}.\n(${count}${
          isExpressionInstead(task) ? "*" : ""
        }): ${timestampToDate(timeResult)}`,
    );

    while (fields.length) {
      builder.addMultilineRowWithElements(
        [fields.shift(), fields.shift() ?? "0"],
        { align: CellAlignEnum.Center, gapLeft: 1, gapRight: 1 },
        { minWidth: 15 },
      );
      builder.addRowSeparator(({ metadata }, index) =>
        metadata.separatorsIndexesInRow.includes(index) ? "+" : "-",
      );
    }

    const content = `\`\`\`\n${builder.generateTextContent()}\`\`\``;

    context.interaction.channel.msg({
      content,
    });
  }

  async updateMessageInterface(context) {
    const { interaction } = context;
    const isMessageExists = !!context.messageInterface;
    const target = isMessageExists
      ? context.messageInterface
      : interaction.channel;

    context.messageInterface = await target.msg({
      edit: isMessageExists,
      content: this.generateTextContentOfTask(context),
      reference: interaction.message.id,
    });

    return context.messageInterface;
  }

  checkUserInput(context, value) {
    const { currentTask: task } = context;
    switch (context.currentTask.mode) {
      case ModesEnum.ExpressionsInstead:
        if (value.match(/\d/)) {
          context.interaction.channel.msg({
            content:
              "Использованы числа: дополнительная награда не будет получена на самом деле",
            delete: 8_000,
          });
        }
        return this.calculateResult(value, context) === task.data.value;
      default:
        return this.calculateResult(task.data.expression, context) === +value;
    }
  }

  parseUserInput(context) {
    const content = context.lastAnswer.content;
    switch (context.currentTask.mode) {
      case ModesEnum.ExpressionsInstead:
        return content;
      default:
        return match(content, /-?\d+/);
    }
  }

  generateRandomMode() {
    return getRandomElementFromArray(Object.values(ModesEnum), {
      associatedWeights: Object.values(ModesData).map(({ weights }) => weights),
    });
  }

  setCurrentTask(context) {
    const mode = this.generateRandomMode();
    const task = {
      isResolved: false,
      mode,
      data: null,
      result: null,
      userInput: null,
    };

    context.currentTask = task;
    task.data = this.generateTaskData(context);

    return task;
  }

  generateTaskData(context) {
    const {
      currentTask: { mode },
      averageSticksCount,
    } = context;
    return mode === ModesEnum.ExpressionsInstead
      ? { value: getRandomNumberInRange({ max: averageSticksCount ** 1.2 }) }
      : { expression: this.generateStroke(context) };
  }

  generateStroke(context) {
    const stickSymbol = this.getStickSymbol(context);

    const {
      currentTask: { mode },
      averageSticksCount: average,
    } = context;

    const separator =
      mode === ModesEnum.NoComma || mode === ModesEnum.NoCommaSafe ? "" : ",";

    const count = random(average / 1.2, average * 1.2);
    const stroke = [
      ...stickSymbol.repeat(count),
      ..."  ".repeat(random(count / 5)),
      ..."+".repeat(random(1)),
      ..."*".repeat(random(1)),
      ..."/".repeat(random(5) ? 0 : 1),
      ..."-".repeat(random(1)),
      ..."%".repeat(random(1)),
      ...",".repeat(random(1)),
      ...".".repeat(random(5) ? 0 : 1),
      random(mode === ModesEnum.BitsOperations ? 1 : 0) ? "&" : null,
      random(mode === ModesEnum.BitsOperations ? 1 : 0) ? "|" : null,
      random(mode === ModesEnum.BitsOperations ? 1 : 0) ? "~" : null,
      random(mode === ModesEnum.RomanNumerals ? 2 : 0) ? "V" : null,
      random(mode === ModesEnum.RomanNumerals ? 1 : 0) ? "X" : null,
      random(mode === ModesEnum.RomanNumerals ? 1 : 0) ? "L" : null,
      random(mode === ModesEnum.BooleanOperators ? 1 : 0) ? "&&" : null,
      random(mode === ModesEnum.BooleanOperators ? 1 : 0) ? "||" : null,
      random(mode === ModesEnum.BooleanOperators ? 1 : 0) ? "<" : null,
      random(mode === ModesEnum.BooleanOperators ? 1 : 0) ? ">" : null,
      random(mode === ModesEnum.BooleanOperators ? 1 : 0) ? "===" : null,
    ]
      .sort(() => Math.random() - 0.5)
      .join(separator);

    return this.fixStroke(stroke, context);
  }

  fixStroke(stroke, context) {
    const isBitsMode = context.currentTask.mode === ModesEnum.BitsOperations;
    const charactersToTrim = [
      "+",
      "-",
      "*",
      "/",
      "%",
      "&",
      isBitsMode ? "|" : null,
    ].filter(Boolean);

    return stroke.replaceAll(
      RegExp(`(?:${escapeRegexp(charactersToTrim.join("|"))})`, "g"),
      () => "",
    );
  }

  getStickSymbol(context) {
    return context.currentTask.mode === ModesEnum.BitsOperations ? "\\" : "|";
  }

  calculateResult(expression, context) {
    const { currentTask: task } = context;
    if (task.mode === ModesEnum.JustCount) {
      return this.justCalculateStickCount(context);
    }
    expression = this.cleanExpression(expression, context);
    return ExpressionParser.toDigit(expression);
  }

  calculateScore(context) {
    const { currentTask: task } = context;

    const isExpressionInstead = task.mode === ModesEnum.ExpressionsInstead;
    return isExpressionInstead
      ? this.evaluateExpressionBrevity(task.userInput)
      : this.justCalculateStickCount(context);
  }

  cleanExpression(expression, context) {
    const stick = this.getStickSymbol(context);
    expression = expression.replace(/[\s,.]/g, "");

    const regex = RegExp(
      `(?:${escapeRegexp(stick)}|${Object.keys(ROMAN_NUMERALS_TABLE).join(
        "|",
      )})+`,
      "g",
    );
    expression = expression.replace(regex, (value) =>
      romanToDigit(value.replaceAll(stick, "I")),
    );

    expression = ExpressionParser.normalizeExpression(expression);

    return expression;
  }

  evaluateExpressionBrevity(expression) {
    return Math.ceil(10 / (expression.length / 3));
  }

  getStageCodename(stageIndex) {
    return (
      [
        "Джунгли",
        "Степь",
        "Пески",
        "Обитель",
        "База",
        "Побережье",
        "Станция",
        "Применение\nдрайвера",
        "Запуск\nРакеты",
        "Космос",
      ].at(stageIndex) ?? "Отпечаток"
    );
  }

  justCalculateStickCount(context) {
    const task = context.currentTask;
    const stroke =
      task.mode === ModesEnum.ExpressionsInstead
        ? task.userInput
        : task.data.expression;

    let count = 0;
    const stick = this.getStickSymbol(context);
    for (const symbol of stroke) {
      symbol === stick && count++;
    }

    return count;
  }

  generateTextContentOnFail(context) {
    const { currentTask: task } = context;
    const isExpressionInstead = task.mode === ModesEnum.ExpressionsInstead;
    const expression = isExpressionInstead
      ? task.userInput
      : task.data.expression;
    const result = this.calculateResult(expression, context);
    return `неть || ${escapeMarkdown(
      this.cleanExpression(expression, context),
    )} || === || ${result} ||`;
  }

  generateTextContentOfTask(context) {
    const { currentTask: task } = context;
    const isExpressionInstead = task.mode === ModesEnum.ExpressionsInstead;
    const isDefaultMode = task.mode === ModesEnum.Default;

    const direct = isExpressionInstead
      ? "Введи выражение (обратная операция):"
      : "Введи число: количество палочек. Математические операции между ними включены (округление всегда к меньшему):";
    const dataContent = (() => {
      const isMirrorMode = task.mode === ModesEnum.Mirror;
      let value;
      value = isExpressionInstead
        ? String(task.data.value)
        : task.data.expression;

      value = escapeMarkdown(value);
      isMirrorMode &&
        (() => {
          value = [...value]
            .reverse()
            .join("")
            .replace(/(\()|(\))/g, (full) => (full === "(" ? ")" : "("));
        })();

      const allowSpoliersInText = task.mode === ModesEnum.NoComma;

      allowSpoliersInText &&
        (() => {
          value = value.replaceAll("\\|", "|");
        })();

      const content = isExpressionInstead
        ? `Ожидамое значение: ${value}`
        : value;
      return content;
    })();

    const bananaContent = !random(20) ? " :banana:" : "";

    const { label: modeLabel, description: modeDescription } =
      ModesData[task.mode];
    return `${direct}${bananaContent}\n${dataContent}\n\n${
      !isDefaultMode ? `**${modeLabel}** )\n${modeDescription}` : ""
    } `;
  }

  options = {
    name: "anon",
    id: 63,
    media: {
      description:
        "Медленно адаптируется\nПримечание к выпуску: [побитовые операторы](https://learn.javascript.ru/bitwise-operators); Пока не ясно в каком направлении будет меняться эта команда\n\n✏️\n```python\n!anon # без аргументов\n```\n\n",
    },
    allias: "анон",
    allowDM: true,
    cooldown: 60_000,
    type: "other",
  };
}

export default Command;
