import { BaseContext } from "#src/app/BaseContext/BaseContext.js";
import { BaseCommand } from "#src/commands/BaseCommand/BaseCommand.js";

import { createDefaultPreventable } from "#src/createDefaultPreventable.js";
import { PropertiesEnum } from "#src/data/Properties.js";
import { addResource } from "#src/data/public/addResource.js";
import { PermissionsBits } from "#src/discord/permissions.js";
import {
	awaitUserAccept,
	take_missing_permissions,
	takeInteractionProperties,
} from "#src/discord/utils.js";
import { Emoji } from "#src/emojis/emojis.js";
import { numberFormat, NumberFormatLetterize } from "#src/safe-utils.js";
import { ActionsMap } from "#src/user/actions/actionsMap.enum.js";
import { ending } from "@zoodogood/utils/primitives";
import { DAILY_REVENUE_PER_MEMBER } from "./contants.js";

class ProfessionsUtils {
	static createReports({ guild, professions }) {
		let expenditure = 0;
		const salaryTable = {};
		const record = (member, professionId, salary) => {
			expenditure += salary;
			salaryTable[member.id] ||= 0;
			salaryTable[member.id] += salary;
		};

		for (const member of guild.members.cache.values())
			for (const [professionId, salary] of Object.entries(professions)) {
				member.roles.cache.has(professionId) &&
					record(member, professionId, salary);
			}

		return { expenditure, salaryTable };
	}

	static removeUnavailableProfessions({ guild, professions }) {
		if (!professions) {
			return null;
		}
		for (const id of Object.keys(professions)) {
			!guild.roles.cache.get(id) && delete professions[id];
		}

		return professions;
	}
}

class Command extends BaseCommand {
	options = {
		name: "bank",
		id: 50,
		media: {
			description:
				"Во-первых, банк позволяет не смешивать приключения с обязанностями, а во-вторых, это просто удобно.\nТакже с их помощью вы можете создать на сервере профессии с автоматически выдаваемыми зарплатами!",
			examople: `!bank <"взять" | "положить"> <coins | "+"> #"+" обозначает "Все коины, которые у вас есть"`,
			poster:
				"https://cdn.discordapp.com/attachments/769566192846635010/872463081672949890/bank.gif",
		},
		accessibility: {
			publicized_on_level: 2,
		},
		alias: "cash банк казна скарбниця",
		allowDM: true,
		cooldown: 50_000,
		cooldownTry: 3,
		type: "guild",
	};

	async displayMessageInterface(context) {
		const { guildData, isAdmin, interaction } = context;
		const { guild } = interaction;

		const embed = {
			title: "Казна сервера",
			description: `В хранилище **${NumberFormatLetterize(
				guildData.coins,
			)}** <:coin:637533074879414272>\n\n<a:message:794632668137652225> ⠿ Заработные платы\n<:meow:637290387655884800> ⠿ Положить\n<:merunna:755844134677512273> ${[
				..."⠯⠷⠟⠻",
			].random()} Взять`,
			author: {
				name: guild.name,
				iconURL: guild.iconURL(),
			},
			image:
				"https://media.discordapp.net/attachments/629546680840093696/830774000597991434/96-967226_tree-forest-green-vector-map-of-the-trees.png",
		};

		const startsCoinsCount = guildData.coins;
		let react;
		const reactions = [
			"637290387655884800",
			isAdmin ? "755844134677512273" : null,
			"794632668137652225",
		];
		let message = await interaction.channel.msg(embed);
		embed.edit = true;

		while (true) {
			message = await message.msg(embed);
			react = await message.awaitReact(
				{ user: interaction.user, removeType: "all" },
				...reactions,
			);

			await this.onReaction({ react, embed, message }, context);
			if (context.isEnd) {
				return;
			}

			embed.description += `\n\nВ хранилище: ${ending(
				guildData.coins,
				"золот",
				"ых",
				"ая",
				"ых",
				{
					unite: (value, end) => `${numberFormat(value)} ${end}`,
				},
			)}!\nКоличество коинов ${
				guildData.coins - startsCoinsCount === 0
					? "не изменилось"
					: guildData.coins - startsCoinsCount > 0
						? "увеличилось на " + (guildData.coins - startsCoinsCount)
						: "уменьшилось на " + (startsCoinsCount - guildData.coins)
			} <:coin:637533074879414272>`;
		}
	}

	getContext(interaction) {
		const guildData = interaction.guild.data;

		const isAdmin = !take_missing_permissions(
			interaction.member,
			PermissionsBits.ManageGuild,
		)[0];

		const context = {
			parsedParams: {
				action: null,
				coins: null,
				cause: null,
			},
			interaction,
			guildData,
			isAdmin,
		};
		if (interaction.params) {
			const target = context.parsedParams;
			target.action = interaction.params.split(" ")[0];
			target.coins = interaction.params.split(" ")[1];
			target.cause = interaction.params.split(" ").slice(2).join(" ");
		}

		return context;
	}
	async interactWithBank(context, { value, isPut, cause }) {
		const { guildData, interaction, isAdmin } = context;
		const { user, channel, guild } = interaction;

		if (value === "+") {
			value = isPut ? interaction.userData.coins : guildData.coins;
		}
		value = Math.max(Math.floor(value), 0);

		if (isNaN(value)) {
			return interaction.channel.msg({
				title: "Указана строка вместо числа",
				color: "#ff0000",
				delete: 5000,
			});
		}

		if (value === 0) {
			channel.msg({
				title: "Невозможно положить/взять 0 коинов",
				color: "#ff0000",
				delete: 5000,
			});
			return;
		}

		if (isPut) {
			const heAccpet = await awaitUserAccept({
				name: "bank_put",
				message: {
					title: "Вы точно хотите это сделать?",
					description:
						"<a:message:794632668137652225> Отправленненные в общую казну коины более не будут предналежать вам, и вы не сможете ими свободно распоряжаться.\nПродолжить?",
				},
				channel,
				userData: interaction.userData,
			});
			if (!heAccpet) return;

			if (interaction.userData.coins < value) {
				channel.msg({
					title: "Образовались проблемки..",
					description: "Недостаточно коинов",
					color: "#ff0000",
					delete: 7000,
				});
				return;
			}

			const _context = new BaseContext(`comamnd.bank.interacted`, {
				primary: context,
				...takeInteractionProperties(context),
				value,
				cause,
				isPut,
				...createDefaultPreventable(),
			});

			user.action(ActionsMap.beforeBankInteracted, _context);
			if (_context.defaultPrevented()) {
				channel.msg({
					description:
						"Взаимодействие с банком заблокированно внешним эффектом",
				});
				return;
			}

			addResource({
				user,
				value: -value,
				executor: user,
				source: "command.bank.interacted",
				resource: PropertiesEnum.coins,
				context,
			});
			guildData.coins += value;

			sendToLogsChannel(guild, {
				title: "Содержимое банка изменено:",
				description: `${interaction.member.displayName} отнёс в казну ${ending(
					value,
					"коин",
					"ов",
					"",
					"а",
					{
						unite: (value, end) => `${numberFormat(value)} ${end}`,
					},
				)}`,
				footer: {
					iconURL: interaction.user.avatarURL(),
					text: interaction.user.tag,
				},
			});
			interaction.message.react("👌");
			interaction.channel.msg({
				title: `Вы успешно вложили **${ending(value, "коин", "ов", "", "а", {
					unite: (value, end) => `${numberFormat(value)} ${end}`,
				})}** на развитие сервера`,
				delete: 5000,
			});
			return;
		}

		if (!isPut) {
			const heAccpet = await awaitUserAccept({
				name: "bank",
				message: {
					title: "Осторожно, ответственность!",
					description:
						"<a:message:794632668137652225> Не важно как сюда попадают коины, главное — они предналежат пользователям этого сервера\nРаспоряжайтесь ими с пользой, умом.",
				},
				channel,
				userData: interaction.userData,
			});
			if (!heAccpet) return;
			const problems = [];

			if (!isAdmin)
				problems.push(
					'Для использования содержимого казны требуется право "Управление сервером"',
				);
			if (guildData.coins < value)
				problems.push(
					`Похоже, тут пусто. В хранилище лишь ${ending(
						guildData.coins,
						"коин",
						"ов",
						"",
						"а",
						{
							unite: (value, end) => `${numberFormat(value)} ${end}`,
						},
					)}.`,
				);
			if (!cause)
				problems.push(
					`Вы должны указать причину использования ${ending(
						value,
						"коин",
						"ов",
						"а",
						"ов",
						{
							unite: (value, end) => `${numberFormat(value)} ${end}`,
						},
					)}.`,
				);
			if (!cause || !cause.match(/.{2,}\s+?.{2,}/i))
				problems.push(`Причина обязана содержать минимум 2 слова.`);

			if (problems[0]) {
				interaction.channel.msg({
					title: "Образовались проблемки..",
					description: problems.join("\n"),
					color: "#ff0000",
					delete: 7000,
				});
				return;
			}

			addResource({
				user,
				value,
				executor: user,
				source: "command.bank.interacted",
				resource: PropertiesEnum.coins,
				context,
			});
			guildData.coins -= value;

			sendToLogsChannel(guild, {
				title: "Содержимое банка изменено:",
				description: `${
					interaction.member.displayName
				} обналичил казну на сумму **${ending(value, "коин", "ов", "а", "ов", {
					unite: (value, end) => `${numberFormat(value)} ${end}`,
				})}**\nПричина: ${cause}`,
				footer: {
					iconURL: interaction.user.avatarURL(),
					text: interaction.user.tag,
				},
			});
			interaction.message.react("👌");
			const title = `Вы успешно взяли **${ending(
				value,
				"коин",
				"ов",
				"а",
				"ов",
				{
					unite: (value, end) => `${numberFormat(value)} ${end}`,
				},
			)}** из казны сервера\nПо причине: ${cause}`;
			interaction.channel.msg({ title, delete: 5000 });
			return;
		}
	}

	async onChatInput(msg, interaction) {
		const context = this.getContext(interaction);

		if (context.parsedParams) {
			const { action, coins, cause } = context.parsedParams;
			if (action === "положить" || action === "put") {
				await this.interactWithBank(context, {
					value: coins,
					isPut: true,
					cause,
				});
				return;
			}

			if (action === "взять" || action === "take") {
				await this.interactWithBank(context, {
					value: coins,
					isPut: false,
					cause,
				});
				return;
			}
		}

		await this.displayMessageInterface(context);
	}

	onDayStats(guild, context) {
		const { professions } = guild.data;
		ProfessionsUtils.removeUnavailableProfessions({ guild, professions });

		const entries = Object.entries(professions ?? {});
		if (!entries.length) {
			delete guild.data.professions;
			return;
		}

		const { expenditure, salaryTable } = ProfessionsUtils.createReports({
			guild,
			professions,
		});

		if (guild.data.coins < expenditure) {
			sendToLogsChannel(guild, {
				title: `Сегодня не были выданы зарплаты`,
				description: `В казне сервера слишком мало коинов, лишь ${guild.data.coins}, в то время как на выплаты требуется ${expenditure} <:coin:637533074879414272>`,
				color: "#ffff00",
			});
			return;
		}

		for (const [userId, salary] of Object.entries(salaryTable)) {
			const user = guild.members.cache.get(userId).user;
			addResource({
				user,
				value: salary,
				executor: null,
				source: "command.bank.salary",
				resource: PropertiesEnum.coins,
				context: {
					primary: context,
					...context,
					guild,
					expenditure,
					salaryTable,
				},
			});
		}

		guild.data.coins -= expenditure;
		sendToLogsChannel(guild, {
			title: `Были выданы зарплаты`,
			description: `С казны было автоматически списано ${ending(
				expenditure,
				"коин",
				"ов",
				"",
				"а",
				{
					unite: (value, end) => `${NumberFormatLetterize(value)} ${end}`,
				},
			)} на заработные платы пользователям\nИх список вы можете просмотреть в команде \`!банк\`\nУчастников получило коины: ${
				Object.keys(salaryTable).length
			}`,
		});
	}

	async onReaction(data, context) {
		const { interaction, isAdmin } = context;
		const { guild, user } = interaction;

		switch (data.react) {
			case "637290387655884800":
				data.questionMessage = await interaction.channel.msg({
					title: "Укажите сумму коинов, которую хотите внести в казну",
				});
				data.answer = await interaction.channel.awaitMessage({
					user,
				});
				data.questionMessage.delete();
				if (!data.answer) {
					break;
				}

				data.cause = data.answer.content
					.replace(/\d+|\+/, (number) => {
						data.value = number;
						return "";
					})
					.trim();

				await this.interactWithBank(context, {
					value: data.value,
					isPut: true,
					cause: data.cause,
				});
				data.embed.description = `В казну внесли коины`;
				break;
			case "755844134677512273":
				data.questionMessage = await interaction.channel.msg({
					title:
						"Укажите сумму коинов. А также причину их извлечения из общей казны.",
				});
				data.answer = await interaction.channel.awaitMessage({
					user,
				});
				data.questionMessage.delete();
				if (!data.answer) {
					break;
				}

				data.cause = data.answer.content
					.replace(/\d+|\+/, (number) => {
						data.value = number;
						return "";
					})
					.trim();

				await this.interactWithBank(context, {
					value: data.value,
					isPut: false,
					cause: data.cause,
				});
				data.embed.description = `Из казны извлекли коины`;
				break;
			case "794632668137652225":
				data.professions =
					guild.data.professions || (guild.data.professions = {});

				data.workersList = [];
				data.report = { expenditure: 0, salaryTable: {} };

				data.workersContent =
					"<a:message:794632668137652225> Здесь пока пусто, также тут может быть ваша реклама";

				if (Object.keys(data.professions).length) {
					ProfessionsUtils.removeUnavailableProfessions({
						guild,
						professions: data.professions,
					});

					data.report = ProfessionsUtils.createReports({
						guild,
						professions: data.professions,
					});

					data.members = Object.keys(data.report.salaryTable).map((userId) =>
						guild.members.cache.get(userId),
					);

					data.workersList = Object.entries(data.professions).map(
						([professionId, salary]) => {
							const getFromThisProfession = [...data.members].filter((member) =>
								member.roles.cache.has(professionId),
							).length;

							return `${guild.roles.cache.get(
								professionId,
							)}\n${salary} <:coin:637533074879414272> в день (${ending(
								getFromThisProfession,
								"Пользовател",
								"ей",
								"ь",
								"я",
							)})`;
						},
					);
					data.workersContent = data.workersList
						.filter((line) => line)
						.join("\n");
				}

				data.professionManager = await interaction.channel.msg({
					title: "- Работы сервера",
					description: `**Созданные профессии ${
						Object.keys(data.professions).length
					}/20**\n${data.workersContent}\n\n\`\`\`Доходы: ${
						guild.memberCount * DAILY_REVENUE_PER_MEMBER
					}\nРасходы: ${data.report.expenditure}\n${ending(
						Object.keys(data.report.salaryTable).length,
						"пользовател",
						"ей",
						"ь",
						"я",
					)} получает зарплату\`\`\``,
					footer: {
						text: "Используйте реакции, чтобы создать, удалить профессию или закрыть это окно.",
					},
				});
				while (true) {
					data.react = await data.professionManager.awaitReact(
						{ user: interaction.user, removeType: "all" },
						isAdmin ? "✅" : null,
						isAdmin && Object.keys(data.professions).length ? "❎" : null,
						"❌",
					);
					data.embed.description = `<a:message:794632668137652225> Без изменений`;
					if (data.react === "✅") {
						if (Object.keys(data.professions).length >= 20) {
							interaction.channel.msg({
								title: `Лимит 20 профессий`,
								delete: 9_500,
								color: "#ff0000",
							});
							continue;
						}

						data.questionMessage = await interaction.channel.msg({
							title:
								"Укажите айди роли, а также количество коинов, выдаваемое ежедневно",
						});
						data.answer = await interaction.channel.awaitMessage({
							user: interaction.user,
						});

						data.questionMessage.delete();
						if (!data.answer) {
							data.professionManager.delete();
							return;
						}
						data.answer = data.answer.content.split(" ");
						const [id, salary] = data.answer;

						const role = guild.roles.cache.get(id);
						if (!role) {
							interaction.channel.msg({
								title: `Не удалось найти роль с айди ${id}`,
								delete: 4500,
								color: "#ff0000",
							});
							continue;
						}
						if (isNaN(salary) || +salary === 0) {
							interaction.channel.msg({
								title: `Не указано выдаваемое количество коинов`,
								delete: 4500,
								color: "#ff0000",
							});
							continue;
						}
						guild.data.professions[data.answer[0]] = Math.max(
							Math.floor(data.answer[1]),
							1,
						);
						data.embed.description = `<a:message:794632668137652225> Вы успешно создали новую профессию!\n(${role} ${data.answer[1]} <:coin:637533074879414272>)`;
						sendToLogsChannel(guild, {
							title: "Назначено создать профессию",
							description: `${user.toString()}, профессия ${role.toString()} (${salary} ${Emoji.coins.toString()}) была создана`,
						});
					}

					if (data.react === "❎") {
						data.questionMessage = await interaction.channel.msg({
							title: "Укажите айди ролей профессий, для их удаления",
						});
						data.answer = await interaction.channel.awaitMessage({
							user: interaction.user,
						});
						data.questionMessage.delete();

						if (!data.answer) {
							data.professionManager.delete();
							return;
						}
						const values = data.answer.content.split(" ");
						for (const id of values) {
							if (id in data.professions) {
								const salary = data.professions[id];
								delete data.professions[id];
								const role = guild.roles.cache.get(id);
								data.embed.description = `<a:message:794632668137652225> Вы успешно удалили профессию! ${role.toString()}`;
								sendToLogsChannel(guild, {
									title: "Назначено удалить профессию",
									description: `${user.toString()}, профессия ${role.toString()} (${salary} ${Emoji.coins.toString()}) была удалена`,
								});
							} else {
								interaction.channel.msg({
									title: `Не удалось найти роль с айди ${id} для удаления связанной с ней профессии`,
									delete: 4500,
									color: "#ff0000",
								});
							}
						}
					}
					break;
				}

				data.professionManager.delete();
				break;
			default:
				context.isEnd = true;
				return data.message.delete();
		}
	}
}

export default Command;
