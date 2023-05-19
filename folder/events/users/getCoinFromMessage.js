import { BaseEvent, EventsManager } from "#lib/modules/EventsManager.js";





class Event extends BaseEvent {
	constructor(){
		const EVENT = "users/getCoinsFromMessage";
		super(EventsManager.emitter, EVENT);
	}

	async onGetCoinsFromMessage({userData, message}){
		message.author.action(Actions.coinFromMessage, {channel: message.channel});
	 
		let reaction = "637533074879414272";
		let k = 1;
	 
		if (DataManager.data.bot.dayDate === "31.12"){
		  reaction = "❄️";
		  k += 0.2;
		}
	 
		if (message.guild && "cloverEffect" in message.guild.data) {
		  reaction = "☘️";
		  let multiplier = 0.08 + (0.07 * ((1 - 0.9242 ** message.guild.data.cloverEffect.uses) / (1 - 0.9242)));
		  multiplier *= 2 ** (userData.voidMysticClover ?? 0);
		  k += multiplier;
		  message.guild.data.cloverEffect.coins++;
		}
	 
		const coins = Math.round((35 + (userData.coinsPerMessage ?? 0)) * k);
		userData.coins += coins;
		userData.chestBonus = (userData.chestBonus ?? 0) + 5;
	 
		const react = await message.awaitReact({user: message.author, removeType: "full", time: 20000}, reaction);
	 
		if (!react) {
		  return;
		}
	 
		const messageContent = `> У вас ${ Util.ending(userData.coins, "коин", "ов", "", "а")} <:coin:637533074879414272>!\n> Получено ${coins}\n> Бонус сундука: ${userData.chestBonus || 0}`;
		message.msg({content: messageContent, delete: 2500});
	 };

	async run({userData, message}){
		this.onGetCoinsFromMessage({userData, message});
	}

	options = {
		name: "users/getCoinsFromMessage"
	}
}


export default Event;