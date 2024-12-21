import { MINUTE } from "#constants/time.js";
import { EventEmitter } from "#src/EventEmitter/export.js";
import { ROMAN_NUMERALS_TABLE } from "#src/romanNumerals.js";
import { escapeRegexp, match, random, TimeAuditor } from "#src/safe-utils.js";
import { Actions } from "#src/user/actions/ActionManager.js";
import { getRandomElementFromArray } from "@zoodogood/utils/objectives";

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

class TaskGenerator {
	task = new Task();
	constructor(context) {
		this.context = context;
	}
	collect() {
		return this.task;
	}
	defaults() {
		this.mode();
		this.stroke();
		return this;
	}

	mode() {
		return getRandomElementFromArray(Object.values(ModesEnum), {
			associatedWeights: Object.values(ModesData).map(({ weights }) => weights),
		});
	}

	stroke() {
		const { averageSticksCount: average } = this.context;
		const { mode } = this.task;

		const separator =
			mode === ModesEnum.NoComma || mode === ModesEnum.NoCommaSafe ? "" : ",";

		const count = random(average / 1.2, average * 1.2);
		const stroke = [
			...this.task.stickSymbol().repeat(count),
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

		const isBitsMode = mode === ModesEnum.BitsOperations;
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
}
class Task {
	#calculated_result = null;
	data = null;
	isResolved = false;
	mode;
	userInput = null;
	request_recalculate() {
		this.#calculated_result = null;
	}
	stickCount() {
		const stroke =
			this.mode === ModesEnum.ExpressionsInstead
				? this.userInput
				: this.data.expression;

		if (!stroke) {
			return 0;
		}

		let count = 0;
		const stick = this.stickSymbol();

		for (const symbol of stroke) {
			symbol === stick && count++;
		}

		return count;
	}
	stickSymbol() {
		return this.mode === ModesEnum.BitsOperations ? "\\" : "|";
	}
	get result() {
		return (this.#calculated_result ||= (() => {
			switch (this.mode) {
				case ModesEnum.ExpressionsInstead:
					return true;
				default:
					return calculateResult(task.data.expression, context);
			}
		})());
	}
}

export class AnonGame {
	auditor = [];
	averageSticksCount = /* START_AVERAGE */ 3;
	/**
	 * @type {Task}
	 */
	currentTask;
	emitter = new EventEmitter();
	EXPERIENCE_FOR_STICK = 0.3;
	isEnd = false;
	TIME_FOR_RESPONSE_ON_TASK = MINUTE * 10;
	timeAuditor = new TimeAuditor();
	userScore = 0;

	checkUserInput(context, value) {
		const { currentTask } = this;
		switch (currentTask.mode) {
			case ModesEnum.ExpressionsInstead:
				if (value.match(/\d/)) {
					context.interaction.channel.msg({
						content:
							"Использованы числа: дополнительная награда не будет получена на самом деле",
						delete: 8_000,
					});
				}
				return this.calculateResult(value, context) === currentTask.data.value;
			default:
				return currentTask.result === +value;
		}
	}

	async onLoopFrame(context) {
		const task = new TaskGenerator(context).collect();
		this.currentTask = task;
		const { interaction } = context;

		context.timeAuditor.bump();

		await this.updateMessageInterface(context);
		const answer = await interaction.channel.awaitMessage({
			user: interaction.user,
			time: this.TIME_FOR_RESPONSE_ON_TASK,
		});

		answer && (context.lastAnswer = answer);

		context.auditor.push({
			count: task.stickCount(),
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
		context.userScore += this.score(context);

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

	reward(context) {
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

	score() {
		const { currentTask } = this;

		const isExpressionInstead =
			currentTask.mode === ModesEnum.ExpressionsInstead;
		return isExpressionInstead
			? this.evaluateExpressionBrevity(currentTask.userInput)
			: currentTask.stickCount();
	}
}
