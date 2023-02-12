import { client } from '#src/index.js';
import {CurseManager} from '#src/modules/mod.js';


class Event {

	run(isLost, userId, timestamp){
		const user = client.users.cache.get(userId);
		const curses = user.data.curses;
		
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