import { MINUTE, SECOND } from "#constants/time.js";
import { BaseContext } from "#src/app/BaseContext/BaseContext.js";
import { PropertiesEnum } from "#src/data/Properties.js";
import { addResource } from "#src/data/public/addResource.js";
import dayjs from "#src/dayjs.js";
import { factoryGetPropertyValue } from "#src/mini.js";
import { random, sleep } from "#src/safe-utils.js";
import { getPresentsList } from "#src/snowyEvent/presents_list.js";
import { getRandomElementFromArray } from "@zoodogood/utils/objectives";
import { Message } from "discord.js";

export default async function open_present({ params, interaction }) {
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

			const tick_ms =
				timediff < 5 * SECOND ? timediff : random(SECOND * 2, SECOND * 3);
			sleep(tick_ms);

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
}
