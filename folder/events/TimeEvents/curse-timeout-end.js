import { client } from '#bot/client.js';
import {CurseManager} from '#lib/modules/mod.js';


class Event {

	run(isLost, userId, timestamp){
		const user = client.users.cache.get(userId);
		if (!user){
			return;
		}
		
		const curses = user.data.curses;
		if (!curses){
			return;
		}
		
		const compare = curse => curse.timestamp === timestamp;
		const curse = curses.find(compare);

		if (!curse){
			return;
		}
		
		CurseManager.checkAvailable({user, curse});
	}


	options = {
		name: "TimeEvent/curse-timeout-end"
	}
}

export default Event;