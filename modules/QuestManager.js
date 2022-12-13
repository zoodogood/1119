import { DataManager } from "#src/modules/mod.js";
import { Collection } from "discord.js";
import { Actions } from "#src/modules/ActionManager.js";



 class QuestManager {
	static generate({user}){

		const userQuestField = user.data.quest;

	  	const questBase = [...this.questsBase.values()]
			.filter(quest => !quest.isGlobal)
			.filter(quest => quest.id !== userQuestField?.id)
			.random({weight: true});

 
 
		const quest = this.generateOfBase({user, questBase});
	  	return quest;
	}
 
	static generateOfBase({questBase, user}){
		const calculateGoal = () => {
			const baseGoal = questBase.baseGoal;
			const limit = questBase.maximalGoal ?? Number.MAX_SAFE_INTEGER;

			const multiplayer = 1 + (user.voidQuests ?? 0) * 0.15;
			const value = Math.min(
				limit,
				Math.round(
					(Math.random() * baseGoal + baseGoal / 1.5) * multiplayer
				)
			);
			const rounded = +String(value).replace(/(?!^)\d/g, "0");
			return rounded;
		}

		const calculateReward = (goal) => {
			const multiplayer = 1 + (user.voidQuests ?? 0) * 0.30;
			const difference = goal / questBase.baseGoal;
			return difference * questBase.complexity * multiplayer;
		}

	  	const quest = {
			id: questBase.id,
		 	progress: 0,
			goal: calculateGoal(),
			day: DataManager.data.bot.currentDay,
			completed: false
	  	}
		
		quest.reward = calculateReward(quest.goal);

 
	  	return quest;
	}

	static init({user, quest}){
		user.data.quest = quest;
		return quest;
	}


	static checkAvailable({user}){
		
		if ("quest" in user.data === false){
			const quest = this.generate({user});
			this.init({quest, user});
		}
		const quest = user.data.quest;

		
		const currentDay = DataManager.data.bot.currentDay;
		if (quest.day !== currentDay){
			if (!quest.completed){
				user.action(Actions.dailyQuestSkiped, {quest});
			}
				
			this.init({
				user,
				quest: this.generate({user})
			});
		};
	}

	static onAction({user, questBase, data}){
		this.checkAvailable({user});

		const quest = user.data.quest;
		if (questBase.id === quest.id){
			quest.progress += data.count ?? 1;
			this.checkAvailable({user});

			if (quest.progress >= quest.goal && !quest.completed){
				user.action(Actions.dailyQuestComplete, {quest});
				this.completeQuest({user, quest, context: {channel: data.channel}});
			}
		}

		if (questBase.isGlobal){
			this.completeGlobalQuest({user, questBase});
		}
	}

	static completeGlobalQuest({user, questBase}){
		const data = user.data;
		data.questsGlobalCompleted ||= "";

		const SEPARATOR = " ";

		const completed = data.questsGlobalCompleted.split(SEPARATOR);

		if (completed.includes(questBase.id)){
			return;
		};


		/** Rewards: */
		const DEFAULT_CHEST_BONUS = 10;

		completed.push(questBase.id);
		data.questsGlobalCompleted = completed.join(SEPARATOR);
		
		
		user.exp += questBase.reward;
		user.chestBonus = (user.chestBonus ?? 0) + DEFAULT_CHEST_BONUS;
		

		const percentOfMade = (
			DataManager.data.users.filter((userData) => userData.questsGlobalCompleted?.includes(questBase.id)).length
			/ DataManager.data.users.length * 100
		).toFixed(2) + "%";

		const MEDIA_URL = "https://media.discordapp.net/attachments/629546680840093696/1047587012665933884/batman-gif.gif";
		user.msg({
			title: `Вы выполнили глобальный квест\n"${realName}"!`,
			description: `Описание: "${ questBase.description }"\nОпыта получено: **${ questBase.reward }**\nЭтот квест смогло выполнить ${ percentOfMade } пользователей.\n[Я молодец.](${ MEDIA_URL })`});
	}

	static completeQuest({user, quest, context: {channel}}){
		const DEFAULT_REWARD_MULTIPLAYER = 1.4;
		const DEFAULT_CHEST_REWARD = 2;
		const multiplayer = DEFAULT_REWARD_MULTIPLAYER * quest.reward;

		const data = user.data;
		const questBase = this.questsBase.get(quest.id);

		const expReward = Math.round((user.level + 5) * multiplayer);
		data.exp += expReward;
		user.chestBonus = (user.chestBonus ?? 0) + Math.round(multiplayer * DEFAULT_CHEST_REWARD);

		const MEDIA_URL = "https://media.discordapp.net/attachments/629546680840093696/1047584339854118952/slide-5.jpg?width=793&height=594";
		const target = channel ?? user;
		target.msg({
			title: "Вы выполнили сегодняшний квест и получили опыт!",
			description: `Опыта получено: **${ expReward }**\nОписание квеста:\n${ questBase.description }\n\n[Я молодец.](${ MEDIA_URL })`,
			author: {iconURL: this.avatarURL(), name: this.username}
		}) 
		
		data.dayQuests = (data.dayQuests ?? 0) + 1;
		if (data.dayQuests === 100){
			user.action(Actions.globalQuest, {name: "day100"});
		}

		if ( !(user.dayQuests % 50) ){
			"seed" in user ?
			  memb.msg({title: `Ваш ${user.dayQuests}-й квест — новые семечки`, description: `🌱`}) :
			  memb.msg({title: "Ура, ваши первые семечки!", description: `Вы будете получать по два, выполняя каждый 50-й ежедневный квест. Его можно использовать для улучшения дерева или его посадки, которое даёт клубнику участникам сервера`});
	
			user.seed = (user.seed ?? 0) + 2;
		 }
	}

	static questsBase = new Collection(Object.entries({
		"inviteFriend": {
			id: "inviteFriend",
			title: "Первый друг",
			description: "Пригласите друга на сервер!",
			isGlobal: true,
			reward: 375
		},
		"setBirthday": {
			id: "setBirthday",
			title: "Операция тортик",
			description: "Установите дату своего дня рождения.",
			isGlobal: true,
			reward: 500
		},
		"beEaten": {
			id: "beEaten",
			title: "Быть съеденным",
			description: "Будьте съедены!",
			isGlobal: true,
			reward: 300
		},
		"thief": {
			id: "thief",
			title: "Серия #7",
			description: "Успешно совершите кражу 7 раз подряд.",
			isGlobal: true,
			reward: 377
		},
		"crazy": {
			id: "crazy",
			title: "Разумно-безумен",
			description: "Украдите у пользователя, у которого никто не смог украсть.",
			isGlobal: true,
			reward: 900
		},
		"day100": {
			id: "day100",
			title: "Квесто-выжималка",
			description: "Выполните 100 ежедневных квестов!",
			isGlobal: true,
			reward: 1175
		},
		"firstChest": {
			id: "firstChest",
			title: "Новое приключение",
			description: "Откройте сундук в знак наступающих весёлостей",
			isGlobal: true,
			reward: 200
		},
		"bigHungredBonus": {
			id: "bigHungredBonus",
			title: "Большая стопка",
			description: "Откройте сундук, в котором будет по меньшей мере 99 ключей.",
			isGlobal: true,
			reward: 1002
		},
		"cleanShop": {
			id: "cleanShop",
			title: "Снова пусто",
			description: "Опустошите лавку всего за один день.",
			isGlobal: true,
			reward: 961
		},
		"completeTheGame": {
			id: "completeTheGame",
			title: "В конце-концов",
			description: "Пройдите призрака — познайте каждый кусочек его возможностей и достигните конца всей истории.",
			isGlobal: true,
			reward: 0
		},
		"cloverInstability": {
			id: "cloverInstability",
			title: "Нестабилити",
			description: "Признайтесь, вы счастливчик \\✔",
			isGlobal: true,
			reward: 900
		},
		
		"onlyCoin": {
			id: "onlyCoin",
			handler: "coinFromMessage",
			description: "Выбейте коин из сообщений",
			_weight: 1,
			isGlobal: false,
			reward: 1.2,
			baseGoal: 1,
			max: 1
		},
		"messagesFountain": {
			id: "messagesFountain",
			handler: "messageCreate",
			description: "Отправьте сообщения",
			_weight: 1,
			isGlobal: false,
			reward: 1.5,
			baseGoal: 30
		},
		"messagesBigFountain": {
			id: "messagesBigFountain",
			handler: "messageCreate",
			description: "Отправьте сообщения",
			_weight: 10,
			isGlobal: false,
			reward: 4,
			baseGoal: 280
		},
		"likeTheFriend": {
			id: "likeTheFriend",
			handler: "likedTheUser",
			description: "Поставьте лайк своему другу!",
			_weight: 10,
			isGlobal: false,
			reward: 1,
			baseGoal: 1
		},
		"praiseMe": {
			id: "praiseMe",
			description: "Дождитесь, пока вас похвалят",
			_weight: 7,
			isGlobal: false,
			reward: 1,
			baseGoal: 1,
			max: 2
		},
		"namebot": {
			id: "namebot",
			handler: "callBot",
			description: "Назовите бота глупым",
			_weight: 7,
			isGlobal: false,
			reward: 1,
			baseGoal: 2,
			max: 2
		},
		"berryActive": {
			id: "berryActive",
			handler: "berryBarter",
			description: "Купите или продайте клубнику",
			_weight: 10,
			isGlobal: false,
			reward: 1,
			baseGoal: 2
		},
	}));

	static HandlersMap = new Map(
		this.questsBase
			.filter(questBase => !questBase.isGlobal)
			.map(questBase => [questBase.handler, questBase.id])
	);
 }

export default QuestManager;
