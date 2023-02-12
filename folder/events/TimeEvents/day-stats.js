import {TimeEventsManager, BossManager, Util} from '#src/modules/mod.js';
import { client } from '#src/index.js';

import TreeCommand from '#src/commands/seed.js';
import BankCommand from '#src/commands/bank.js';

class Event {
	run(isLost){
		let next = new Date(Date.now() + 14500000).setHours(20, 0, 0) - Date.now();
		if (isLost){
			return TimeEventsManager.create("day-stats", next);
		}

		const context = {
			treeCommand: new TreeCommand(),
			bankCommand: new BankCommand(),
			guilds: {}
		}

		client.guilds.cache
			.filter(guild => guild.data.treeLevel)
			.each(guild => context.treeCommand.onDayStats(guild, context));

		client.guilds.cache.forEach(guild => {
			this.sendStats(guild, context)
		});



		client.guilds.cache.filter(guild => guild.data.professions)
		.each(guild => {
			context.bankCommand.onDayStats(guild, context)
		});

		client.guilds.cache
			.each((guild) => BossManager.beforeApparance(guild));


		return TimeEventsManager.create("day-stats", next);
	}

	sendStats(guild, context){
		let data = guild.data;
		let msgs = data.day_msg || 0;

		const misstake = context.guilds[guild.id]?.messagesNeed;

		guild.data.coins += 2 * guild.memberCount;

		data.days = data.days + 1 || 1;
		data.msg_total = data.msg_total + msgs || msgs;


		let description = `За этот день было отправлено ${Util.ending(msgs, "сообщени", "й", "е", "я")}\nРекордное количество: ${data.day_max || (data.day_max = 0)}`;

		if (data.days > 3) {
			description += `\nВсего сообщений: ${ Util.NumberFormatLetterize(data.msg_total) }\nВ среднем за день: ${Math.round(data.msg_total / data.days)}`;
		}

		if (data.day_max < msgs) {
			data.day_max = msgs;
			description += `\nГильдия ${["<a:jeqery:768047102503944202>", "<a:jeqeryBlue:806176327223738409>", "<a:jeqeryPurple:806176181140848660>", "<a:jeqeryGreen:806176083757105162>", "<a:jeqeryRed:806175947447205958>", "<a:blockPink:794615199361400874>", "<a:blockAqua:794166748085223475>"].random()} установила свой рекорд по сообщениям!`;
		}


		data.day_msg = 0;

		if (!msgs){
			return;
			// description = ["Сегодня не было отправленно ни одно сообщение", "Сегодня на сервере пусто", "За целый день ни один смертный не проявил активность", "Похоже, тишина — второе имя этого сервера"].random();
		}

		if (misstake)
			description += `\n\nДерево засыхает! Ему необходимо на ${ Util.ending(misstake - msgs, "сообщени", "й", "е", "я") } больше 💧`;

			guild.chatSend({ title: "Статистика сервера", description });
	}

	options = {
		name: "TimeEvent/day-stats"
	}
}

export default Event;