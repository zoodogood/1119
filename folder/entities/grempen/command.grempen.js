// @ts-check
import { PermissionsBits } from "#constants/enums/discord/permissions.js";
import { DAY } from "#constants/globals/time.js";
import { BaseCommand } from "#lib/BaseCommand.js";
import { BaseContext } from "#lib/BaseContext.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { DataManager } from "#lib/DataManager/singleton.js";
import { MessageInterface } from "#lib/DiscordMessageInterface.js";
import { takeInteractionProperties } from "#lib/Discord_utils.js";
import { ErrorsHandler } from "#lib/ErrorsHandler/ErrorsHandler.js";
import { Actions } from "#lib/modules/ActionManager.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import {
	addResource,
	ending,
	joinWithAndSeparator,
	numberFormat,
	sleep,
} from "#lib/util.js";

async function get_products() {
	const { grempen_products } = await import(
		"#folder/entities/grempen/products.js"
	);
	return [...grempen_products.values()];
}

class Slot {
	emoji;
	index;
	isBoughted = false;
	label;
	price;
	product;
	constructor(product, resolved, index) {
		this.product = product;
		this.index = index;
		const { emoji, label, price } = resolved;
		this.emoji = emoji;
		this.label = label;
		this.price = price;
	}
}

class BoughtContext extends BaseContext {
	commandRunContext;
	phrase;
	price;
	product;
	slot;
	constructor(commandRunContext, slot) {
		super("command.grempen.bought", {
			primary: commandRunContext,
			...takeInteractionProperties(commandRunContext),
		});
		this.userData = this.user.data;
		this.interaction = commandRunContext.interaction;
		this.commandRunContext = commandRunContext;
		this.slot = slot;
		this.product = slot.product;
		this.price = slot.price;
	}
}
// MARK: TodayProducts
function slotIsBoughted(userData, index) {
	if (index === -1) {
		return false;
	}
	return (userData.grempenBoughted & (2 ** index)) !== 0;
}

class CommandRunContext extends BaseCommandRunContext {
	_interface = new MessageInterface();
	options = {};
	/**@type {Slot[]} */
	slots = [];
	userData;

	static async new(interaction, command) {
		const context = new this(interaction, command);
		context.userData = interaction.user.data;
		return context;
	}
}

function resolveProductValues(product, context) {
	return {
		emoji: product.emoji(context),
		label: product.label(context),
		price: product.price(context),
	};
}

async function bought_slot(index, context) {
	const slot = context.slots[index];

	const contextBought = new BoughtContext(context, slot);
	await process_bought(contextBought);
}

async function process_bought(boughtContext) {
	const { slot, commandRunContext } = boughtContext;
	const { emoji, label, product } = slot;
	const { channel, userData, interaction, user } = commandRunContext;

	if (userData.coins < (boughtContext.price || 0)) {
		await channel.msg({
			title: "<:grempen:753287402101014649> Т-Вы что удумали?",
			description: `Недостаточно коинов, ${emoji} ${label} стоит на ${
				boughtContext.price - userData.coins
			} дороже`,
			color: "#400606",
			delete: 5_000,
		});
		return;
	}

	const phrase = (() => {
		try {
			return product.fn(boughtContext);
		} catch (error) {
			ErrorsHandler.onErrorReceive(error, { source: "command.grempen.bought" });
			return error.message;
		}
	})();

	boughtContext.phrase = `Благодарю за покупку ${emoji} !\nЦена в ${ending(
		!isNaN(boughtContext.price) ? boughtContext.price : 0,
		"монет",
		"",
		"у",
		"ы",
	)} просто ничтожна за такую хорошую вещь${phrase}`;

	if (!isNaN(boughtContext.price)) {
		addResource({
			user: interaction.user,
			value: -boughtContext.price,
			executor: interaction.user,
			source: `command.grempen.bought.${product.key}`,
			resource: PropertiesEnum.coins,
			context: boughtContext,
		});
	}

	if (!boughtContext.commandRunContext.disableSyncSlots) {
		userData.grempenBoughted += 2 ** slot.index;
	}

	interaction.user.action(Actions.buyFromGrempen, boughtContext);
	if (userData.grempenBoughted === 63) {
		interaction.user.action(Actions.globalQuest, { name: "cleanShop" });
	}

	slot.isBoughted = true;

	return channel.msg({
		description: boughtContext.phrase,
		author: { name: user.username, iconURL: user.avatarURL() },
		color: "#400606",
	});
}
class Command extends BaseCommand {
	options = {
		name: "grempen",
		id: 25,
		media: {
			description:
				"Лавка бесполезных вещей, цены которых невероятно завышены, на удивление, заведение имеет хорошую репутацию и постоянных клиентов.",
			example: `!grempen #без аргументов`,
		},
		alias:
			"гремпленс гремпенс evil_shop зловещая_лавка hell лавка grempens shop шалун ґремпенс крамниця магазин",
		allowDM: true,
		cooldown: 2_000,
		cooldownTry: 2,
		type: "other",
		myChannelPermissions:
			PermissionsBits.ManageMessages | PermissionsBits.AddReactions,
	};

	async createInterface(context) {
		const { _interface, userData } = context;
		_interface.setChannel(context.channel);
		_interface.setUser(context.user);
		_interface.setRender(async () => await this.getEmbed(context));
		const reactions = () => {
			const slots = context.slots.filter(
				(slot) =>
					!slot.isBoughted &&
					(isNaN(slot.price) || slot.price <= userData.coins),
			);
			return slots.length ? slots.map(({ emoji }) => emoji) : ["❌"];
		};

		_interface.setReactions(reactions());
		_interface.emitter.on(
			MessageInterface.Events.allowed_collect,
			async ({ interaction }) => {
				await this.onReaction(interaction, context, _interface);
				_interface.setReactions(reactions());
				_interface.updateMessage();
			},
		);

		_interface.emitter.on(MessageInterface.Events.before_close, () => {
			context.grempenIsClosed = true;
		});

		_interface.updateMessage();
	}
	async getEmbed(context) {
		const { userData, channel } = context;
		if (userData.coins < 80) {
			channel.sendTyping();
			await sleep(1200);

			return {
				title: "У вас ещё остались коины? Нет? Ну и проваливайте!",
				edit: true,
				delete: 3_500,
			};
		}

		if (context.grempenIsClosed) {
			return {
				title: "Лавка закрыта, приходите ещё <:grempen:753287402101014649>",
				edit: true,
				color: "#400606",
				description:
					"Чтобы открыть её снова, введите команду `!grempen`, новые товары появляются каждый день.",
				image:
					"https://cdn.discordapp.com/attachments/629546680840093696/847381047939432478/grempen.png",
			};
		}
		const slots_to_fields = () => {
			return context.slots.map((slot) => {
				const { emoji, label } = slot;
				const value = slot.isBoughted ? "Куплено" : slot.price;
				const name = `${emoji} ${label}`;

				return { name, value, inline: true };
			});
		};

		const _default = {
			title: "<:grempen:753287402101014649> Зловещая лавка",
			description: `Добро пожаловать в мою лавку, меня зовут Гремпленс и сегодня у нас скидки!\nО, вижу у вас есть **${numberFormat(userData.coins)}** <:coin:637533074879414272>, не желаете ли чего нибудь приобрести?`,
			fields: slots_to_fields(),
			color: "#400606",
			footer: { text: "Только сегодня, самые горячие цены!" },
		};

		if (context.slots.some((slot) => slot.isBoughted)) {
			Object.assign(_default, {
				description: `У вас есть-остались коины? Отлично! **${numberFormat(userData.coins)}** <:coin:637533074879414272> хватит, чтобы прикупить чего-нибудь ещё!`,
				footer: { text: "Приходите ещё, акции каждый день!" },
			});
		}

		return _default;
	}

	async onChatInput(msg, interaction) {
		const context = await CommandRunContext.new(interaction, this);
		context.setWhenRunExecuted(this.run(context));
		return context;
	}

	async onReaction(interaction, context, _interface) {
		const { customId } = interaction;
		if (customId === "❌") {
			context.grempenIsClosed = true;
			return;
		}
		const slot = context.slots.find(
			(slot) => slot.emoji === interaction.customId,
		);
		await bought_slot(slot.index, context);
	}

	process_mention(context) {
		const { interaction, channel } = context;
		if (!interaction.mention) {
			return false;
		}
		const mentionUserData = interaction.mention.data;
		const wordNumbers = [
			"ноль",
			"один",
			"два",
			"три",
			"четыре",
			"пять",
			"шесть",
			"семь",
			"восемь",
			"девять",
			"десять",
		];

		const getList = (mask) =>
			wordNumbers.filter((word, index) => (2 ** index) & mask);

		const list = getList(mentionUserData.grempenBoughted || 0);

		const buyingItemsContent =
			mentionUserData.shopTime === Math.floor(Date.now() / DAY) &&
			mentionUserData.grempenBoughted
				? `приобрел ${ending(
						list.length,
						"товар",
						"ов",
						"",
						"а",
					)} под номером: ${joinWithAndSeparator(
						list.sort(Math.random),
					)}. Если считать с нуля конечно-же.`
				: "сегодня ничего не приобретал.\nМожет Вы сами желаете чего-нибудь прикупить?";

		const description = `Ох, таки здравствуйте. Человек, о котором Вы спрашиваете ${buyingItemsContent}`;
		channel.msg({
			title: "<:grempen:753287402101014649> Зловещая лавка",
			description,
			color: "#541213",
			thumbnail: interaction.mention.avatarURL(),
		});
		return true;
	}

	async run(context) {
		const { interaction } = context;
		const { channel } = interaction;

		if (this.process_mention(context)) {
			return;
		}

		const { userData } = context;
		if (Math.floor(Date.now() / DAY) !== userData.shopTime) {
			userData.grempenBoughted = 0;
			userData.shopTime = Math.floor(Date.now() / DAY);
		}

		const today_items = (await get_products())
			.filter((item) => !item.isSpecial)
			.filter((_item, i) =>
				DataManager.data.bot.grempenItems.includes(i.toString(16)),
			);

		context.slots.push(
			...(context.options.slots ||
				today_items.map(
					(product, index) =>
						new Slot(product, resolveProductValues(product, context), index),
				)),
		);

		!context.disableSyncSlots &&
			context.slots.forEach((slot, index) => {
				slotIsBoughted(userData, index) && (slot.isBoughted = true);
			});

		if (interaction.params) {
			const target = interaction.params.toLowerCase();
			const index = context.slots.findIndex(
				(slot) =>
					slot.label.includes(target) || slot.product.others.includes(target),
			);
			const slot = context.slots[index];
			if (!slot || slot.isBoughted) {
				const emoji = slot ? slot.emoji : "👺";
				const today_available = context.slots
					.filter((slot) => !slot.isBoughted)
					.map(({ emoji }) => emoji)
					.join(" ");

				await channel.msg({
					title: "<:grempen:753287402101014649> Упс!",
					description: `**Сегодня этот предмет (${emoji}) отсуствует в лавке.**\nЖелаете взлянуть на другие товары?\n${today_available}`,
					color: "#400606",
					delete: 8000,
				});
				return;
			}
			await bought_slot(index, context);
			return;
		}

		if (userData.coins < 80) {
			interaction.channel.sendTyping();
			await sleep(1700);
			return channel.msg({
				title: "<:grempen:753287402101014649>",
				description: "Изыди бездомный попрошайка\nбез денег не возвращайся!",
				color: "#541213",
				delete: 3000,
			});
		}

		this.createInterface(context);
	}
}

export default Command;
