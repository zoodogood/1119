// @ts-check
const MONTH_DAYS = 31;
export class MonthStatisticForEveryDayAPI {
	static KEY = "month_statisic";
	constructor(guildData) {
		/**
		 * @type {Array<{ messages: number }>}
		 */
		this.field = guildData[MonthStatisticForEveryDayAPI.KEY] ||= [];
	}

	static ofGuild(guild) {
		return new MonthStatisticForEveryDayAPI(guild.data);
	}

	push(object) {
		if (this.field.length >= MONTH_DAYS) {
			this.field.shift();
		}
		this.field.push(object);
	}
}
