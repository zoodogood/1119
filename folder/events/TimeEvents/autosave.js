import {TimeEventsManager, DataManager} from '#lib/modules/mod.js';


class Event {
	static INTERVAL = 7_200_000;

	run(){
		DataManager.file.write();
    	return TimeEventsManager.create("autosave", this.constructor.INTERVAL);
	}


	options = {
		name: "TimeEvent/autosave"
	}
}

export default Event;