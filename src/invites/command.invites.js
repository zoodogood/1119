import { BaseCommand } from "#src/commands/BaseCommand/BaseCommand.js";
import { awaitUserAccept } from "#src/discord/utils.js";
import { ending } from "@zoodogood/utils/primitives";

class Command extends BaseCommand {
	options = {
		name: "invites",
		id: 56,
		media: {
			description:
				'Присвойте ссылкам их уникальную роль. Как это работает?\nВы как администратор создаете роль, назовём её \\"Фунтик\\" и решаете, какие пользователи будут получать её при входе на сервер. Есть несколько типов стратегий, которые это определяют, они указаны в порядке приоритета и их может быть несколько.',
			example: `!invites #без аргументов`,
		},
		accessibility: {
			publicized_on_level: 7,
		},
		alias: "приглашения запрошення",
		allowDM: true,
		type: "guild",
	};

	async onChatInput(msg, interaction) {
		if (interaction.mention) {
			const member = msg.guild.members.resolve(interaction.mention);

			const getGuildMemberInvites = async (member) => {
				const guild = member.guild;
				const invites = await guild.invites.fetch();

				if (!invites) {
					return null;
				}

				return invites.filter(({ inviter }) => inviter === member.user);
			};

			const invitesCount = member.user.data.invites || 0;

			const byInvitesCountContent = `За время пребывания бота на сервере, упомянутый пользователь пригласил ${ending(
				invitesCount,
				"человек",
				"",
				"",
				"а",
			)}.`;

			const guildInvites = await getGuildMemberInvites(member);
			const byGuildDataContent =
				guildInvites && guildInvites.size
					? `${member.displayName} создал(-a) ${ending(
							guildInvites.size,
							"",
							"ссыллок-приглашений",
							"ссылку-приглашение",
							"ссылки-приглашения",
						)} — посетило ${ending(
							guildInvites.reduce((acc, invite) => (invite.uses || 0) + acc, 0),
							"персон",
							"",
							"а",
							"ы",
						)} <:treeJoke:827441080492490752>`
					: "";

			const description = `${byInvitesCountContent}\n${byGuildDataContent}`;
			const footer = {
				iconURL: member.user.avatarURL(),
				text: member.username,
			};

			msg.msg({ footer, description });
			return;
		}

		const answer = await awaitUserAccept({
			name: "invites_command",
			message: {
				title: "Присвойте ссылкам их уникальную роль",
				description:
					'Как это работает?\nВы как администратор создаете роль, назовём её "Фунтик" и решаете, какие пользователи будут получать её при входе в систему. Есть несколько типов стратегий:\n\n1) В режиме постоянной ссылки: Всем зашедшим через эту ссылку будет выдана роль Фунтик.\n2) Выдаваемая роль будет определяться наличием у пригласившего другой роли, например, "Хороший друг". Любая ссылка созданная Хорошим другом предвкушает Фунтика \n3) По умолчанию — если не отработал ни один вариант выше.\n\nЗачем это?\nВы можете определить права участника в зависимости от того, кто его пригласил; ведение статистики, распределение людей которые пришли с партнёрки и по знакомству, тому подобное. Это то, что вы можете сделать с помощью этой команды',
			},
			channel: msg.channel,
			userData: interaction.userData,
		});
		if (!answer) return;

		const numericReactions = ["1️⃣", "2️⃣", "3️⃣"];

		const rulesList = (msg.guild.data.inviteRules ||= []);
		const getListDescription = (list) => {
			if (list.length === 0) {
				return "Отсуствуют";
			}

			const main = list
				.map(({ type, roleId }) => `${numericReactions.at(type)} <@&${roleId}>`)
				.join("\n");

			return `🔧\n${main}`;
		};

		const embed = {
			title: "Присвойте ссылкам их уникальную роль",
			description: `Пожалуйста, выберите тип условия:\n\n1) Роль будут получать те, кто перешёл по конкретной ссылке.\n2) Выдавать роль тем, кого пригласил участник сервера имеющий далее указанную роль (Пригласил — участник создал ссылку-приглашение через которую пользователь попал на сервер) \n3) Будет выдана всем, кто не получил никакой роли с предыдущих пунктов (по умолчанию)\n\nТекущие настройки: ${getListDescription(
				rulesList,
			)}`,
			footer: {
				text: "Орифлейм. Стоп-контроль",
			},
		};
		const message = await msg.msg(embed);
		embed.edit = true;

		const reactions = [...numericReactions, rulesList.length ? "🔧" : null];
		const react = await message.awaitReact(
			{ user: msg.author, removeType: "all" },
			...reactions,
		);

		if (!react) {
			message.delete();
			return;
		}

		// TODO:
		if (reaction === "🔧") {
		}

		// TODO:
		if (numberReactions.include(reaction)) {
			const type = numberReactions.indexOf(reaction);
			embed.description = `**Тип:** ${
				[
					"конкретная ссылка",
					"наличие роли у пригласившего",
					"выдача по умолчанию",
				][type]
			};\n\nОтлично, `;
		}
	}
}

export default Command;
