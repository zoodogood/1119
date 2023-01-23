import { BaseEvent } from "#src/modules/EventsManager.js";
import { CommandsManager, Executer } from '#src/modules/mod.js';
import { client } from '#src/index.js';

class Event extends BaseEvent {
	constructor(){
		const EVENT = "interactionCreate";
		super(client, EVENT);

		
	}

	
	async run(interaction){
		const customId = interaction.customId;

		if (interaction.isCommand()){
			const name = interaction.name;
			const command = CommandsManager.callMap.get(name);
			CommandsManager.execute(command, interaction);
			return;
		}
		if (!customId.startsWith("@")){
			const [type, target, params] = Executer.parse(customId);
			Executer.emit(type, target, {params, interaction});
			return;
		}


	}

	options = {
		name: "client/interactionCreate"
	}
}

export default Event;