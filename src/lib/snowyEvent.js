import { multiline, transformToCollectionUsingKey } from "#bot/util.js";
import { Emoji } from "#constants/emojis.js";
import { MINUTE } from "#constants/globals/time.js";
import { BaseContext } from "#lib/BaseContext.js";
import CurseManager from "#lib/CurseManager/CurseManager.js";
import { DataManager } from "#lib/DataManager/singleton.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import {
	dayjs,
	ending,
	getRandomElementFromArray,
	random,
	sleep,
} from "#lib/safe-utils.js";
import { addResource, factoryGetPropertyValue } from "#lib/util.js";

import { justButtonComponents } from "@zoodogood/utils/discordjs";
import { Message } from "discord.js";

export const PRE_PHRASES = [
	() => "Эта музыка не спешит заканчиваться :notes:",
	() => "Хо-хо-хо :robot:",
	() =>
		"**Хо-хо-хо, @everyone, Отправляйте сообщения, чтобы получить проклятие зимнего праздника :snowflake: !**",
];
export const SNOWFLAKES_TO_PRESENT = 200;

export function initSnowyEventIn(guild) {
	return (guild.data.snowyEvent = { preGlowExplorers: [], isArrived: true });
}

export function checkAvailableIn(_guild) {
	const [day, month] = DataManager.data.bot.dayDate.split(".");
	const STARTS_AT = 20;
	const ENDS_AT = 31;
	const MONTH = 12;
	return month === MONTH && day >= STARTS_AT && day <= ENDS_AT;
}

export function getSnowyEventIn(guild) {
	return guild.data.snowyEvent;
}

export function getOrInitSnowyEventIn(guild) {
	return getSnowyEventIn(guild) || initSnowyEventIn(guild);
}

export async function onGetCoinsFromMessage({ user, message }) {
	const { guild } = message;
	if (!getSnowyEventIn(guild)) {
		return;
	}
	if (!guild) {
		return;
	}

	const snowyEvent = getOrInitSnowyEventIn(guild);

	if (snowyEvent.preGlowExplorers.length < PRE_PHRASES.length) {
		if (snowyEvent.preGlowExplorers.includes(user.id)) {
			return;
		}
		message.react("🌲");
		snowyEvent.preGlowExplorers.push(user.id);
		message.channel.sendTyping();

		await sleep(2_500);
		const content = PRE_PHRASES.at(snowyEvent.preGlowExplorers.length - 1)();
		message.channel.msg({
			reference: message.id,
			content,
		});
		return;
	}

	const userData = user.data;
	if (userData.curses?.some((curse) => curse.id === "happySnowy")) {
		return;
	}

	message.react("🌲");
	const curseBase = CurseManager.cursesBase.get("happySnowy");
	const curse = CurseManager.generateOfBase({
		curseBase,
		user,
		context: { message, guild },
	});
	CurseManager.init({ curse, user });
	return;
}

export function getPresentsList() {
	return transformToCollectionUsingKey([
		{
			weights: 5,
			key: "lollipop",
			async callback(context) {
				const { user } = context;
				const { addResourceAndMoveToBag } = await import(
					"#folder/commands/bag.js"
				);
				addResourceAndMoveToBag({
					resource: PropertiesEnum.lollipops,
					user,
					context,
					executor: user,
					value: 1,
					source: "curseManager.events.happySnowy.presents.lollipop",
				});
			},
			emoji: Emoji.lollipops,
			description:
				"Леденец. Используйте леденец в сумке !bag use lollipop, чтобы призвать босса на сервер",
		},
		{
			weights: 15,
			key: "snowyTree",
			callback(context) {
				const { user } = context;
				addResource({
					resource: PropertiesEnum.snowyTree,
					user,
					context,
					executor: user,
					value: 1,
					source: "curseManager.events.happySnowy.presents.snowyTree",
				});
			},
			emoji: Emoji.snowyTree,
			description:
				"Символ дерево - эмблема. Этот редкий предмет останется с вами ещё надолго",
		},
		{
			weights: 5,
			key: "presentsPack",
			callback(context) {
				const { user } = context;
				addResource({
					resource: PropertiesEnum.presents,
					user,
					context,
					executor: user,
					value: 3,
					source: "curseManager.events.happySnowy.presents.presentsPack",
				});
			},
			emoji: Emoji.presentsPack,
			description: "Коробка подарков. Уже распаковано — три подарка получено",
		},
		{
			weights: 15,
			key: "bonuses",
			callback(context) {
				const { user } = context;
				addResource({
					resource: PropertiesEnum.chestBonus,
					user,
					context,
					executor: user,
					value: 90,
					source: "curseManager.events.happySnowy.presents.bonuses",
				});
			},
			emoji: Emoji.chestBonus,
			description: "90 сундуков. В подарке было 90 сундуков",
		},
		{
			weights: 20,
			key: "multiVoid",
			callback(context) {
				const { user } = context;
				addResource({
					resource: PropertiesEnum.void,
					user,
					context,
					executor: user,
					value: 3,
					source: "curseManager.events.happySnowy.presents.multiVoid",
				});
			},
			emoji: Emoji.void,
			description: "3 нестабильности. В подарке было 3 нестабильности",
		},
		{
			weights: 10,
			key: "snowyQuote",
			async callback(context) {
				context.provideComponents(
					justButtonComponents({
						label: "Читать",
					}),
				);

				context.onComponent = async (interaction) => {
					const { getNewYearQuote } = await import("#lib/getNewYearQuote.js");
					await sleep(1000);
					interaction.msg({
						description: getNewYearQuote(),
						footer: {
							text: "Большинство цитат взяты отсюда: https://citaty.info/topic/novyi-god, они так же могут быть получены по API",
						},
					});

					context.componentsCollector.stop();
				};
			},
			emoji: Emoji.plain_scroll,
			description:
				"Новогодняя цитата. Бот хочет отправить вам одну из доступных цитат",
		},
		{
			weights: 20,
			key: "coins",
			callback(context) {
				const { user } = context;
				addResource({
					resource: PropertiesEnum.coins,
					user,
					context,
					executor: user,
					value: 9_000,
					source: "curseManager.events.happySnowy.presents.coins",
				});
			},
			emoji: Emoji.coins,
			description: "9 000 коинов. В подарке 9 000 коинов",
		},
		{
			weights: 10,
			key: "oneVoid",
			callback(context) {
				const { user } = context;
				addResource({
					resource: PropertiesEnum.void,
					user,
					context,
					executor: user,
					value: 1,
					source: "curseManager.events.happySnowy.presents.oneVoid",
				});
			},
			emoji: Emoji.void,
			description: "Нестабильность. Получите нестабильность!",
		},
	]);
}

export function onPresentsChatInputCommand(user, curse, context) {
	const { progress: snowflakes } = curse.values;
	const SNOWFLAKES_TO_PRESENT = 200;

	const presentsAdd = Math.floor(snowflakes / SNOWFLAKES_TO_PRESENT);

	(() => {
		addResource({
			user,
			source: "curseManager.events.happySnowy.present",
			resource: PropertiesEnum.presents,
			value: presentsAdd,
			executor: user,
			context: { curse, primary: context },
		});
		curse.values.progress -= SNOWFLAKES_TO_PRESENT * presentsAdd;
	})();

	const currentPresents = user.data.presents;

	const snoflakesContent = `У вас снежинок: \`\${ curse.values.progress % SNOWFLAKES_TO_PRESENT }\` (${
		snowflakes % SNOWFLAKES_TO_PRESENT
	}/${SNOWFLAKES_TO_PRESENT}) :snowflake:, — это не баг, здесь действительно должны быть фигурные скобки`;
	const presentsContent = presentsAdd
		? `\nПолучено из снежинок: ${ending(
				presentsAdd,
				"подар",
				"ков",
				"ок",
				"ка",
			)} :gift:`
		: "";
	const content = `${snoflakesContent}${presentsContent}`;

	const presentEmbed = (() => {
		const components = justButtonComponents(
			{
				label: "Открыть сейчас",
				customId: `@curseManager/events/happySnowy:openNow:${user.id}`,
			},
			{
				emoji: "👀",
				customId: `@curseManager/events/happySnowy:info`,
			},
		);

		return {
			image:
				"https://media.discordapp.net/attachments/629546680840093696/1180210287014576248/presentbox_.png?ex=657c977b&is=656a227b&hm=cfb15e12d3b7ea6e34c9d5f0d724f3e94fd128f6fdd11bb2f23a4d8dec8c07e4&=&format=webp&quality=lossless&width=677&height=677",
			components,
		};
	})();

	context.message.channel.msg({
		content,
		...(currentPresents ? presentEmbed : {}),
	});
}

export const componentsActions = {
	info({ interaction }) {
		interaction.msg({
			ephemeral: true,
			image:
				"https://cdn.discordapp.com/attachments/926144032785195059/1180876446672101446/4075c2de34d3e71e0967971d70805b0555ad82327810079.png?ex=657f03e4&is=656c8ee4&hm=7cab7a87e37056aa01819b79c61552630240ef877d52ab2f4e79e8dca4760db3&",
			description: multiline([
				"Время собрать весь снег и передать его снеговику :snowman:\n",
				`А после залезть: из коробки кричать "ура!" :star2:\n`,
				`Вытряхнув всякую мелочь: сверкающие камни и сундуки;\n`,
				`Обнаружьте два эксклюзивных предмета;\n`,
				`И услышьте цитату из интернета,\n`,
				"\n",
				"— откройте коробку сейчас или подарите другу!\n",
				"Пусть тоже залезет\n",
			]),
		});
	},
	async openNow({ params, interaction }) {
		const { client } = interaction;
		const [id] = params;
		const user = client.users.cache.get(id);
		if (user !== interaction.user) {
			interaction.msg({
				ephemeral: true,
				content:
					"Это взаимодействие доступно только владельцу подарка. Отправляйте сообщения, чтобы получать снежинки и используйте `!сумка использовать подарок`, чтобы вызвать это меню",
			});
			return;
		}
		const userData = user.data;

		if (userData.presents <= 0) {
			interaction.channel.msg({
				description:
					"Опс, в вашем инвентаре сейчас нет подарков. Получить их можно отправляя больше сообщений",
				color: "#ff0000",
			});
			return;
		}

		const OPEN_TIME = MINUTE * 3;
		const context = new BaseContext("snowyEvent.componentActions.openNow", {
			interaction,
			user: interaction.user,
			channel: interaction.channel,
			openStartsAt: Date.now(),
			openProcessMessage: null,
			provideComponents(components) {
				this.openedPresentComponents.push(components);
			},
			openedPresentComponents: [],
			openedMessage: null,
			componentsCollector: null,
			onComponent: null,
		});

		await new Promise(async (resolve) => {
			context.openProcessMessage ||= interaction;
			const embedDefaults = {
				color: "#40f7f5",
				fetchReply: true,
			};
			while (true) {
				const timediff = Math.max(
					0,
					context.openStartsAt + OPEN_TIME - Date.now(),
				);
				context.openProcessMessage = await context.openProcessMessage.msg({
					...embedDefaults,
					edit: context.openProcessMessage instanceof Message,
					description: `Распаковка подарка: ${dayjs
						.duration(timediff)
						.format("mm м : ss с")} ${
						Math.ceil(timediff / (MINUTE * 0.25)) % 2 ? "⏳" : "⌛"
					}\nПожалуйста, подождите...`,
				});

				const sleep = timediff < 5_000 ? timediff : random(1_500, 3_000);
				sleep(sleep);

				if (timediff <= 0) {
					break;
				}
			}

			resolve(true);
		});

		if (userData.presents <= 0) {
			interaction.channel.msg({
				description:
					"Опс, в вашем инвентаре сейчас нет подарка. Объяснение ситуации: основная проверка на наличие подарков производится после таймера. Это необходимо для того, чтобы они не пропали из инвентаря в случае перезапуска бота\nСкорее всего вы попытались открыть сразу несколько подарков",
				color: "#ff0000",
			});
			return;
		}

		const presents = [...getPresentsList().values()];
		const present = getRandomElementFromArray(presents, {
			associatedWeights: presents.map(factoryGetPropertyValue("weights")),
		});
		await present.callback.call(this, context);

		addResource({
			user,
			executor: user,
			value: -1,
			resource: PropertiesEnum.presents,
			source: "curseManager.events.happySnowy.present.onOpen",
			context,
		});

		context.openedMessage = await interaction.channel.msg({
			color: "#40f7f5",
			description: `:gift: ${present.emoji.toString()} Вы запрыгнули в коробку`,
			footer: { text: present.description },
			components: context.openedPresentComponents,
		});

		if (context.onComponent) {
			context.componentsCollector =
				context.openedMessage.createMessageComponentCollector({
					time: MINUTE * 3,
				});

			context.componentsCollector.on("collect", (interaction) =>
				context.onComponent.call(this, interaction),
			);

			context.componentsCollector.on("end", () => {
				context.openedMessage.msg({ edit: true, components: [] });
			});
		}
	},
};
