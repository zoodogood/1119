import { transformToCollectionUsingKey } from "../nodejs/Collection/transformToCollectionUsingKey.js";

export const SpecialChannel = transformToCollectionUsingKey([
	{
		key: "chatChannel",
		label: "Чат",
		emoji: "🔥",
	},
	{
		key: "logChannel",
		label: "Для логов",
		emoji: "📒",
	},
	{
		key: "hiChannel",
		label: "Для приветствий",
		emoji: "👌",
	},
]);
