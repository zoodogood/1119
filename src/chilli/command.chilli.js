import { SECOND } from "#constants/time.js";
import { client } from "#src/bot/client/singleton.js";
import { BaseCommand } from "#src/commands/BaseCommand/BaseCommand.js";
import { BaseCommandRunContext } from "#src/commands/CommandRunContext.js";
import { PropertiesEnum } from "#src/data/Properties.js";
import { addResource } from "#src/data/public/addResource.js";
import { Emoji } from "#src/emojis/emojis.js";
import { sortByResolve } from "#src/mini.js";
import { sleep } from "#src/safe-utils.js";
import { Actions } from "#src/user/actions/ActionManager.js";

export const REASON_FOR_CHANGE_NICKNAME = "Special: in chilli game";
const FOOTER_EMOJI =
	"https://media.discordapp.net/attachments/629546680840093696/1158272956812759050/hot-pepper-2179.png?ex=651ba540&is=651a53c0&hm=9cf4a793a57fb7d37d1f3a935fc6b39ad00b015df7ec500d548d4d4920801e64&=";

class CommandRunContext extends BaseCommandRunContext {
	boohIn;
	channel;
	chilli = null;
	guild;
	memb;
	user;
	userData;
	constructor(interaction, command) {
		super(interaction, command);
		const { user, channel, guild, mention: memb } = interaction;
		const userData = user.data;
		Object.assign(this, { user, channel, guild, memb, userData });
	}
	setChilli(chilli) {
		this.chilli = chilli || null;
	}
}

class RewardSystem {
	static GAME_REWARD = 100;
	static calculateRewardPerPlayer(context) {
		const { chilli } = context;
		const players = Object.keys(chilli.players);
		return Math.floor(this.GAME_REWARD / players.length);
	}
	static putReward(user, context, reward = null) {
		const value = reward || this.calculateRewardPerPlayer();
		addResource({
			value,
			user,
			resource: PropertiesEnum.coins,
			executor: context.chilli.startedBy,
			context,
			source: "command.chilli.reward",
		});
	}
}

class Chilli {
	#boohCallback;
	#timeout;
	boohAt;
	boohIn;
	createdAt;
	currentIn = null;
	ended = false;
	players = {};
	rebounds = 0;

	startedBy;
	constructor(context) {
		const { user } = context;
		this.createdAt = Date.now();
		this.startedBy = user;
		this.currentIn = user;
	}
	_processCleanPreviousTimeout() {
		if (!this.#timeout) {
			return;
		}
		clearTimeout(this.#timeout);
	}
	_updateTimeout() {
		this._processCleanPreviousTimeout();
		this.#timeout = setTimeout(() => {
			this.myBoohCallback();
			this.#boohCallback();
		}, this.boohAt - Date.now());
	}

	addPlayer(user) {
		this.players[user.id] = 0;
	}

	calculateDefaultBoohDelay() {
		return 5_500;
	}

	incrementPlayer(user) {
		if (user.id in this.players === false) {
			this.addPlayer(user);
		}
		this.players[user.id]++;
	}
	myBoohCallback() {
		this.boohIn = this.currentIn;
		this.ended = true;
		this._processCleanPreviousTimeout();
	}
	reputTo(user) {
		this.incrementPlayer(this.currentIn);
		this.currentIn = user;
		this.rebounds++;
		this.updateBoohAt();
	}

	setBoohCallback(callback) {
		this.#boohCallback = callback;
	}
	updateBoohAt(ms = null) {
		ms ||= this.calculateDefaultBoohDelay();
		this.boohAt = Date.now() + ms;
		this._updateTimeout();
	}
}

class Command extends BaseCommand {
	options = {
		name: "chilli",
		id: 38,
		media: {
			description:
				'Мини-игра "Жгучий перчик" подразумевает перебрасывание вымышленного перца, который через некоторое время бабахнет в руках у одного из участников — в этом случае игрок проигрывает.\nСтратегия здесь приветсвуется, а сама игра отлично подходит для проведения турниров.',
			example: `!chilli {memb}`,
		},
		alias: "перчик перец перець",
		expectMention: true,
		allowDM: true,
		hidden: true,
		cooldown: 3_500,
		cooldownTry: 2,
		type: "other",
	};
	addChilliToUsername(member) {
		const newName = member.displayName + "(🌶)";
		member.setNickname(newName, REASON_FOR_CHANGE_NICKNAME).catch(() => {});
	}

	chilliEnd(context) {
		const { chilli, guild, channel } = context;
		const members = guild.members;
		const boohIn = members.cache.get(chilli.currentIn.id);
		context.boohIn = boohIn;

		const reward = RewardSystem.calculateRewardPerPlayer(context);
		Object.keys(chilli.players).forEach((id) => {
			const user = client.users.cache.get(id);
			user.action(Actions.chilliBooh, context);
			RewardSystem.putReward(user, context, reward);
		});

		channel.msg({
			title: "Бах! Перчик взорвался!",
			description: `Перец бахнул прямо у ${boohIn.toString()}\nИгра окончена.\nБыло совершено отскоков: ${chilli.rebounds}\nЧтобы победить, должен быть хотя бы один отскок. Тогда все игроки получат по ${reward} ${Emoji.coins.toString()}`,
			fields: sortByResolve(Object.entries(chilli.players), ($) => $[1], {
				recursive: true,
			})
				.map(([id, score]) => ({
					name: members.cache.get(id).user.username,
					value: `Счёт: ${score}`,
				}))
				.slice(0, 20),
			footer: { iconURL: FOOTER_EMOJI, text: "Безудержный перчик™" },
		});

		this.processCleanChilliAfterEnd(context);
	}

	createChilli(context) {
		const { channel, memb, user } = context;

		const chilli = new Chilli(context);
		channel.chilli.push(chilli);
		chilli.currentIn = memb;
		chilli.addPlayer(memb);
		chilli.addPlayer(user);

		chilli.setBoohCallback(() => this.chilliEnd(context));
		chilli.updateBoohAt(40 * SECOND);
		return chilli;
	}

	findChilliInChannel(context) {
		const { channel, user } = context;
		const i_have_chilli = (chilli) => chilli.currentIn.id === user.id;
		return channel.chilli?.find(i_have_chilli);
	}

	async onChatInput(msg, interaction) {
		const context = await CommandRunContext.new(interaction, this);
		this.run(context);
		return context;
	}

	async processBeforeUserStartAGame(context) {
		const { channel, user } = context;
		const confirm = await channel.msg({
			title: "Подготовка",
			description: `${user.username}, вы бросили перец, нажмите "❌" чтобы отменить`,
			reactions: ["❌"],
		});
		await sleep(2_000);
		const confirmed = !confirm.reactions.cache
			.get("❌")
			.users.cache.has(user.id);

		confirm.delete();
		if (confirmed) {
			return true;
		}
		channel.msg({ title: "Отменено 🌶️", delete: 7_000 });
		return false;
	}

	processCleanChilliAfterEnd(context) {
		const { guild, chilli, channel } = context;
		const members = guild.members;
		for (const id of Object.keys(chilli.players)) {
			this.removeChilliFromUsername(members.resolve(id));
		}

		channel.chilli.remove(chilli);
		if (!channel.chilli.length) {
			delete channel.chilli;
		}
	}

	processCommandCall(context) {
		const {
			interaction: { message },
		} = context;
		setTimeout(() => message.delete(), 30 * SECOND);
	}

	processTargetAlreadyHasChilli(context) {
		const { memb, channel } = context;
		const hasChilli = channel.chilli?.find(
			(chilli) => chilli.currentIn.id === memb.id,
		);
		if (!hasChilli) {
			return false;
		}
		channel.msg({
			title: "Вы не можете бросить перец в участника с перцем в руке",
			color: "#ff0000",
			footer: { iconURL: FOOTER_EMOJI, text: "Перчик™" },
		});
		return true;
	}

	processTargetIsBotUser(context) {
		const { memb, channel } = context;
		if (!memb.bot) {
			return false;
		}
		channel.msg({
			title: "🤬🤬🤬",
			description: "it's hot fruitctttt",
			color: "#ff0000",
			footer: {
				iconURL: FOOTER_EMOJI,
				text: "Кое-кто бросил перец в бота..",
			},
		});
		return true;
	}

	processUserCanPutChilli(context) {
		const { userData, channel, chilli } = context;
		if (chilli || userData.chilli) {
			return true;
		}

		channel.msg({
			title: "Для броска у вас должен быть чилли 🌶️\nКупить его можно в !лавке",
			color: "#ff0000",
			delete: 5000,
			footer: { iconURL: FOOTER_EMOJI, text: "Безудержный перчик™" },
		});
		return false;
	}

	async putChilli(context) {
		const { channel, user, memb, guild } = context;
		addResource({
			user,
			value: -1,
			executor: user,
			context,
			resource: PropertiesEnum.chilli,
			source: "command.chilli.put",
		});
		channel.chilli ||= [];

		channel.msg({
			title: "Перец падает! Перец падает!!",
			description: `\\*перец упал в руки ${memb.toString()}\\*\nЧтобы кинуть обратно используйте \`!chilli @memb\``,
			author: { name: user.username, iconURL: user.avatarURL() },
			footer: { iconURL: FOOTER_EMOJI, text: "Безудержный перчик™" },
		});
		this.addChilliToUsername(guild.members.resolve(memb));
		context.setChilli(this.createChilli(context));
	}

	removeChilliFromUsername(member) {
		const newName = member.displayName.replace(/\(🌶\)/g, "").trim();
		member.setNickname(newName, REASON_FOR_CHANGE_NICKNAME).catch(() => {});
	}

	reputChilli(context) {
		const { chilli, memb, channel, guild, user } = context;
		const guildMembers = guild.members;
		const previous = chilli.currentIn;
		chilli.reputTo(memb);
		this.removeChilliFromUsername(guildMembers.resolve(previous));
		this.addChilliToUsername(guildMembers.resolve(memb));

		channel.msg({
			title: ["Бросок!", "А говорят перцы не летают..."].random(),
			description: `Вы бросили перчиком в ${memb}`,
			author: { name: user.username, iconURL: user.avatarURL() },
			footer: { iconURL: FOOTER_EMOJI, text: "Безудержный перчик™" },
			delete: 7_000,
		});
	}

	async run(context) {
		context.setChilli(this.findChilliInChannel(context));
		const { chilli } = context;
		this.processCommandCall(context);

		if (!this.processUserCanPutChilli(context)) {
			return;
		}
		if (this.processTargetAlreadyHasChilli(context)) {
			return;
		}
		if (this.processTargetIsBotUser(context)) {
			return;
		}

		if (chilli) {
			await this.reputChilli(context);
			return;
		}

		if (!(await this.processBeforeUserStartAGame(context))) {
			return;
		}

		await this.putChilli(context);
	}
}

export default Command;
