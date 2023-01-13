import { Collection } from "@discordjs/collection";
import { Actions } from '#src/modules/ActionManager.js';
import TimeEventsManager from '#src/modules/TimeEventsManager.js';
import * as Util from '#src/modules/util.js';


class CurseManager {

	static generate({hard = null, user, guild = null}){
		const MAXIMAL_HARD = 2;
		if (hard > MAXIMAL_HARD){
		  hard = MAXIMAL_HARD;
		}
 
	  const curseBase = this.getGeneratePull(user, guild)
		 .filter(curseBase => hard === null || curseBase.hard === hard)
		 .random({weights: true});
 
 
	  const curse = this.generateOfBase({user, curseBase});
	  return curse;
	}

	static getGeneratePull(user, guild = null){
		return [...CurseManager.cursesBase.values()]
			.filter(curseBase => !curseBase.filter || curseBase.filter(user, guild));
	}
 
	static generateOfBase({curseBase, user}){
	  const curse = {
		 id: curseBase.id,
		 values: {},
		 timestamp: Date.now()
	  }
 
 
	  Object.entries(curseBase.values)
		 .forEach(([key, callback]) => curse.values[key] = callback(user, curse));
 
	  return curse;
	}
 
	static init({curse, user}){
	  if (!user.data.curses){
		 user.data.curses = [];
	  }
 
	  user.data.curses.push(curse);
	  const curseBase = this.cursesBase.get(curse.id);
	  const callbackMap = (user.data.cursesCallbackMap ||= {});
	  Object.keys(curseBase.callback).map(key => callbackMap[key] = true);
 
 
	  if (curse.values.timer){
		 const args = [user.id, curse.timestamp];
		 TimeEventsManager.create("curseTimeoutEnd", curse.values.timer, args);
	  }
 
	  user.action(Actions.curseInit, {curse});
	}
 
 
	static cursesBase = new Collection(
	  [
		 {
			_weight: 10,
			id: "callUserCommand",
			description: "Используйте команду !юзер <:piggeorg:758711403027759106>",
			hard: 0,
			values: {
			  goal: () => Util.random(1, 5),
			  timer: () => Util.random(1, 3) * 86_400_000
			},
			callback: {
			  callUserCommand: (user, curse) => CurseManager.intarface({user, curse})
				 .incrementProgress(1)
			},
			reward: 4
		 },
		 {
			_weight: 10,
			id: "onlyBuyBerry",
			description: "Купите клубнику, не продав ни одной",
			hard: 0,
			values: {
			  goal: () => Util.random(5, 20),
			  timer: () => Util.random(1, 2) * 86_400_000
			},
			callback: {
			  berryBarter: (user, curse, {quantity, isBuying}) => {
				 isBuying === 1 ?
					CurseManager.intarface({user, curse}).incrementProgress(quantity) :
					CurseManager.intarface({user, curse}).fail();
			  }
			},
			reward: 12
		 },
		 {
			_weight: 7,
			id: "weekdaysQuest",
			description: "Не пропускайте выполнение ежедневного квеста",
			hard: 2,
			values: {
			  goal: () => Util.random(3, 5),
			  timer: (user, curse) => {
				 const now = new Date();
				 const adding = curse.values.goal;
				 const timestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate() + adding).getTime();
				 return Math.floor(timestamp - now);
			  }
			},
			callback: {
			  curseInit: (user, curse, data) => data.curse === curse &&
				 user.data.questProgress >= user.data.questNeed ?
					CurseManager.intarface({user, curse}).incrementProgress(1) :
					null,
 
			  dailyQuestCompete: (user, curse) => CurseManager.intarface({user, curse}).incrementProgress(1),
			  dailyQuestSkiped:  (user, curse) => CurseManager.intarface({user, curse}).fail()
			},
			reward: 16
		 },
		 {
			_weight: 10,
			id: "notStupid",
			description: "Выполните ваш ежедневный квест, не называя бота глупым",
			hard: 1,
			values: {
			  goal: () => 1,
			  timer: (user, curse) => {
				 const now = new Date();
				 const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
				 return Math.floor(tomorrow - now);
			  }
			},
			callback: {
			  dailyQuestCompete: (user, curse) => CurseManager.intarface({user, curse}).incrementProgress(1),
			  callBot:		      (user, curse, {type}) => type !== "stupid" && CurseManager.intarface({user, curse}).fail()
			},
			filter: (user) => user.data.quest === "namebot",
			reward: 4
		 },
		 {
			_weight: 10,
			id: "chilliChampion",
			description: "Победите в мини-игре с перцем",
			hard: 0,
			values: {
			  goal: () => 2,
			  timer: () => 86_400_000 * 2
			},
			callback: {
			  chilliBooh: (user, curse, {boohIn}) => boohIn !== user ?
				 CurseManager.intarface({user, curse}).incrementProgress(1) :
				 null,
			},
			reward: 4
		 },
		 {
			_weight: 10,
			id: "chilliImperator",
			description: "Победите в мини-игре с перцем. Нельзя проигрывать",
			hard: 0,
			values: {
			  goal: () => 1,
			  timer: (user, curse) => {
				 const now = new Date();
				 const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
				 return Math.floor(tomorrow - now);
			  }
			},
			callback: {
			  chilliBooh: (user, curse, {boohIn}) => boohIn !== user ?
				 CurseManager.intarface({user, curse}).incrementProgress(1) :
				 CurseManager.intarface({user, curse}).fail(),
			},
			reward: 7
		 },
		 {
			_weight: 10,
			id: "usefulChest",
			description: "В сундуке, который Вы откроете должна оказаться нестабильность",
			hard: 1,
			values: {
			  goal: () => 1,
			  timer: () => 86_400_000 * 10
			},
			callback: {
			  openChest: (user, curse, {treasures}) => "void" in treasures ?
				 CurseManager.intarface({user, curse}).incrementProgress(1) :
				 null,
 
			},
			reward: 15
		 },
		 {
			_weight: 10,
			id: "sonic",
			description: "Отправьте 70 сообщний за минуту",
			hard: 1,
			values: {
			  goal: () => 70,
			  timer: () => 3_600_000 * 2,
			  messages: () => []
			},
			callback: {
			  messageCreate: (user, curse) => {
				 const now = Date.now();
				 const messages = curse.values.messages;
 
				 messages.push( now );
 
				 const extraTimeForMobileUsers = 5_500 * ("mobile" in (user.presence.clientStatus || {}));
				 const TIMEOUT = 90_000 + extraTimeForMobileUsers;
 
				 while (messages[0] + TIMEOUT < now){
					messages.shift();
				 }
 
				 CurseManager.intarface({user, curse}).setProgress(messages.length);
			  }
			},
			reward: 4
		 },
		 {
			_weight: 1,
			id: "mentionForDistribute",
			description: "Упомяните двух человек, у которых нет, и не было сего, проклятия. Проклятие распространяется на каждого, кого вы упомянули",
			hard: 0,
			values: {
			  goal: () => 2,
			  timer: () => 86_400_000 / 2,
			  listOfUsers: (user) => [user.id]
			},
			callback: {
			  messageCreate: (user, curse, message) => {
				 const content = message.content;
				 const mentions = content.matchAll(Discord.MessageMentions.USERS_PATTERN)
					.next()
					.value;
 
 
				 if (!mentions){
					return;
				 }
 
				 const target = message.client.users.cache.get(mentions[1]);
				 if (target.id === user.id || target.bot){
					return;
				 }
 
				 if (!user.curses){
					user.curses = [];
				 }
				 const haveCurse = user.data.curses.length;
				 if (haveCurse && user.data.voidFreedomCurse){
					return;
				 }
 
 
				 const list = curse.values.listOfUsers || [];
 
				 if (list.includes(target.id)){
					message.react("❌");
					return; 
				 }
 
				 message.react("💀");
 
				 const curseBase = this.cursesBase.get( curse.id );
				 const createdCurse = this.generateOfBase({curseBase, user: target});
 
				 
 
				 this.init({curse: createdCurse, user: target});
				 list.push(target.id);
				 createdCurse.values.listOfUsers = list;
 
				 CurseManager.intarface({user, curse}).incrementProgress(1);
			  }
			},
			reward: 1
		 },
		 {
			_weight: 5,
			id: "coinFever",
			description: "Отправьте коин-сообщения или дождитесь окончания. Даёт дополнительный шанс в 16% получить коин из сообщения. Однако количество денег будет уменьшаться",
			hard: 0,
			values: {
			  goal: (user) => 48 - (user.data.chectLevel ?? 0) * 16,
			  timer: () => 3_600_000 / 2
			},
			callback: {
			  messageCreate: (user, curse, message) => {
				 if (Util.random(6)){
					return;
				 }
 
				 const data = user.data;
 
				 const previousCoins = data.coins;
				 getCoinsFromMessage(data, message);
				 const difference = data.coins - previousCoins;
 
				 data.coins -= difference * 2;
				 CurseManager.intarface({user, curse}).incrementProgress(1);
			  },
			  curseTimeEnd: (user, curse, data) => {
				 if (data.curse !== curse){
					return;
				 }
 
				 const goal = curse.values.goal;
				 data.event.preventDefault();
 
				 CurseManager.intarface({user, curse}).setProgress(goal);
			  }
			},
			reward: 7
		 },
		 {
			_weight: 5,
			id: "bossWannaDamage",
			description: "Нанесите боссу вот столько-вот урона",
			hard: 2,
			values: {
			  goal: (user) => 80_000,
			  timer: (user) => {
				 const guilds = user.guilds.filter(guild => guild.data.boss?.isArrived);
				 const guild = guilds.reduce((maximalize, guild) => maximalize.data.boss.endingAtDay < guild.data.boss.endingAtDay ? guild : maximalize);
				 const timestamp = guild.data.boss.endingAtDay * 86_400_000;
				 const difference = timestamp - Date.now()
				 return Math.max(difference, 3_600_000);
			  }
			},
			callback: {
			  bossMakeDamage: (user, curse, {damage}) => {
				 CurseManager.intarface({user, curse}).incrementProgress(damage);
			  }
			},
			reward: 15,
			filter: (_user, guild) => guild && guild.data.boss?.isArrived
		 }
	  ]
	  .map(curse => [curse.id, curse])
	);
 
	static intarface({curse, user}){
 
	  const incrementProgress = (value) => {
		 curse.values.progress = (curse.values.progress || 0) + value;
		 CurseManager.checkAvailable({curse, user});
		 return curse.values.progress;
	  };
 
	  const setProgress = (value) => {
		 curse.values.progress = value;
		 CurseManager.checkAvailable({curse, user});
		 return curse.values.progress;
	  }
 
	  const toString = () => {
		 const curseBase = CurseManager.cursesBase.get(curse.id);
 
		 const description = curseBase.description;
		 const progress = `Прогресс: ${ curse.values.progress || 0 }/${ curse.values.goal }`;
		 const timer = curse.values.timer ? `\nТаймер: <t:${ Math.floor((curse.timestamp + curse.values.timer) / 1000) }:R> будет провалено` : "";
 
		 const content = `${ description }\n${ progress }${ timer }`;
		 return content;
	  }
 
	  const fail = () => {
		 CurseManager.curseEnd({lost: true, user});
	  }
 
	  return {
		 incrementProgress,
		 setProgress,
		 toString,
		 fail
	  }
	}
 
	static checkAvailable({curse, user}){
 
	  if (!curse){
		 return null;
	  }
	  
	  if (curse.values.progress >= curse.values.goal){
		 CurseManager.curseEnd({user, curse, lost: false});
	  }
 
	  if (curse.values.timer && Date.now() > curse.timestamp + curse.values.timer){
		 const event = new Event("curseTimeEnd", {cancelable: true});
		 user.action(Actions.curseTimeEnd, {event, curse});
		 if (!event.defaultPrevented){
			CurseManager.curseEnd({user, curse, lost: true});
		 }
	  }
	}
 
	static checkAvailableAll(user){
	  user.data.curses.forEach(
		 (curse) => this.checkAvailable({curse, user})
	  );
	}
 
	static curseEnd({lost, user, curse}){
	  const curseBase = CurseManager.cursesBase.get(curse.id);
 
	  const index = user.data.curses.indexOf(curse);
	  if (index === -1){
		 return null;
	  }
	  
	  user.action(Actions.curseEnd, curse);
	  user.data.curses.splice(index, 1);
 
	  const getDefaultFields = () => {
		 const fields = [];
		 fields.push({
			name: "Прогресс:",
			value: Object.entries(curse.values)
				 .map(([key, value]) => `${ key }: \`${ Util.toLocaleDeveloperString(value) }\``)
				 .join("\n")
 
		 });
 
		 fields.push({
			name: "Основа:",
			value: Object.entries(curseBase)
				 .map(([key, value]) => `${ key }: \`${ Util.toLocaleDeveloperString(value) }\``)
				 .join("\n")
 
		 });
 
		 fields.push({
			name: "Другое:",
			value: `Дата создания: <t:${ Math.floor(curse.timestamp / 1000) }>`
 
		 });
 
		 fields
			.filter(field => field.value.length > 1024)
			.forEach(field => field.value = `${ field.value.slice(0, 1021) }...`);
 
		 return fields;
	  }
 
	  if (lost){
		 user.data.level = Math.max(1, user.data.level - 1);
		 const fields = getDefaultFields();
		 const image = "https://media.discordapp.net/attachments/629546680840093696/1014076170364534805/penguinwalk.gif";
		 user.msg({title: "Вы не смогли его одолеть 💀", description: "Проклятие не было остановлено, а последствия необратимы. Вы теряете один уровень и, возможно, что-то ещё.", fields, color: "#000000", image});
		 return;
	  }
 
 
 
	  if (!lost){
		 user.data.cursesEnded = (user.data.cursesEnded ?? 0) + 1;
		 const fields = getDefaultFields();
 
		 const getVoidReward = () => {
			const BASIC_ODDS = 20;
			const REDUCTION_FOR_HARD = 0.25;
			const comparator = BASIC_ODDS * REDUCTION_FOR_HARD ** curseBase.hard;
 
			return Number(Math.random() < 1 / comparator);
		 };
		 const voidReward = getVoidReward();
 
		 const getCoinsReward = () => {
			const BASIC_REWARD = 200;
			const ADDING_REWARD = 115;
			return (BASIC_REWARD + ADDING_REWARD * curseBase.hard) * curseBase.reward;
		 }
		 const coinsReward = getCoinsReward();
 
		 user.data.coins += coinsReward;
		 user.data.void += voidReward;
 
		 const rewardContent = `${  Util.ending(coinsReward, "коин", "ов", "", "а") }${ voidReward ? ` и ${  Util.ending(voidReward, "нестабильност", "и", "ь", "и") }` : "" }`;
		 const descriptionFooter = `${ coinsReward ? "<:coin:637533074879414272>" : "" } ${ voidReward ? "<a:void:768047066890895360>" : "" }`;
		 const description = `Это ${ user.data.cursesEnded }-й раз, когда Вам удаётся преодолеть условия созданные нашей машиной для генерации проклятий.\nВ этот раз вы получаете: ${ rewardContent }. Награда такая незначительная в связи с тем, что основным поставщиком ресурсов является сундук. Да будь он проклят!\n${ descriptionFooter }`;
 
		 const image = "https://media.discordapp.net/attachments/629546680840093696/1014076170364534805/penguinwalk.gif";
 
		 user.msg({title: "Проклятие снято 🔆", description, fields, color: "#000000", image});

		 const needRemove = (callbackKey) => !user.data.curses.some(({id}) => callbackKey in this.cursesBase.get(id).callback);
		 const callbackMap = user.data.cursesCallbackMap;
		 Object.keys(callbackMap).filter(needRemove)
		 	.forEach(key => delete callbackMap[key]);

		 return;
	  }
	}
 
 }
 

 export default CurseManager;