

class Event {
	run(isLost){
		let next = new Date(Date.now() + 14500000).setHours(20, 0, 0) - Date.now();
		if (isLost){
			return TimeEventsManager.create("day-stats", next);
		}

		client.guilds.cache.filter(e => e.data.treeLevel).each(guild => {
			let messagesNeed = (  [0, 70, 120, 180, 255, 370, 490, 610, 730, 930, 1270, 1500, 1720, 2200, 2700, 3200, 3700, 4500, 5200, 6000, 10000][guild.data.treeLevel] + (guild.memberCount * 3) + ((guild.data.day_average || 0) / 5)  ) * ("treeMisstakes" in guild.data ? 1 - 0.1 * guild.data.treeMisstakes : 1);
			// Сезонное снижение
			messagesNeed = Math.floor(messagesNeed / 3);

			if (guild.data.day_msg < messagesNeed){
			guild.data.treeMisstakes = (guild.data.treeMisstakes ?? 0) + 0.2 + Number( (1 - guild.data.day_msg / messagesNeed).toFixed(1) );
			guild.data.misstake = messagesNeed;

			if (guild.data.treeMisstakes >= 4){
				delete guild.data.treeMisstakes;
				guild.data.treeLevel--;
			}

			return;
			}

			guild.data.treeMisstakes = (guild.data.treeMisstakes ?? 0) - 0.2;

			if (guild.data.treeMisstakes <= 0)
			delete guild.data.treeMisstakes;


		});

		client.guilds.cache.forEach(guild => {
			let data = guild.data;
			let msgs = data.day_msg || 0;

			let misstake = data.misstake;
			delete data.misstake;

			guild.data.coins += 2 * guild.memberCount;

			data.days = data.days + 1 || 1;
			data.msg_total = data.msg_total + msgs || msgs;


			let description = `За этот день было отправлено ${Util.ending(msgs, "сообщени", "й", "е", "я")}\nРекордное количество: ${data.day_max || (data.day_max = 0)}`;

			if (data.days > 3) {
			description += `\nВсего сообщений: ${Math.letters(data.msg_total)}\nВ среднем за день: ${Math.round(data.msg_total / data.days)}`;
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
		});



		client.guilds.cache.filter(e => e.data.professions).each(guild => {
			let workers = new Set();
			let costs = 0;
			let entries = Object.entries(guild.data.professions);
			if (!entries.length){
			delete guild.data.professions;
			return;
			}


			entries = entries.filter(([id]) => guild.roles.cache.get(id) ? true : delete guild.data.professions[id]);

			guild.members.cache.each(memb => {
			entries.forEach(([id, cost]) => memb.roles.cache.has(id) ? workers.add(memb) && (costs += +cost) : false);
			});
			if (guild.data.coins < costs){
			guild.logSend({title: `Сегодня не были выданы зарплаты`, description: `В казне сервера слишком мало коинов, лишь ${guild.data.coins}, в то время как на выплаты требуется ${costs} <:coin:637533074879414272>`, color: "#ffff00"});
			return;
			}

			[...workers].forEach(memb => {
			entries.forEach(([id, cost]) => memb.roles.cache.has(id) ? memb.user.data.coins += +cost : false);
			});
			guild.data.coins -= costs;
			guild.logSend({title: `Были выданы зарплаты`, description: `С казны было автоматически списано ${Util.ending(costs, "коин", "ов", "", "а")} на заработные платы пользователям\nИх список вы можете просмотреть в команде \`!банк\`\nУчастников получило коины: ${workers.size}`});

		});

		client.guilds.cache
			.each((guild) => BossManager.beforeApparance(guild));


		return TimeEventsManager.create("day-stats", next);
	}

	options = {
		name: "TimeEvent/day-stats"
	}
}

export default Event;