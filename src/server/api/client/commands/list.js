import { BaseRoute } from "#server/router.js";
import client from "#bot/client.js";
import { generateInviteFor } from "#lib/util.js";
import CommandsManager from "#lib/modules/CommandsManager.js";

const PREFIX = "/client/commands/list";



class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, response){
		const commands = CommandsManager.collection.map(command => command.options);
		response.json(commands)
	}
}

export default Route;