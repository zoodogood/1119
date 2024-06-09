import { SECOND } from "#constants/globals/time.js";
import { addCoinFromMessage } from "#folder/events/users/getCoinFromMessage.js";
import { BaseCommand } from "#lib/BaseCommand.js";
import { Pager } from "#lib/DiscordPager.js";
import { ExpressionParser, TokenTypeEnum } from "#lib/ExpressionParser.js";
import { Actions } from "#lib/modules/ActionManager.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import {
  ROMAN_NUMERALS_TABLE,
  TimeAuditor,
  addMultipleResources,
  escapeRegexp,
  getRandomElementFromArray,
  match,
  random,
  romanToDigit,
  timestampToDate,
} from "#lib/util.js";
import { justButtonComponents } from "@zoodogood/utils/discordjs";
import { getRandomNumberInRange } from "@zoodogood/utils/objectives";
import {
  CellAlignEnum,
  TextTableBuilder,
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
    description: `Числа сверху, по иеархии, рекурсивно отнимают от себя, или прибавляют, значения сторонних элементов соответсвенно стороне: ${Object.keys(
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

class CommandGuidances {
  constructor(context, command) {
    this.context = context;
    this.command = command;
  }
  getGuidancePagesContent() {
    return [
      "Решайте запачканые уравнения",
      'Стандартные операторы:\n` "+" ` — сложение\n` "-" ` — вычитание\n` "*" ` — умножение\n` "/" ` — деление с округлением\n` "%" ` — остаток от деления\n` "**" ` — возведение в степень',
      'Побитовые операторы:\n` "&" ` — побитовое и (and)\n` "|" ` — побитовое или (or)\n` "~" ` — побитовое не (not)\n` "^" ` — побитовое исключающее или (xor)\n, — побитовые операторы воздействуют на каждый бит числа.\nПример: `0b1|0b01=0b11=1|2=3`\n\nПереведите в привычную систему счисления:\nвозведите число 2 в степень номера разряда для каждого бита, суммируйте\nПример: `0b111=(2**3+2**1+2**0)`\n\nДополнительно:\n- оператор побитового "не", по сути, заменяет два действия:\n\\×(-1) и -1, а именно пример: `~3=(3×(-1)-1)=-4`',
      'Логические значения:\n` "1" `, или любое значение, не ноль — вернуть истину\n` "0" ` — вернуть ложь\nОператоры:\n` "&&" ` — оператор логического "и"\n` "||" ` — логическое "или"\n` ">" ` — "больше"\n` "<" ` — "меньше"\n` "===" ` — "равенство"\n` "!" ` — логическое "отрицание"\n, — логические операторы не могут вернуть значение отличное от "0" или "1"\nПримеры: `1&&0=0`, `2===3=0`, `!10=0`, `!0=1`',
      `Приоритет операторов:\n${(() => {
        const tokens = Object.values(ExpressionParser.Tokens).filter(
          (token) => token.type === TokenTypeEnum.Operator,
        );

        const prioritySet = [
          ...new Set(tokens.map((token) => token.operatorPriority || 0)),
        ]
          .sort()
          .map(String);

        const tokensTable = new Array(prioritySet.length).fill("");
        for (const token of tokens) {
          tokensTable[token.operatorPriority] += `\n${token.symbol}`;
        }
        const builder = new TextTableBuilder()
          .addRowWithElements(prioritySet, { align: CellAlignEnum.Center })
          .addRowSeparator()
          .addMultilineRowWithElements(tokensTable, {
            removeNextSeparator: true,
            gapLeft: 2,
            gapRight: 2,
          });

        return `\`\`\`⠀\n${builder.generateTextContent()}\`\`\``;
      })()},\n — где операция степени всегда будет выполняться первой, а логические — последними. В случае, если приоритет операторов одинаковый, операции выполняются последовательно`,
      `Римские обозначения:\n${Object.entries(ROMAN_NUMERALS_TABLE)
        .map(([key, value]) => `\` "${key}" \` — ${value}`)
        .join("\n")}`,
      `Алгоритм решения Римских цифер:
Ищите наибольший элемент
- 1) Найдите символ, который обозначает наибольшее число
- 2) Если за ним следует идентичный символ, смело суммируйте их
- 3) Проверьте есть ли элементы слева от найденного
- 3.1) В случае, если Да, перейдите к шагу один и вновь найдите наибольший элемент из доступных. Результат отнимите от текущего наибольшего элемента: \`IV=5-1\`
- 4) Повторите шаги 3 и 3.1 для правой стороны. Результат прибавьте: \`VI=5+1\`
- 5) Выражение решено

Пример: \`VIXXI=(10+10-(5+1)+1)\``,
      "Крайние случаи:\nПроблема: **операторы находятся скраю от выражения или идут один за другим**\nПояснение: невалидные операторы должны быть проигнорированы, например, знак умножения не может находится по левому или правому краю\n\\*Знаки плюс или минус всегда валидны, если предшествуют числу.\nПример 1: `4*/2=4/2`, оператор умножения проверялся первым и был проигнорирован.\nПример 2: `+2=2`, знаку плюс необязательно иметь левого соседа\n\nПриоритет операторов не учитывается на этапе внутренней проверке их валидности",
    ];
  }
  async onInteraction(interaction) {
    const pager = new Pager(interaction.channel);
    pager.addPages(
      ...this.getGuidancePagesContent().map((description) => ({
        description,
        fetchReply: true,
      })),
    );
    pager.setHideDisabledComponents(true);
    pager.updateMessage(interaction);
  }
}

class Command extends BaseCommand {
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
      const logic = this.getContentLogicOfResult(
        this.getExpressionOfTask(task, context),
        task,
        context,
      );
      const taskData = JSON.stringify(
        { ...data, userInput, result, logic },
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

      const content = `${timestampToDate(remaining)} для L${
        context.auditor.length + 1
      }`;
      interaction.msg({ ephemeral: true, title: content, color: "#c0c0c0" });
    },
    getGuidance: async (interaction, _, context) => {
      new CommandGuidances(context, this).onInteraction(interaction);
    },
  };
  EXPERIENCE_FOR_STICK = 0.3;

  options = {
    name: "anon",
    id: 63,
    media: {
      description:
        "Медленно адаптируется\nПримечание к выпуску: [побитовые операторы](https://learn.javascript.ru/bitwise-operators); Пока не ясно в каком направлении будет меняться эта команда",
      example: `!anon # без аргументов`,
    },
    accessibility: {
      publicized_on_level: 10,
    },
    alias: "анон",
    allowDM: true,
    cooldown: 10_000,
    type: "other",
  };

  TIME_FOR_RESPONSE_ON_TASK = 600_000;

  calculateResult(expression, context) {
    const { currentTask: task } = context;
    if (task.mode === ModesEnum.JustCount) {
      return this.justCalculateStickCount(task, context);
    }
    expression = this.cleanExpression(expression, context);
    return ExpressionParser.toDigit(expression);
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

  calculateScore(context) {
    const { currentTask: task } = context;

    const isExpressionInstead = task.mode === ModesEnum.ExpressionsInstead;
    return isExpressionInstead
      ? this.evaluateExpressionBrevity(task.userInput)
      : this.justCalculateStickCount(task, context);
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

  cleanExpression(expression, context) {
    const { currentTask: task } = context;
    const stick = this.getStickSymbolOfTask(task, context);
    expression = expression.replace(/[\s,.]/g, "");

    const numerals = RegExp(
      `(?:${escapeRegexp(stick)}|${Object.keys(ROMAN_NUMERALS_TABLE).join(
        "|",
      )})+`,
      "ig",
    );
    expression = expression.replace(numerals, (value) =>
      romanToDigit(value.replaceAll(stick, "I")),
    );

    expression = ExpressionParser.normalizeExpression(expression);

    return expression;
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

  createTask(context) {
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

  async displayAudit(context) {
    const builder = new TextTableBuilder()
      .setBorderOptions()
      .addRowSeparator(({ metadata: { tableWidth } }, index) =>
        [0, 1, tableWidth - 1, tableWidth - 2].includes(index) ? "|" : " ",
      )
      .addRowSeparator(({ metadata: { tableWidth } }, index) =>
        [0, tableWidth - 1].includes(index) ? "|" : index % 2 ? " " : "=",
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
      }): ${Math.floor(timeResult / SECOND)}с.`;
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

    const { user } = context.interaction;
    const { coinOdds, experience, bonuses } = this.calculateReward(context);

    if (random(Math.floor(99 / coinOdds)) === 0) {
      addCoinFromMessage(context.lastAnswer);
    }

    addMultipleResources({
      user,
      executor: user,
      source: "command.anon.end",
      context,
      resources: {
        [PropertiesEnum.exp]: experience,
        [PropertiesEnum.chestBonus]: bonuses,
      },
    });

    this.displayReward(context, { coinOdds, experience, bonuses });

    this.displayAudit(context);

    this.processMonkeyPaschal(context);
  }

  evaluateExpressionBrevity(expression) {
    return Math.ceil(10 / (expression.length / 3));
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

  generateRandomMode() {
    return getRandomElementFromArray(Object.values(ModesEnum), {
      associatedWeights: Object.values(ModesData).map(({ weights }) => weights),
    });
  }

  generateStroke(context) {
    const { currentTask: task, averageSticksCount: average } = context;
    const { mode } = task;

    const stickSymbol = this.getStickSymbolOfTask(task, context);

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

  generateTaskData(context) {
    const {
      currentTask: { mode },
      averageSticksCount,
    } = context;
    return mode === ModesEnum.ExpressionsInstead
      ? { value: getRandomNumberInRange({ max: averageSticksCount ** 1.2 }) }
      : { expression: this.generateStroke(context) };
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

  generateTextContentOnFail(context) {
    const { currentTask: task } = context;

    const expression = this.getExpressionOfTask(task, context);
    const result = this.calculateResult(expression, context);
    const logicOfResult = this.getContentLogicOfResult(
      expression,
      task,
      context,
    );
    return `неть || ${logicOfResult} || === || ${result} ||`;
  }

  getContentLogicOfResult(expression, task, context) {
    const logic =
      task.mode === ModesEnum.JustCount
        ? `${this.getStickSymbolOfTask(
            task,
            context,
          )} × ${this.justCalculateStickCount(task, context)}`
        : this.cleanExpression(expression, context);

    return escapeMarkdown(logic);
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

  getExpressionOfTask(task) {
    const isExpressionInstead = task.mode === ModesEnum.ExpressionsInstead;
    return isExpressionInstead ? task.userInput : task.data.expression;
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

  getStickSymbolOfTask(task) {
    return task.mode === ModesEnum.BitsOperations ? "\\" : "|";
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

  increaseAverageSticksCount(context) {
    context.averageSticksCount *= 1.35;
    context.averageSticksCount **= 1.05;
    context.averageSticksCount = Math.min(context.averageSticksCount, 300);
  }

  justCalculateStickCount(task, context) {
    const stroke =
      task.mode === ModesEnum.ExpressionsInstead
        ? task.userInput
        : task.data.expression;

    if (!stroke) {
      return 0;
    }

    let count = 0;
    const stick = this.getStickSymbolOfTask(task, context);

    for (const symbol of stroke) {
      symbol === stick && count++;
    }

    return count;
  }

  async onChatInput(msg, interaction) {
    const context = this.getContext(interaction);

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (context.isEnd) {
        return;
      }
      try {
        await this.onLoopFrame(context);
      } catch (error) {
        const prompt = await interaction.channel.msg({
          title: "Команда завершена некоректно, нажмите чтобы продолжить",
          description: error.message,
          components: justButtonComponents({ label: "Продолжить" }),
        });
        const needResume = await prompt
          .awaitMessageComponent({
            time: 20_000,
            filter: ({ user }) => interaction.user.id === user.id,
          })
          .catch(() => {});

        prompt.delete();
        if (needResume) {
          continue;
        }

        return this.end(context);
      }
    }
  }

  async onComponent({ interaction, rawParams }, context, collector) {
    const [target, ...params] = rawParams.split(":");
    const handler = this.componentsHandlers[target];
    handler.call(this, interaction, params, context, collector);
  }

  async onLoopFrame(context) {
    const task = this.createTask(context);
    const { interaction } = context;

    context.timeAuditor.start();

    await this.updateMessageInterface(context);
    const answer = await interaction.channel.awaitMessage({
      user: interaction.user,
      time: this.TIME_FOR_RESPONSE_ON_TASK,
    });

    answer && (context.lastAnswer = answer);

    context.auditor.push({
      count: this.justCalculateStickCount(task, context),
      task,
      timeResult: context.timeAuditor.getDifference(),
    });

    if (!answer) {
      return this.end(context);
    }

    const answerValue = this.parseUserInput(context);

    task.userInput = answerValue;

    if (this.checkUserInput(context, answerValue) === false) {
      interaction.channel.msg({
        reference: answer.id,
        content: this.generateTextContentOnFail(context),
      });

      return this.end(context);
    }

    interaction.user.action(Actions.anonTaskResolve, {
      task,
      primary: context,
    });

    setTimeout(() => answer.delete(), 9_000);
    task.isResolved = true;
    context.userScore += this.calculateScore(context);

    this.increaseAverageSticksCount(context);
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

  processMonkeyPaschal(context) {
    if (context.auditor.length < 10) {
      return;
    }

    const MONKEY_TO_SPACE =
      "https://media.discordapp.net/attachments/629546680840093696/1166087241932755138/monkeytospace.png?ex=6549365f&is=6536c15f&hm=c17fde1d51c7d9323deeddaaf6d1cd74af723b05d47144122ac49766a5a05691&=";
    const MONKEY_HAPPY =
      "https://media.discordapp.net/attachments/629546680840093696/1166087575098892288/IMG_20230808_151010.jpg?ex=654936ae&is=6536c1ae&hm=1ec0785014ab36c96deead92bbe572d090d4cfa3066e2c6e7372be33379d7154&=&width=876&height=657";

    const url = random(20) ? MONKEY_TO_SPACE : MONKEY_HAPPY;
    context.interaction.channel.msg({ content: url });
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
}

export default Command;
