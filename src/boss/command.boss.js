import config from "#config";
import { DAY, SECOND } from "#constants/time.js";

import {
	core_make_attack_context,
	make_attack_with_events,
} from "#src/boss/attack.js";
import { resolve_attack_events_pull } from "#src/boss/attack_events.js";
import { BossEffects, BossManager } from "#src/boss/BossManager.js";
import client from "#src/bot/client/singleton.js";
import {
	BaseCommand,
	BaseFlagSubcommand,
} from "#src/commands/BaseCommand/BaseCommand.js";
import { BaseCommandRunContext } from "#src/commands/CommandRunContext.js";
import { CurseManager } from "#src/curses/CurseManager/singleton/index.js";
import { sortByResolve } from "#src/mini.js";
import {
	toDayDate,
	toFixedAfterZero,
	toLocaleDeveloperString,
} from "#src/safe-utils.js";
import { justButtonComponents } from "@zoodogood/utils/discordjs";
import { CliParser } from "@zoodogood/utils/primitives";
import { ButtonStyle, ComponentType } from "discord.js";

function attackBoss(boss, user, channel) {
	return BossManager.userAttack({ boss, user, channel });
}

function createShop(guild, user, channel) {
	return BossManager.BossShop.createShop({
		channel: channel,
		user,
		guild: guild,
	});
}

export class Bosses_Flagsubcommand {
	constructor(context) {
		this.context = context;
	}
	static guildToField(guild) {
		const { boss, partners } = guild.data;
		const isArrived = boss.isArrived;
		const { name } = guild;
		const contents = {
			endsAt: boss.endingAtDay ? toDayDate(boss.endingAtDay * DAY) : "Никогда",
			partnersIcon: partners?.isSetted ? "👋" : "",
		};
		const value = isArrived
			? `Пришёл (${boss.level} ур.), уйдет ${contents.endsAt}${contents.partnersIcon}`
			: `Придёт ${toDayDate((boss.apparanceAtDay + 1) * DAY)}`;
		return { name, value };
	}

	onProcess() {
		const { interaction } = this.context;
		const memb = interaction.mention || interaction.user;
		const { guilds } = memb;
		const fields = sortByResolve(
			guilds.filter((guild) => guild.data.boss),
			({ data: { boss } }) =>
				boss.isArrived ? Number.MIN_SAFE_INTEGER : +boss.apparanceAtDay || 0,
			{ reverse: true },
		)
			.map((guild) => Bosses_Flagsubcommand.guildToField(guild))
			.slice(0, 20);

		const { channel } = this.context;
		channel.msg({
			description: "Ваши сервера с боссом",
			fields,
		});
	}
}

class Help_Flagsubcommand {
	constructor(context) {
		this.context = context;
	}
	onProcess() {
		const { channel } = this.context;
		channel.msg({
			content:
				"Атакуйте босса, чтобы получить больше наград. В его лавке вы можете приобрести усилители, которые становятся дороже с каждой покупкой. Поэтому распоряжайтесь валютой разумно. Время от времени босс будет накладывать проклятия. Имейте ввиду, что эти самые проклятия, — козырный источник прибыли и их стоит проходить. Объединяйтесь в кланы, чтобы получать прибавку к урону и добраться до глобальной таблицы лидеров. Напоминаю, что основным эпилогом бота является открытие 20 !котлов и хорошее времяпровождение\n\n",
		});
	}
}

class Dev_Flagsubcommand extends BaseFlagSubcommand {
	onProcess() {
		const { boss, user, channel } = this.context;
		const value = this.capture?.valueOfFlag();

		if (!value) {
			channel.msg({
				description: [...BossManager.eventBases.keys()].join("\n"),
			});
			return;
		}
		make_attack_with_events({
			boss,
			user,
			channel,
			event_ids: value.split(","),
		});
	}
}

class Events_Flagsubcommand extends BaseFlagSubcommand {
	onProcess() {
		const { boss, user, channel } = this.context;
		if (!this.process_arrived()) {
			return;
		}
		const boss_context = core_make_attack_context(
			boss,
			user,
			channel,
			this.context,
		);
		const pull = resolve_attack_events_pull(boss_context);
		const weightSum = pull.reduce(
			(acc, value) => acc + (value._weight || 0),
			0,
		);
		const content = sortByResolve(pull, ({ _weight }) => _weight)
			.map(
				({ _weight, id }) =>
					`- ${id} — ${toFixedAfterZero((_weight / weightSum) * 100, 1)}%`,
			)
			.join("\n");

		channel.msg({
			title: "События, способные выпасть при атаке",
			description: content,
		});
	}
	process_arrived() {
		const { channel, boss, guild } = this.context;

		if (boss.isArrived) {
			return true;
		}

		if (!guild.data.chatChannel) {
			channel.msg({
				description: "Босс не может появится на сервере, где не установлен чат",
				delete: 12 * SECOND,
				components: justButtonComponents({
					label: "Открыть команду",
					customId: "@command/editserver/open",
				}),
			});
			return false;
		}

		if (guild.data.disabledBoss) {
			channel.msg({
				description: "Босс был вручную отключен на этом сервере",
				components: justButtonComponents({
					label: "Открыть команду",
					customId: "@command/editserver/open",
				}),
				delete: 12 * SECOND,
			});
			return false;
		}
		channel.msg({
			description: "Момент появления босса пока неизвестен",
			delete: 12 * SECOND,
		});
		return false;
	}
}

class CommandRunContext extends BaseCommandRunContext {
	boss;
	memb;
	userEffects;
	userStats;
	static async new(interaction, command) {
		const context = new this(interaction, command);
		const memb = interaction.mention ?? interaction.user;
		const boss = interaction.guild.data.boss ?? {};
		Object.assign(context, { memb, boss });
		return context;
	}

	parseCli(params) {
		const parsed = new CliParser()
			.setText(params)
			.processBrackets()
			.captureFlags(this.command.options.cliParser.flags)
			.collect();

		const values = parsed.resolveValues((capture) => capture?.toString());
		this.setCliParsed(parsed, values);
	}
}

class Command extends BaseCommand {
	options = {
		name: "boss",
		id: 59,
		media: {
			description:
				"Босс страшен. Победите его вместе или проиграйте по-одиночке. Он появляется один раз месяц и уходит спустя три дня.",
			example: "!boss <member>",
		},
		cliParser: {
			flags: [
				{
					name: "--help",
					capture: ["--help", "-h"],
					description: "Для чего босс приходит и что с ним делать",
				},
				{
					name: "--attack",
					capture: ["--attack", "-a"],
					description: "Незамедлительно проведите атаку",
				},
				{
					name: "--shop",
					capture: ["--shop", "-s"],
					description: "Незамедлительно открывает лавку босса",
				},
				{
					name: "--bosses",
					capture: ["--bosses"],
					description:
						"Показывает перечень серверов, где вы находитесь, с активными или предшествующими боссами",
				},
				{
					name: "--events",
					capture: ["--events"],
					description: "Отображает события, способные вам попасться",
				},
				{
					name: "--dev",
					capture: ["--dev"],
					description: "Для разработчиков",
					expectValue: true,
					hidden: true,
				},
			],
		},
		accessibility: {
			publicized_on_level: 7,
		},
		alias: "босс бос",
		allowDM: true,
		type: "other",
	};

	createEmbed({ userEffects, userStats, memb, boss }) {
		const currentHealthPointPercent =
			1 - boss.damageTaken / boss.healthThresholder;

		const toFixed = Math.ceil(boss.level / 30);

		const contents = {
			currentHealth: BossManager.isElite(boss)
				? Math.max(currentHealthPointPercent * 100, 0.1).toFixed(toFixed)
				: Math.ceil(currentHealthPointPercent * 100),

			leaveDay: `Уйдет ${
				boss.endingAtDay ? toDayDate(boss.endingAtDay * DAY) : "Никогда"
			}`,
			level: `Уровень: ${boss.level}.`,
		};

		const description = `${contents.level}\n${contents.leaveDay}\n\nПроцент здоровья: ${contents.currentHealth}%`;
		const fields = [
			{
				name: "Пользователь",
				value: Object.entries(userStats)
					.map(([key, value]) => `${key}: ${toLocaleDeveloperString(value)}`)
					.join("\n"),
			},
			{
				name: "Эффекты:",
				value: userEffects.map(({ id }) => id).join(",\n"),

				display: userEffects && userEffects.length,
			},
		].filter((field) => "display" in field === false || field.display);

		const embed = {
			description,
			fields,
			thumbnail: boss.avatarURL,
			footer: { text: memb.tag, iconURL: memb.avatarURL() },
		};

		return embed;
	}

	async displayHeadstone({ interaction, memb, boss, userStats }) {
		const guild = interaction.guild;
		const contents = {
			level: `Уровень: ${memb.data.level}.`,
			joined: `Появился: ${new Intl.DateTimeFormat("ru-ru", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			}).format(guild.members.resolve(memb).joinedTimestamp)}`,
			heroStatus:
				"Выдуманный персонаж был искалечен и умертвлён, или просто умер. В таком состоянии методы атаки и использование реликвий заблокированны.\n",
		};

		const ritualAlreadyStartedBy = (() => {
			if (!userStats.alreadyKeepAliveRitualBy) {
				return null;
			}
			const aliver = guild.members.cache.get(
				userStats.alreadyKeepAliveRitualBy,
			);
			if (!aliver) {
				delete userStats.alreadyKeepAliveRitualBy;
				return null;
			}

			const aliverStats = BossManager.getUserStats(guild.data.boss, aliver.id);
			const aliverData = aliver.user.data;

			if (aliverStats.heroIsDead) {
				delete userStats.alreadyKeepAliveRitualBy;
				return null;
			}

			const deadlyCurseEffect = aliverData.effects?.find(
				({ id, values: { guildId } }) =>
					id === "boss.deadlyCurse" && guildId === guild.id,
			);

			if (!deadlyCurseEffect) {
				delete userStats.alreadyKeepAliveRitualBy;
				return null;
			}

			const curse = aliverData.curses?.find(
				({ timestamp }) =>
					timestamp === deadlyCurseEffect.values.targetTimestamp,
			);
			if (!curse) {
				delete userStats.alreadyKeepAliveRitualBy;
				BossEffects.removeEffect({
					effect: deadlyCurseEffect,
					user: aliver.user,
				});
				return null;
			}

			return aliver;
		})();
		const embed = {
			description: `${contents.level}\n${contents.joined}\n\n${contents.heroStatus}`,
			thumbnail:
				"https://cdn.discordapp.com/attachments/629546680840093696/1063465085235900436/stone.png",
			components: !ritualAlreadyStartedBy
				? {
						type: ComponentType.Button,
						style: ButtonStyle.Danger,
						customId: "KeepAlive",
						label: "Продлить жизнь",
					}
				: {
						type: ComponentType.Button,
						style: ButtonStyle.Secondary,
						customId: "KeepAlive",
						label: `Продлить жизнь (Уже — ${ritualAlreadyStartedBy.displayName})`,
						disabled: true,
					},

			footer: { iconURL: memb.avatarURL(), text: memb.tag },
		};
		const message = await interaction.channel.msg(embed);
		const collector = message.createMessageComponentCollector({
			time: 120_000,
		});

		collector.on("collect", async (interaction) => {
			const isAlready = BossManager.getUserStats(
				boss,
				memb.id,
			).alreadyKeepAliveRitualBy;

			if (isAlready) {
				interaction.msg({
					ephemeral: true,
					content: "Действие занято другим пользователем",
				});
				return;
			}

			const { user } = interaction;
			const userStats = BossManager.getUserStats(boss, user.id);
			if (userStats.heroIsDead) {
				interaction.msg({
					ephemeral: true,
					content:
						"Ввысь и вниз; В окно, и там будет снег. Забудь об этом — ты мертвец.",
				});
				return;
			}

			const effectId = "boss.deadlyCurse";
			const values = { keepAliveUserId: memb.id };

			const { effect } = BossEffects.applyEffect({
				guild,
				user,
				effectId,
				values,
			});
			const curseAddedMessage = await interaction.msg({
				description:
					"Примите и избавьтесь от быстродействующего проклятия. Провалите — та же участь под камнем.\n**Предостережение:** его не всегда возможно снять в срок.",
				footer: { text: user.tag, iconURL: user.avatarURL() },
				thumbnail:
					"https://media.discordapp.net/attachments/629546680840093696/1174372547941384272/skull.png?ex=65675aaa&is=6554e5aa&hm=7472e327ea98eee13d82ea8eb6035483ea655779e235628771991c40f12b7b34&=",
				fetchReply: true,
				components: [
					{
						type: ComponentType.Button,
						style: ButtonStyle.Secondary,
						emoji: "753916360802959444",
						customId: "displayCurse",
					},
				],
			});

			message.msg({ edit: true, components: [] });

			(async () => {
				const collector = curseAddedMessage.createMessageComponentCollector({
					time: 180_000,
				});

				const curse = user.data.curses.find(
					(curse) => curse.timestamp === effect.values.targetTimestamp,
				);

				collector.on("collect", (interaction) => {
					interaction.msg({
						ephemeral: true,
						content: CurseManager.interface({
							user,
							curse,
						}).toString(),
					});
				});

				collector.on("end", () => {
					curseAddedMessage.msg({ edit: true, components: [] });
				});

				return;
			})();

			collector.stop();
		});

		collector.on("end", () => message.msg({ edit: true, components: [] }));
	}

	async onChatInput(msg, interaction) {
		const context = await CommandRunContext.new(interaction, this);
		context.setWhenRunExecuted(this.run(context));
		return context;
	}

	async processAttackFlag(context) {
		const values = context.cliParsed.at(1);
		if (!values.get("--attack")) {
			return;
		}

		if (!this.processBossIsExists(context)) {
			return true;
		}

		await attackBoss(context.boss, context.user, context.channel);
		await this.processDefaultBehavior(context);
		return true;
	}

	async processBossesFlag(context) {
		const values = context.cliParsed.at(1);
		if (!values.get("--bosses")) {
			return;
		}
		await new Bosses_Flagsubcommand(context).onProcess();
		return true;
	}

	processBossIsExists(context) {
		const { guild, boss, channel } = context;
		if (!guild.data.chatChannel) {
			channel.msg({
				description: "Босс не может появится на сервере, где не установлен чат",
				delete: 12 * SECOND,
				components: justButtonComponents({
					label: "Открыть команду",
					customId: "@command/editserver/open",
				}),
			});
			return false;
		}

		if (guild.data.disabledBoss) {
			channel.msg({
				description: "Босс был вручную отключен на этом сервере",
				components: justButtonComponents({
					label: "Открыть команду",
					customId: "@command/editserver/open",
				}),
				delete: 12 * SECOND,
			});
			return false;
		}

		if (!boss.isArrived) {
			const description = boss.apparanceAtDay
				? `Прибудет лишь ${toDayDate((boss.apparanceAtDay + 1) * DAY)}`
				: "Момент появления босса пока неизвестен";

			channel.msg({ description, color: "#000000" });
			return;
		}

		return true;
	}

	async processDefaultBehavior(context) {
		const { boss, memb, channel } = context;

		if (!this.processBossIsExists(context)) {
			return;
		}

		const userStats = BossManager.getUserStats(boss, memb.id);
		const userEffects = BossEffects.effectsOf({ boss, user: memb });

		Object.assign(context, {
			userStats,
			userEffects,
		});

		if (userStats.heroIsDead) {
			this.displayHeadstone(context);
			return;
		}

		const REACTIONS = [
			{
				emoji: "⚔️",
				filter: ({ boss }) => !BossManager.isDefeated(boss),
			},
			{
				emoji: "🕋",
				filter: () => true,
			},
		];

		const embed = this.createEmbed(context);
		const reactions = REACTIONS.filter((reaction) =>
			reaction.filter(context),
		).map(({ emoji }) => emoji);

		const message = await channel.msg({ ...embed, reactions });

		const filter = (reaction, user) =>
			user.id !== client.user.id && reactions.includes(reaction.emoji.name);
		const collector = message.createReactionCollector({ filter, time: 60_000 });
		collector.on("collect", async (reaction, user) => {
			reaction.users.remove(user);

			if (reaction.emoji.name === "⚔️") {
				attackBoss(boss, user, channel);
			}

			if (reaction.emoji.name === "🕋") {
				createShop(channel.guild, user, channel);
			}

			const embed = this.createEmbed(context);
			message.msg({ ...embed, edit: true });
		});

		collector.on("end", () => message.reactions.removeAll());
	}

	async processDevFlag(context) {
		const value = context.cliParsed.at(0).captures.get("--dev");
		if (!value) {
			return;
		}
		if (!config.developers.includes(context.user.id)) {
			return;
		}
		await new Dev_Flagsubcommand(context, value).onProcess();
		return true;
	}

	async processEventsFlag(context) {
		const value = context.cliParsed.at(0).captures.get("--events");
		if (!value) {
			return;
		}
		await new Events_Flagsubcommand(context, value).onProcess();
		return true;
	}

	async processHelpFlag(context) {
		const values = context.cliParsed.at(1);
		if (!values.get("--help")) {
			return;
		}
		await new Help_Flagsubcommand(context).onProcess();
		return true;
	}

	async processShopFlag(context) {
		const values = context.cliParsed.at(1);
		if (!values.get("--shop")) {
			return;
		}

		if (!this.processBossIsExists(context)) {
			return true;
		}

		await createShop(context.guild, context.user, context.channel);
		return true;
	}

	async run(context) {
		context.parseCli(context.interaction.params);
		if (await this.processHelpFlag(context)) {
			return;
		}
		if (await this.processShopFlag(context)) {
			return;
		}
		if (await this.processAttackFlag(context)) {
			return;
		}
		if (await this.processBossesFlag(context)) {
			return;
		}
		if (await this.processDevFlag(context)) {
			return;
		}
		if (await this.processEventsFlag(context)) {
			return;
		}
		await this.processDefaultBehavior(context);
	}
}

export default Command;
