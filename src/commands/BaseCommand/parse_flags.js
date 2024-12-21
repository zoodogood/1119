// eslint-disable-next-line no-unused-vars
import { BaseCommand } from "#src/commands/BaseCommand/BaseCommand.js";
// eslint-disable-next-line no-unused-vars
import { BaseCommandRunContext } from "#src/commands/CommandRunContext.js";
import { CliParser } from "@zoodogood/utils/CliParser";

/**
 *
 * @param {string[]} capture
 * @param {string} description
 * @param {Pick<import("#src/commands/BaseCommand/BaseCommand.js").BaseFlag, 'effect' | 'finalize' | 'expectValue'>} addable
 * @returns
 */
export function flag(
	capture,
	description,
	{ expectValue, effect, finalize } = {},
) {
	return {
		name: capture[0],
		capture,
		description,
		effect,
		finalize,
		expectValue,
	};
}

/**
 *
 * @param {{}[]} flags
 * @param {BaseCommandRunContext} context
 */
export async function process_flags(context) {
	const command_flags = context.command.options.cliParser.flags;
	const [parsed, values] = context.cliParsed || [];
	if (!parsed) {
		return;
	}
	const flags = command_flags
		.filter((flag) => {
			const { name } = flag;
			return !!parsed.captures.get(name);
		})
		.map((flag) => {
			const { name } = flag;
			return {
				...flag,
				value: values.get(name),
				capture: parsed.captures.get(name),
			};
		});

	await Promise.all(
		flags.map((flag) => flag.effect?.(context, flag.value, flag)),
	);
	for (const flag of flags) {
		const is_exit_signal =
			(await flag.finalize?.(context, flag.value, flag)) === true;
		if (is_exit_signal) {
			return true;
		}
	}
	return false;
}

/**
 *
 * @param {BaseCommand} command
 * @param {BaseCommandRunContext} context
 */
export function cli_parser_parse_flags(command, context) {
	if (!context.interaction.params) {
		return;
	}
	const flags = command.options.cliParser.flags;

	const parser = new CliParser();
	const parsed = parser
		.setText(context.interaction.params)
		.processBrackets()
		.captureFlags(flags)
		.captureResidueFlags()
		.collect();

	const values = parsed.resolveValues((capture) => {
		if (!capture) {
			return;
		}

		if (!capture.isFlagMatchArray()) {
			return capture.toString();
		}
		const value = capture.valueOfFlag();
		const { flag, separator } = capture.content.groups;
		return { flag, value, separator };
	});

	context.setCliParsed(parsed, values);
	return context.cliParsed;
}

export function flag_value(context, flag) {
	return context.cliParsed?.at(1).get(flag);
}
