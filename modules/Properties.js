import * as Util from '#src/modules/util.js';

const ProperiesEnum = {
	"Bot": {
		berrysPrise: {},
		grempen: {}
	},
	"Guild": {
		name: {}
	},
	"boss": {

	},
	"userStats": {

	},
	"User": {
		id: {},
		name: {},
		coins: {},
		level: {},
		exp: {},
		berrys: {},
		chestLevel: {},
		void: {},
		keys: {},
		voidRituals: {},
		voidCoins: {},
		questProgress: {},
		questNeed: {},
		questReward: {},
		questTime: {},
		last_online: {},
		chestBonus: {},
		praiseMe: {},
		BDay: {},
		completedQuest: {},
		grempen: {},
		shopTime: {},
		first_$: {},
		praise: {},
		profile_color: {},
		profile_description: {},
		questLast: {},
		dayQuests: {},
		thiefGloves: {},
		chilli: {},
		invites: {},
		iq: {},
		cursesEnded: {},
		voidCasino: {},
		element: {},
		coinsPerMessage: {},
		voidPrise: {},
		elementLevel: {},
		bag: {},
		curses: {},
		seed: {},
		voidTreeFarm: {},
		voidDouble: {},
		CD_$: {},
		leave_roles: {},
		profile_confidentiality: {},
		voidQuests: {},
		monster: {},
		monstersBought: {},
		voidThief: {},
		thiefWins: {},
		quest: {},
		voidMysticClover: {},
		voidFreedomCurse: {},
		chestbonus: {},
		voidCooldown: {},
		remainedQuest: {},
		bossEffects: {},
		bossEffectsCallbackMap: {},
		cursesCallbackMap: {},
	},
	"curseEntity": {

	},
	
	
	"timeEventEntity": {

	},
	"counterEntity": {

	},
	
};

class Properties {
	static endingOf(resource, quantity, from = "User"){
		const item = ProperiesEnum[from][resource];
		if (!item){
			return undefined;
		}

		// delevop crutch
		return undefined;

		return Util.ending(quantity, item.base, ...item.suffixes, {unite: (_, word) => word});
	}

	static emojiOf(resource, from = "User"){
		const item = ProperiesEnum[from][resource];
		if (!item){
			return undefined;
		}
		return item.emoji;
	}
}

export {Properties, ProperiesEnum};
export default Properties;