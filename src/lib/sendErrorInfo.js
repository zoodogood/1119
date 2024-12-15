import { HOUR } from "#constants/globals/time.js";
import { ErrorData } from "#lib/ErrorsHandler/ErrorsHandler.js";
import { resolveGithubPath } from "#lib/util.js";
import { ButtonStyle, ComponentType } from "discord-api-types/v10";
import Path from "node:path";

class ErrorMomentNotification {
	static components = {
		getErrorInfo({ interaction, context }) {
			const { stack } = context;
			interaction.msg({
				ephemeral: true,
				content: `\`\`\`js\n${stack}\`\`\``,
			});
		},
		async callBugCommand({ interaction, context }) {
			interaction.extend = {
				error_moment_context: context,
			};

			const { default: CommandsManager } = await import(
				"#lib/modules/CommandsManager.js"
			);

			CommandsManager.callMap.get("bug").onChatInput(null, interaction);
		},
	};

	static onComponent({ interaction, context }) {
		this.components[interaction.customId].call(this, {
			interaction,
			context,
		});
	}

	static async sendErrorInfo({
		channel,
		error,
		interaction = {},
		primary = null,
		description = "",
	}) {
		const parsedStack =
			ErrorData.prototype.parseErrorStack.call(
				{ error },
				{ node_modules: false },
			) ?? {};

		const { fileOfError, strokeOfError } = parsedStack;
		let { stack } = parsedStack;

		if (stack?.length >= 1900) {
			stack = stack.slice(0, 1900);
		}

		const components = [
			{
				type: ComponentType.Button,
				style: ButtonStyle.Secondary,
				label: "Получить отчёт",
				customId: "getErrorInfo",
				emoji: "〽️",
			},
			{
				type: ComponentType.Button,
				style: ButtonStyle.Link,
				label: "В Github",
				url: resolveGithubPath(
					Path.relative(process.cwd(), fileOfError ?? "."),
					strokeOfError,
				),
				disabled: !fileOfError,
			},
			{
				type: ComponentType.Button,
				style: ButtonStyle.Success,
				label: "Описать случай",
				customId: "callBugCommand",
			},
		];
		const embed = {
			title: "— Данные об панике 🙄",
			description: `> ${error.message}\n\n${description}`,
			color: "#d8bb40",
			components,
			reference: interaction.message?.id ?? null,
		};

		const message = await channel.msg(embed);

		const context = {
			error,
			stack,
			interaction,
			channel,
			description,
			primary,
		};

		const collector = message.createMessageComponentCollector({
			time: HOUR,
		});
		collector.on("collect", async (interaction) =>
			this.onComponent({ interaction, context }),
		);
		collector.on("end", () => message.edit({ components: [] }));
		return { context, message };
	}
}

function sendErrorInfo(...params) {
	return ErrorMomentNotification.sendErrorInfo(...params);
}

export { ErrorMomentNotification, sendErrorInfo };
