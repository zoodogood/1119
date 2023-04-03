import { client } from '#bot/client.js';
import * as Util from '#lib/util.js';
import {TimeEventsManager, BossManager, DataManager} from '#lib/modules/mod.js';
import { dayjs } from '#lib/util.js';

class Event {
	async run(isLost){

		const Data = DataManager.data;

		
		let next = dayjs().endOf("date").add(1, "second") - Date.now();
		TimeEventsManager.create("new-day", next);
		
		Data.dailyAudit[ Data.bot.currentDay ] = {
			enterToPages: Data.site.entersToPagesToday,
			enterToAPI: Data.site.entersToAPIToday,
			commandsUsed: Data.bot.commandsUsedToday,
			messages: Data.bot.messagesToday
		};

		Data.site.entersToPagesToday = 0;
		Data.bot.commandsUsedToday = 0;
		Data.bot.messagesToday = 0;

		const today = Util.toDayDate( Date.now() );
		Data.bot.dayDate = today;
		Data.bot.currentDay = Util.timestampDay( Date.now() );


		Data.bot.grempen = "";
		let arr = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e"]; //0123456789abcdef
		for (let i = 1; i < 7; i++) {
			DataManager.data.bot.grempen += arr.random({pop: true});
		}

		let berryRandom = [{_weight: 10, prise: 1}, {_weight: 1, prise: -7}, {_weight: 5, prise: 3}].random({weights: true}).prise;
		let berryTarget = Math.sqrt(client.users.cache.size / 3) * 7 + 200;
		Data.bot.berrysPrise += Math.round((berryTarget - Data.bot.berrysPrise) / 30 + berryRandom);

		

		

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


		

		

		Data.guilds
			.forEach(e => 
				e.commandsLaunched = Object.values(e.commandsUsed)
				.reduce((acc, e) => acc + e, 0)
			);

		const commandsLaunched = Object.values(Data.bot.commandsUsed).reduce( ((acc, e) => acc + e), 0);
		Data.bot.commandsLaunched = commandsLaunched;
	}

	

	options = {
		name: "TimeEvent/new-day"
	}
}

export default Event;