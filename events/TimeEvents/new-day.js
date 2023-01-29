import { client } from '#src/index.js';
import {TimeEventsManager, BossManager, Util, DataManager} from '#src/modules/mod.js';

class Event {
	async run(isLost){
		let next = new Date(Date.now() + 14500000).setHours(23, 59, 50) - Date.now();
		TimeEventsManager.create("new-day", next);
		

		!isLost && await Util.sleep(20000);

		const today = Util.toDayDate( Date.now() );
		DataManager.data.bot.dayDate = today;
		DataManager.data.bot.currentDay = Util.timestampDay( Date.now() );

		DataManager.data.bot.grempen = "";
		let arr = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e"]; //0123456789abcdef
		for (let i = 1; i < 7; i++) {
			DataManager.data.bot.grempen += arr.random({pop: true});
		}

		let berryRandom = [{_weight: 10, prise: 1}, {_weight: 1, prise: -7}, {_weight: 5, prise: 3}].random({weights: true}).prise;
		let berryTarget = Math.sqrt(client.users.cache.size / 3) * 7 + 200;
		DataManager.data.bot.berrysPrise += Math.round((berryTarget - DataManager.data.bot.berrysPrise) / 30 + berryRandom);

		

		

		if (isLost){
			return;
		}

		

		client.guilds.cache
			.each((guild) => BossManager.bossApparance(guild));

		const birthdaysToday = client.users.cache
			.filter(memb => !memb.bot && memb.data.BDay === today)
			.length;

		if (birthdaysToday){
			console.info(`Сегодня день рождения у ${ birthdaysToday } пользователя(ей)`);
		}


		

		

		DataManager.data.guilds
			.forEach(e => 
				e.commandsLaunched = Object.values(e.commandsUsed)
				.reduce((acc, e) => acc + e, 0)
			);

		const commandsLaunched = Object.values(DataManager.data.bot.commandsUsed).reduce( ((acc, e) => acc + e), 0);
		console.info(`\n\n\n      —— Ежедневная статистика\n\nСерверов: ${DataManager.data.guilds.length}\nПользователей: ${DataManager.data.users.length}\nКаналов: ${client.channels.cache.size}\n\nЦена клубники: ${DataManager.data.bot.berrysPrise}\nВыполнено команд: ${commandsLaunched - DataManager.data.bot.commandsLaunched}\nВыполнено команд по серверам:\n${DataManager.data.guilds.map(e => e.name + ":\nВыполнено команд: " + e.commandsLaunched + "\nРекорд сообщений: " + e.day_max).join("\n")}\n\n`);
		DataManager.data.bot.commandsLaunched = commandsLaunched;
	}

	

	options = {
		name: "TimeEvent/new-day"
	}
}

export default Event;