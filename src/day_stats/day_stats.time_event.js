import { client } from "#src/bot/client/singleton.js";

import { DAY } from "#constants/time.js";
import BankCommand from "#src/bank/command.bank.js";
import BossManager from "#src/boss/BossManager.js";
import { DataManager } from "#src/data/singleton.js";
import dayjs from "#src/dayjs.js";
import { timeEvents_singleton } from "#src/events/time/timeEvents_singleton.js";
import { mediana_of_unsorted } from "#src/mediana_of_unsorted.js";
import { MonthStatisticForEveryDayAPI } from "#src/messages/MonthStatisticForEveryDayAPI.js";
import { average, factorySummarize } from "#src/mini.js";
import { NumberFormatLetterize, multiline } from "#src/safe-utils.js";
import { onDayStats as TreeOnDayStats } from "#src/seed/command.seed.js";
import { ending } from "@zoodogood/utils/primitives";

class Event {
	options = {
		name: "timeEvent/day-stats",
	};

	run(eventData = {}) {
		if (eventData.isLost) {
			this.time_event_recreate();
			return;
		}

		const context = {
			bankCommand: new BankCommand(),
			guildsStatsContext: {},
		};

		client.guilds.cache.each(async (guild) => {
			const { data } = guild;
			data.tree?.level && TreeOnDayStats(guild, context);
			data.professions && context.bankCommand.onDayStats(guild, context);
			this.sendStats(guild, context);
			MonthStatisticForEveryDayAPI.ofGuild(guild).push({
				messages: data.day_msg,
			});
			BossManager.notifyAboutBossAtNextDay(guild);
		});

		this.time_event_recreate();
	}

	sendStats(guild, context) {
		const guildData = guild.data;
		const messagesOfDay = guildData.day_msg || 0;
		const { guildsStatsContext } = context;

		const { treeMessagesNeed } = guildsStatsContext[guild.id] || {};

		guild.data.coins += 2 * guild.memberCount;

		guildData.days = guildData.days + 1 || 1;
		guildData.msg_total = guildData.msg_total + messagesOfDay || messagesOfDay;

		let description = `За этот день было отправлено ${ending(
			messagesOfDay,
			"сообщени",
			"й",
			"е",
			"я",
		)}\nРекордное количество: ${guildData.day_max || (guildData.day_max = 0)}`;

		if (guildData.days > 3) {
			description += `\nВсего сообщений: ${NumberFormatLetterize(
				guildData.msg_total,
			)}\nВ среднем за день: ${Math.round(guildData.msg_total / guildData.days)}`;
		}

		if (guildData.day_max < messagesOfDay) {
			guildData.day_max = messagesOfDay;
			description += `\nГильдия ${[
				"<a:jeqery:768047102503944202>",
				"<a:jeqeryBlue:806176327223738409>",
				"<a:jeqeryPurple:806176181140848660>",
				"<a:jeqeryGreen:806176083757105162>",
				"<a:jeqeryRed:806175947447205958>",
				"<a:blockPink:794615199361400874>",
				"<a:blockAqua:794166748085223475>",
			].random()} установила свой рекорд по сообщениям!`;
		}

		guildData.day_msg = 0;
		if (!messagesOfDay) {
			return;
		}

		const messages_leaders = (() => {
			let current = { value: 0, id_list: [] };
			for (const [userId, memberData] of Object.entries(guildData.members)) {
				const value = memberData.messagesToday;
				delete memberData.messagesToday;
				if (value === current.value) {
					current.id_list.push(userId);
				}
				if (value > current.value) {
					current = { value, id_list: [userId] };
				}
			}
			return current;
		})();
		messages_leaders.id_list.length &&
			(description += `\nНаибольшее число от ${messages_leaders.id_list.map((userId) => `<@${userId}>`).join(", ")}: ${messages_leaders.id_list.length === 1 ? `${ending(messages_leaders.value, "сообщени", "й", "е", "я")}` : `по ${ending(messages_leaders.value, "сообщени", "й", "ю", "я")}`}`);

		{
			const month = MonthStatisticForEveryDayAPI.ofGuild(guild).field.map(
				(day) => day.messages,
			);
			const sum = month.reduce(factorySummarize(), 0);
			if (month.length > 3) {
				description += multiline([
					`\n\n**За ${ending(month.length, "д", "ней", "ень", "ня")}**\n`,

					`Всего: ${sum}\n`,
					`Среднее: ${average(sum, month.length)}\n`,
					`Медиана: ${mediana_of_unsorted(month)}\n`,
				]);
			}
		}

		if (treeMessagesNeed)
			description += `\n\nДерево засыхает! Ему необходимо на ${ending(
				treeMessagesNeed - messagesOfDay,
				"сообщени",
				"й",
				"е",
				"я",
			)} больше 💧${messagesOfDay === 0 ? ".  Дерево приносит больше клубники, когда стабильно есть сообщения. Если сообщений нет — оно засыхает в два раза быстрее" : ""}`;

		guild.chatSend({ title: "Статистика сервера", description });
	}

	time_event_recreate() {
		const launched_events = timeEvents_singleton.filterEventsInRange(
			({ name }) => name === "day-stats",
			[DataManager.data.bot.currentDay, DataManager.data.bot.currentDay + 1],
		);

		launched_events.length > 0 &&
			launched_events.forEach(
				timeEvents_singleton.removeFromBuffer.bind(timeEvents_singleton),
			);

		let next = dayjs().set("hour", 20).startOf("hour").diff();
		if (next < 0) {
			next += DAY;
		}
		timeEvents_singleton.pushIntoBuffer("day-stats", next);
	}
}

export default Event;
