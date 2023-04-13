import { BaseEvent, EventsManager } from "#lib/modules/EventsManager.js";


const EXPERIENCE_PER_LEVEL = 45;



class Event extends BaseEvent {
	constructor(){
		const EVENT = "exit";
		super(EventsManager.emitter, EVENT);
	}

	async onLevelIncrease(user, message){
		const initialLevel = user.level;

		while (user.exp >= user.level * EXPERIENCE_PER_LEVEL){
			const expSummary = user.level * EXPERIENCE_PER_LEVEL;
			const coefficient = Math.max(0.97716 ** user.voidRituals, 0.01);
			user.exp -= Math.ceil(expSummary * coefficient);
			user.level++;
		 }
			

		(async () => {
			const textContent = user.level - initialLevel > 2 ?
				`**${ message.author.username } повышает уровень с ${ initialLevel } до ${ user.level }!**` :
				`**${ message.author.username } получает ${ user.level } уровень!**`;

			const message = await message.msg({content: textContent});
			
			if (message.channel.id !== message.guild.data.chatChannel) {
				message.delete({timeout: 5000});
			}
		})();
	}

	async run({user, message}){
		this.onLevelIncrease(user, message);
	}

	options = {
		name: "users/levelIncrease"
	}
}

export { EXPERIENCE_PER_LEVEL };
export default Event;