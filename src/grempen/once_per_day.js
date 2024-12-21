import DataManager from "#src/data/DataManager.js";

export function update_product_list() {
	const botData = DataManager.data.bot;
	botData.grempenItems = "";
	const itemIndexes = [
		"0",
		"1",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7",
		"8",
		"9",
		"a",
		"b",
		"c",
		"d",
		"e",
	];
	for (let i = 0; i < 6; i++) {
		botData.grempenItems += itemIndexes.random({ pop: true });
	}
}
