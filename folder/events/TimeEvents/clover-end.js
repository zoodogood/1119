import { client } from '#src/index.js';

class Event {
	/**
	 * @param {boolean} isLost
	 * @param {string} guildId
	 * @param {string} channelId
	 */
	async run(isLost, guildId, channelId){
		const guild = client.guilds.cache.get(guildId);
   	if (!guild){
     		 return;
    	}
		const channel = guild.channels.cache.get(channelId);
		const effect = guild.data.cloverEffect;
		delete guild.data.cloverEffect;

		
		const multiplier = 1.08 + (0.07 * ((1 - 0.9242 ** effect.uses) / (1 - 0.9242)));
		channel?.msg({title: "☘️ Ивент Клевера завершился", color: "#21c96c", description: `Получено наград во время действия эффекта: ${effect.coins}\nМаксимальный множитель: X${multiplier.toFixed(2)}\nКуплено клеверов: ${effect.uses}\nКлевер длился ${((Date.now() - effect.timestamp) / 3600000).toFixed(1)}ч.`});	
	}

	

	options = {
		name: "TimeEvent/clover-end"
	}
}

export default Event;