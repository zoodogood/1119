import * as Util from '#src/modules/util.js';
import { Collection } from '@discordjs/collection';

class ResourcesEnum {
	static endingOf(resource, quantity){
		const item = this.collection.get(resource);
		if (!item){
			return undefined;
		}
		return Util.ending(quantity, item.base, ...item.suffixes, {unite: (_, word) => word});
	}

	static emojiOf(resource){
		const item = this.collection.get(resource);
		if (!item){
			return undefined;
		}
		return item.emoji;
	}

	static collection = new Collection(Object.entries({
		coins: {
			key: "coins",
			emoji: "<:coin:637533074879414272>",
			base: "коин",
			suffixes: ["ов", "", "а"]
		}
	}));
}

export default ResourcesEnum;