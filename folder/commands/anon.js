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
import {
  TextTableBuilder,
  CellAlignEnum,
  ending,
} from "@zoodogood/utils/primitives";
import { ButtonStyle, ComponentType, escapeMarkdown } from "discord.js";

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
  TIME_FOR_RESPONSE_ON_TASK = 600_000;
  EXPERIENCE_FOR_STICK = 0.75;

  async onChatInput(msg, interaction) {
    const context = this.getContext(interaction);

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const task = this.setCurrentTask(context);

      context.timeAuditor.start();

      await this.updateMessageInterface(context);
      const answer = await interaction.channel.awaitMessage({
        user: interaction.user,
        time: this.TIME_FOR_RESPONSE_ON_TASK,
      });

      answer && (context.lastAnswer = answer);

      context.auditor.push({
        count: this.justCalculateStickCount(context),
        task,
        timeResult: context.timeAuditor.getDifference(),
      });

      if (!answer) {
        return this.end(context);
      }

      const answerValue = this.parseUserInput(context);

      task.userInput = answerValue;

      if (this.checkUserInput(context, answerValue) === false) {
        msg.msg({
          reference: answer.id,
          content: this.generateTextContentOnFail(context),
        });

        return this.end(context);
      }

      setTimeout(() => answer.delete(), 9_000);
      task.isResolved = true;
      context.userScore += this.calculateScore(context);

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
      isEnd: false,
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
    const experience =
      Math.floor((this.EXPERIENCE_FOR_STICK * userScore) ** 1.007) + 1;
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
      content: `Получено немного опыта: ${experience} (по формуле: количество блоб * ${
        this.EXPERIENCE_FOR_STICK
      } ** 1.007). Шанс получить коин: ${Math.ceil(
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

    context.isEnd = true;
    this.updateMessageInterface(context);

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

    this.processMonkeyPaschal(context);
  }

  async displayAudit(context) {
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

    const fields = context.auditor.map(({ count, task, timeResult }, i) => {
      const stage = task.isResolved
        ? `${this.getStageCodename(i)} ${i + 1}.`
        : "(×)";

      return `${stage}\n(${count}${
        isExpressionInstead(task) ? "*" : ""
      }): ${timestampToDate(timeResult)}`;
    });

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

    builder.addRowSeparator(() =>
      !random(2) ? "/" : !random(20) ? "⚘" : !random(20) ? "❀" : " ",
    );

    const content = `\`\`\`\n${builder.generateTextContent()}\`\`\``;
    const customId = "watchInfo";

    const components = {
      emoji: "👀",
      type: ComponentType.Button,
      style: ButtonStyle.Secondary,
      customId,
    };
    const message = await context.interaction.channel.msg({
      content,
      components,
    });

    this.createMessageComponentCollector(message, context);
  }

  getTaskContentComponents(context) {
    const { isEnd } = context;
    return isEnd
      ? []
      : [
          {
            type: ComponentType.Button,
            label: "- Оставшееся время",
            style: ButtonStyle.Secondary,
            customId: "displayRemainingTime",
          },
          {
            type: ComponentType.Button,
            emoji: "📗",
            style: ButtonStyle.Secondary,
            customId: "getGuidance",
          },
        ];
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
      components: this.getTaskContentComponents(context),
    });

    this.createMessageComponentCollector(context.messageInterface, context);
    return context.messageInterface;
  }

  createMessageComponentCollector(message, context) {
    context._collectors ||= {};

    if (message.id in context._collectors) {
      const collector = context._collectors[message.id];
      collector.resetTimer();
      return;
    }

    const collector = message.createMessageComponentCollector({
      time: this.TIME_FOR_RESPONSE_ON_TASK,
    });

    collector.on("collect", (interaction) =>
      this.onComponent(
        { interaction, rawParams: interaction.customId },
        context,
        collector,
      ),
    );

    context._collectors[message.id] = collector;

    collector.on("end", () => {
      message.msg({ edit: true, components: [] });
      delete context._collectors[message.id];
    });
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
        return task.result === +value;
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
    switch (task.mode) {
      case ModesEnum.ExpressionsInstead:
        task.result = null;
        break;
      default:
        task.result = this.calculateResult(task.data.expression, context);
    }

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
      random(mode === ModesEnum.RomanNumerals ? count / 10 + 2 : 0)
        ? "V"
        : null,
      random(mode === ModesEnum.RomanNumerals ? count / 12 + 1 : 0)
        ? "X"
        : null,
      random(mode === ModesEnum.RomanNumerals ? count / 12 + 1 : 0)
        ? "L"
        : null,
      random(mode === ModesEnum.RomanNumerals ? 1 : 0) ? "C" : null,
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

    const numerals = RegExp(
      `(?:${escapeRegexp(stick)}|${Object.keys(ROMAN_NUMERALS_TABLE).join(
        "|",
      )})+`,
      "g",
    );
    expression = expression.replace(numerals, (value) =>
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

    if (!stroke) {
      return 0;
    }

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
    const { currentTask: task, interaction, isEnd, auditor } = context;
    const isExpressionInstead = task.mode === ModesEnum.ExpressionsInstead;
    const isDefaultMode = task.mode === ModesEnum.Default;

    const direct = isEnd
      ? `The end, ты успешно решил ${ending(
        auditor.length - 1,
        "пример",
        "ов",
        "",
        "а",
      )}`
      : isExpressionInstead
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
    return `${interaction.user.toString()}, ${direct}${bananaContent}\n${dataContent}\n\n${
      !isDefaultMode ? `**${modeLabel}** )\n${modeDescription}` : ""
    } `;
  }

  async onComponent({ interaction, rawParams }, context, collector) {
    const [target, ...params] = rawParams.split(":");
    const handler = this.componentsHandlers[target];
    handler.call(this, interaction, params, context, collector);
  }

  componentsHandlers = {
    watchInfo: async (interaction, _, context) => {
      interaction.msg({
        ephemeral: true,
        content: "Укажите индекс локации для дополнительных сведений",
      });

      const answer = await interaction.channel.awaitMessage({
        remove: true,
        user: interaction.user,
      });
      if (!answer) {
        return;
      }

      const { task } =
        context.auditor.at(+answer.content.match(/\d+/)?.[0] - 1) ?? {};

      if (!task) {
        interaction.msg({
          edit: true,
          content: "Нет, такой локации не найдено",
        });
        return;
      }

      const { mode, data, userInput, result } = task;
      const taskData = JSON.stringify(
        { ...data, userInput, result },
        null,
        "\t",
      );
      const modeLabel = ModesData[mode].label;
      interaction.msg({
        edit: true,
        content: `**${modeLabel}** )\n${escapeMarkdown(taskData)}`,
      });
    },
    displayRemainingTime: async (interaction, _, context) => {
      const remaining =
        this.TIME_FOR_RESPONSE_ON_TASK - context.timeAuditor.getDifference();

      const content = timestampToDate(remaining);
      interaction.msg({ ephemeral: true, title: content, color: "#c0c0c0" });
    },
    getGuidance: async (interaction) => {
      interaction.msg({ ephemeral: true, content: "*мотивирующая речь*" });
    },
  };

  options = {
    name: "anon",
    id: 63,
    media: {
      description:
        "Медленно адаптируется\nПримечание к выпуску: [побитовые операторы](https://learn.javascript.ru/bitwise-operators); Пока не ясно в каком направлении будет меняться эта команда\n\n✏️\n```python\n!anon # без аргументов\n```\n\n",
    },
    allias: "анон",
    allowDM: true,
    cooldown: 10_000,
    type: "other",
  };
}

export default Command;
