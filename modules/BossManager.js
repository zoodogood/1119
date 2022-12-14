import { Collection } from "@discordjs/collection";
import { DataManager, CurseManager } from "#src/modules/mod.js";
import { Actions } from '#src/modules/ActionManager.js';
import * as Util from '#src/modules/util.js';

class BossManager {
	static async bossApparance(guild){
 
		const TWO_MONTH = 5259600000;
 
	  	if ( guild.members.me.joinedTimestamp > Date.now() + TWO_MONTH )
			return;

		
 
	  	const guildData = guild.data;
	  	const now = new Date();
 
	  	const generateEndDate = () => {
			const days = DataManager.data.bot.currentDay;
		 	guildData.boss.endingAtDay = days + 3;
	  	}
 
	  	const generateNextApparance = () => {
 
		 	// the boss cannot spawn on other days
		 	const MIN = 1;
		 	const MAX = 28;
		 	const date = new Date(now.getFullYear(), now.getMonth() + 1, Util.random(MIN, MAX));
		 	const days =  Math.floor(date.getTime() / 86_400_000);
		 	guildData.boss.apparanceAtDay = days;
	  	}
 
 
 
	  	if (!guildData.boss || !guildData.boss.isArrived && !guildData.boss.apparanceAtDay){
 
		 	guildData.boss = {};
		 	generateNextApparance();
	  	}
 
	  	if (guildData.boss.endingAtDay <= DataManager.data.bot.currentDay){
		 	await BossManager.beforeEnd(guild);
		 	delete guildData.boss;
		 	return;
	  	}
 
	  	if (guildData.boss.apparanceAtDay  <= DataManager.data.bot.currentDay){
		 	generateEndDate();
		 	delete guildData.boss.apparanceAtDay;
 
		 	BossManager.initBossData(guildData.boss, guild);
	  	}
 
	}
 
	static getUserStats(boss, id){
	  if (typeof id !== "string"){
		 throw new TypeError("Expected id");
	  }
 
	  const bossUsers = boss.users;
	  if (id in bossUsers === false)
		 bossUsers[id] = { messages: 0 };
 
	  return bossUsers[id];
	}
 
	static onMessage(message){
	  const boss = message.guild.data.boss;
	  const authorId = message.author.id;
 
	  const userStats = this.getUserStats(boss, authorId);
	  userStats.messages++;
 
	  const DEFAULT_DAMAGE = 1;
	  const damage = userStats.damagePerMessage ?? DEFAULT_DAMAGE;
	  BossManager.makeDamage(boss, damage, {sourceUser: message.author});
	}
 
	static calculateHealthPoint(level){
	  return 7_000 + Math.floor(level * 500 * 1.2 ** level);
	}
 
	static calculateHealthPointThresholder(level){
	  const totalOfPrevious = [...new Array(level - 1)]
		 .map((_, level) => BossManager.calculateHealthPoint(level))
		 .reduce((acc, points) => acc + points, 0);
 
	  return BossManager.calculateHealthPoint(level) + totalOfPrevious;
	}
 
 
	static makeDamage(boss, damage, {sourceUser} = {}){
	  damage *= (boss.diceDamageMultiplayer ?? 1);
	  damage = Math.floor(damage);
 
 
	  boss.damageTaken += damage;
 
	  if (sourceUser){
		 const stats = BossManager.getUserStats(boss, sourceUser.id);
		 stats.damageDealt ||= 0;
		 stats.damageDealt += damage;
 
		 sourceUser.action(Actions.bossMakeDamage, {boss, damage});
	  }
 
	  if (boss.damageTaken >= boss.healthThresholder){
		 BossManager.kill({boss, sourceUser})
	  }

	  return damage;
	}
 
	static kill({boss, sourceUser}){
	  const expReward = 500 + 500 * boss.level;
		 const mainContent = sourceUser ? `${ sourceUser.username } наносит пронзающий удар и получает ${ expReward } <:crys2:763767958559391795>` : "Пронзительный удар из ни откуда нанёс критический для босса урон";
		 if (sourceUser){
			sourceUser.data.exp += expReward;
		 }
		 
		 const guild = this.client.guilds.cache.get(boss.guildId);
		 const footer = {text: "Образ переходит в новую стадию", iconURL: sourceUser ? sourceUser.avatarURL() : guild.iconURL()};
		 guild.chatSend({description: `Слишком просто! Следующий!\n${ mainContent }`, footer});
		 BossManager.createBonusesChest({guild, boss, thatLevel: boss.level});
		 boss.level++;
		 boss.healthThresholder = BossManager.calculateHealthPointThresholder(boss.level);
 
		 Object.values(boss.users)
			.forEach(userStats => delete userStats.attack_CD);
	}
 
	static async createBonusesChest({guild, boss, thatLevel}){
	  const color = "ffda73";
	  const embed = {
		 title: "Сундук с наградами",
		 description: `Получите бонусы за победу над боссом ур. ${ thatLevel }.\nВремя ограничено двумя часами с момента отправки этого сообщения.`,
		 thumbnail: "https://media.discordapp.net/attachments/629546680840093696/1038767024643522600/1476613756146739089.png?width=593&height=593",
		 footer: {text: "Внимание, вы можете получить награду не более чем из одного сундука за время пребывания босса"},
		 color,
		 reactions: ["637533074879414272"]
	  };
 
	  const calculateReward = (level) => 120 + level * 10;
 
	  const message = await guild.chatSend(embed);
	  const collector = message.createReactionCollector({filter: (reaction) => !reaction.me, time: 3_600_000 * 2});
	  collector.on("collect", (_reaction, user) => {
		 const userStats = BossManager.getUserStats(boss, user.id);
  
		 if ("chestRewardAt" in userStats){
			message.msg({title: `Вы уже взяли награду на ур. ${ userStats.chestRewardAt }`, delete: 5000});
			return;
		 };
 
		 const reward = calculateReward(thatLevel);
		 userStats.chestRewardAt = thatLevel;
		 user.data.chestBonus = (user.data.chestBonus ?? 0) + reward;
		 message.msg({description: `Получено ${  Util.ending(reward, "бонус", "ов", "", "а") } для сундука <a:chest:805405279326961684>`, color, delete: 7000});
	  })
 
	  collector.on("end", () => message.delete());
	}
 
	static async beforeApparance(guild){
 
	  const data = guild.data;
 
	  if (!data.boss){
		 return;
	  }
 
 
	  const isApparanceAtNextDay = () => {
		 return data.boss.apparanceAtDay === DataManager.data.bot.currentDay + 1;
	  }
 
	  if (!isApparanceAtNextDay()){
		 return;
	  }
 
	  await Util.sleep(3000);
 
	  const descriptionImage = `Настоящий босс — это здравый смысл внутри каждого из нас. И всем нам предстоит с ним сразится.`;
	  const descriptionFacts = `<a:bigBlack:829059156069056544> С завтрашенего дня, в течении трёх дней, босс будет проходить по землям сервера в определенном образе. За это время нанесите как можно больше урона.\nПосле его появления на сервере будет доступна команда **!босс**, а по-завершению участники получат небольшую награду`;
	  const description = `${ descriptionImage }\n\n${ descriptionFacts }`;
 
	  const embed = {
		 color: "210052",
		 description
	  }
  
	  await guild.chatSend(embed);
	}
 
	static async beforeEnd(guild){
	  const boss = guild.data.boss;
	  const client = guild.client;
 
	  if (boss.level > 1 === false){
		 guild.chatSend({content: "Босс покинул сервер в страхе..."});
		 return;
	  }
	  
 
	  const contents = {
		 dice: `Максимальный бонус к урону от кубика: Х${ +((boss.diceDamageMultiplayer ?? 1) - 1).toFixed(2) };`,
		 damageDealt: `Совместными усилиями участники сервера нанесли ${ boss.damageTaken } единиц урона`,
		 usersCount: `Приняло участие: ${  Util.ending(Object.keys(boss.users).length, "человек", "", "", "а") }`,
		 parting: boss.level > 3 ? "Босс остался доволен.." : "Босс недоволен..",
		 rewards: "Награды:",
		 voidCount: "Всего нестабильности:"
	  }
	  
	  const getUsetsRewardTable = () => {
		 const table = {};
		 const rewardsCount = Math.floor(boss.level ** 1.2);
		 getUsetsRewardTable.rewardsCount = rewardsCount;
		 
		 const usersOdds = Object.entries(boss.users)
			.filter(([id]) => guild.members.cache.has(id))
			.map(([id, {damageDealt: _weight}]) => ({id, _weight}))
			.filter(({_weight}) => _weight);
			
		 for (let i = 0; i < rewardsCount; i++){
			const id = usersOdds.random({_weights: true})
			  .id;
			
			table[id] ||= 0;
			table[id] += 1;
		 }
		 
		 return table;
	  }
	 
	  const usersTable = getUsetsRewardTable();
	  
	  Object.entries(usersTable).forEach(([id, voidCount]) => {
		 const user = client.users.cache.get(id);
		 user.data.void += voidCount;
	  })
 
	  const fields = Object.entries(usersTable).map(([id, voidCount]) => {
		 const user = client.users.cache.get(id);
		 const damage = boss.users[id].damageDealt;
		 const value = `Нестабильности: \`${ voidCount }\`;\nУрона: ${ damage }ед.`;
		 return {name: user.username, value, inline: true};
	  });
		 
	  const footer = {
	    text: `${ contents.voidCount } ${ getUsetsRewardTable.voidCount }`
	    iconURL: guild.iconURL()
	  };
 
	  const description = `${ contents.dice }\n\n${ contents.damageDealt }. ${ contents.usersCount }. ${ contents.parting }`;
	  const embed = {
		 title: "Среди ночи босс покинул этот сервер",
		 description,
		 fields,
		 footer
	  };
	  guild.chatSend(embed);
	}
 
	static initBossData(boss, guild){
	  boss.level = 1;
	  boss.users = {};
	  boss.isArrived = true;
	  boss.damageTaken = 0;
	  boss.type = this.BOSS_TYPES.random();
 
	  boss.guildId = guild.id;
	  boss.healthThresholder = BossManager.calculateHealthPointThresholder(boss.level);
	}
 
	static userAttack({boss, user, channel}){
	  const userStats = BossManager.getUserStats(boss, user.id);
	  
	  userStats.attack_CD ||= 0;
	  userStats.attackCooldown ||= this.USER_DEFAULT_ATTACK_COOLDOWN;
 
	  const footer = {iconURL: user.avatarURL(), text: user.tag};
	  if (userStats.attack_CD > Date.now()){
		 const description = `**${ Util.timestampToDate(userStats.attack_CD - Date.now()) }**. Дождитесь подготовки перед атакой.`;
		 channel.msg({title: "⚔️ Перезарядка..!", color: "ff0000", description, delete: 7000, footer});
		 return;
	  }
 
	  
	  userStats.attack_CD = Date.now() + userStats.attackCooldown;
 
	  
	  const attackContext = {
		 damageMultiplayer: 1,
		 listOfEvents: []
	  };
	  const pull = [...BossManager.eventBases.values()];
	  const data = {user, userStats, boss, channel, attackContext};
	  const eventsCount = Math.floor(boss.level ** 0.5) + Util.random(-1, 1);
  
	  for (let i = 0; i < eventsCount; i++){
		 for (const event of pull){
			const needSkip = event.filter && !event.filter(data);
			
			if (needSkip){
			  const index = pull.indexOf(event);
			  (~index) ? pull.splice(index, 1) : null;
			}
		 };
 
		 const event = pull.random({weights: true});
		 if (!event){
			break;
		 }
		 if (!event.repeats){
			const index = pull.indexOf(event);
			~index ? pull.splice(index, 1) : null;
		 }
 
		 try {
			event.callback(data);
		 }
		 catch (error){
			channel.msg({title: `Источник исключения: ${ event.id }. Он был убран из списка возможных событий на неопределенный срок`, description: `**${ error.message }:**\n${ error.stack }`});
			BossManager.eventBases.delete(event.id);
		 }
		 attackContext.listOfEvents.push(event);
	  }
 
	  const damage = Math.ceil((userStats.attacksDamageMultiplayer ?? 1) * this.USER_DEFAULT_ATTACK_DAMAGE * attackContext.damageMultiplayer);
	  attackContext.defaultDamageDealt = attackContext.damageDealt = damage;
	  BossManager.makeDamage(boss, damage, {sourceUser: user});
 
	  
 
	  const eventsContent = attackContext.listOfEvents.map(event => `・ ${ event.description }.`).join("\n");
	  const description = `Нанесено урона с прямой атаки: ${ damage }ед.\n\n${ eventsContent }`;
	  const embed = {
		 title: `⚔️ За сервер ${ channel.guild.name }!`,
		 description,
		 footer
	  }
	  channel.msg(embed);
	}
 
	static async createShop({guild, channel, user}){
		const boss = guild.data.boss;
	  	const ITEMS = new Collection(Object.entries({
			"🧩": {
				emoji: "🧩",
				keyword: "puzzle",
				description: "Множитель атаки: 1.25",
				basePrice: 100,
				priceMultiplayer: 2,
				callback: ({userStats}) => {
			  		const multiplier = 1.25;
			  		userStats.attacksDamageMultiplayer = +(
				 		(userStats.attacksDamageMultiplayer ?? 1) *
				 		multiplier
			  		).toFixed(3);
				}
		 	},
		 	"🐺": {
				emoji: "🐺",
				keyword: "wolf",
				description: "Перезарядка атаки в 2 раза меньше",
				basePrice: 50,
				priceMultiplayer: 1.75,
				callback: ({userStats}) => {
			  		userStats.attackCooldown ||= this.USER_DEFAULT_ATTACK_COOLDOWN;
			  		userStats.attackCooldown = Math.floor(userStats.attackCooldown / 2);
		
			  		userStats.attack_CD -= userStats.attackCooldown;
				}
		 	},
		 	"🥛": {
				emoji: "🥛",
				keyword: "milk",
				description: "Снимает негативные и нейтральные эффекты",
				basePrice: 200,
				priceMultiplayer: 3,
				callback: ({userStats}) => {
			 		if (!userStats.effects){
				 		return false;
			  		}
			  		const toRemove = userStats.effects
						.filter(effect => {
							const base = BossManager.effectBases.get(effect.id);
							return base.influence === "negative" || base.influence === "neutral";
						});
 
			  		while (toRemove.length){
				 		const effect = toRemove.pop();
				 		const index = userStats.effects.indexOf(effect);
				 		if (~index){
							userStats.effects.splice(index, 1);
				 		}
			  		};
				}
		 	},
		 	"📡": {
				emoji: "📡",
				keyword: "anntena",
				description: "На 2 больше урона за сообщение",
				basePrice: 1000,
				priceMultiplayer: 1.25,
				callback: ({userStats}) => {
			  		userStats.damagePerMessage ||= 1;
			  		userStats.damagePerMessage += 1;
				},
		 	},
		 	"🎲": {
				emoji: "🎲",
				keyword: "dice",
				description: "Урон участников сервера на 1% эффективнее",
				basePrice: 10,
				priceMultiplayer: 5,
				callback: ({boss}) => {
			  		boss.diceDamageMultiplayer ||= 1;
			  		boss.diceDamageMultiplayer += 0.01;
				},
		 	},
		 	"💥": {
				emoji: "💥",
				keyword: "meteor",
				damage: 30,
				damageMultiplayer: 4,
				description: ({userStats, product}) => {
					const bought = userStats.bought?.[product.keyword] ?? 0;
					return `Мгновенно нанесите боссу ${ product.damage * product.damageMultiplayer ** bought }ед. урона`;
				},
				basePrice: 25,
				priceMultiplayer: 5,
				callback: ({boss, user, userStats, product}) => {
					const bought = userStats.bought?.[product.keyword] ?? 0;
					const damage = product.damage * product.damageMultiplayer ** bought;
					BossManager.makeDamage(boss, damage, {sourceUser: user});
				}
			},
		 	"🪦": {
				emoji: "🪦",
				keyword: "headstone",
				description: "Полностью сбрасывает персонажа",
				basePrice: 300,
				priceMultiplayer: 10,
				callback: ({boss, user, userStats}) => {
			  		const keyword = "headstone";
			  		const currentBought = userStats.bought?.[keyword] ?? 0;
 
			  		delete boss.users[user.id];
			  		message.delete();
 
			  		userStats = BossManager.getUserStats(boss, user.id);
			  		userStats.bought = {[keyword]: currentBought};
				}
		 	}
	  	}));
	  	const createEmbed = ({boss, user, edit}) => {
			const data = user.data;

			const getDescription = (product) => typeof product.description === "function" ? product.description({userStats, boss, user, product}) : product.description;
 
			const productsContent = ITEMS
				.map((product) => `${ product.emoji } — ${ getDescription(product) }.\n${ calculatePrice(product, userStats.bought[product.keyword]) };`)
				.join("\n");
 
			const description = `Приобретите эти товары! Ваши экономические возможности: ${  Util.ending(data.coins, "монет", "", "а", "ы") } <:coin:637533074879414272> на руках\n\n${ productsContent }`;
 
		 	return {
				title: "Тайная лавка Гремпенса",
				author: {name: user.username, iconURL: user.avatarURL()},
				description,
				edit,
				reactions: edit ? [] : [...ITEMS.map(({emoji}) => emoji)]
			};
	  	}
 
		const userStats = BossManager.getUserStats(boss, user.id);
	  	userStats.bought ||= {};
 
	  	const calculatePrice = (item, boughtCount) => {
			const grossPrice = item.basePrice * item.priceMultiplayer ** (boughtCount ?? 0);
		 	const price = Math.floor(grossPrice - (grossPrice % 5));
		 	return price;
	  	}
	  
	  	let message = await channel.msg( createEmbed({boss, user, edit: false}) );
		const filter = (_reaction, member) => user.id === member.id;
	  	const collector = message.createReactionCollector({filter, time: 60_000});
 
	  	collector.on("collect", async (reaction, user) => {
		 	reaction.users.remove(user);
		 	const product = ITEMS.get(reaction.emoji.name);
		 	const currentBought = userStats.bought[ product.keyword ] ?? 0;
		 	const price = calculatePrice(product, currentBought);
 
		 	if (user.data.coins < price){
				message.msg({title: "Недостаточно средств!", delete: 3000});
				reaction.remove();
				return;
			}
 
		 	product.callback({ user, userStats, boss, product });
		 	userStats.bought[ product.keyword ] = currentBought + 1;
		 	user.data.coins -= price;
		 	message.msg({description: `${ product.emoji } +1`, delete: 7000});
		 	message = await message.msg( createEmbed({boss, user, edit: true}) );
	  	});
	  
	  	collector.on("end", () => message.reactions.removeAll());
	}
 
	static eventBases = new Collection(Object.entries({
	  increaseAttackCooldown: {
		 _weight: 5,
		 id: "increaseAttackCooldown",
		 description: "Перезарядка атаки больше на 20 минут",
		 callback: ({userStats}) => {
			userStats.attackCooldown ||= this.USER_DEFAULT_ATTACK_COOLDOWN;
			const adding = 60_000 * 20
			userStats.attackCooldown += adding;
			userStats.attack_CD += adding;
		 },
		 filter: ({attackContext}) => 
			!attackContext.listOfEvents.some(({id}) => ["reduceAttackDamage"].includes(id))      
	  },
	  increaseCurrentAttackDamage: {
		 _weight: 15,
		 repeats: true,
		 id: "increaseAttackCooldown",
		 description: "Урон текущей атаки был увеличен",
		 callback: ({attackContext}) => {
			attackContext.damageMultiplayer *= 5;
		 }     
	  },
	  giveChestBonus: {
		 _weight: 4,
		 id: "giveChestBonus",
		 description: "Выбито 4 бонуса сундука",
		 callback: ({user}) => {
			user.data.chestBonus = (user.data.chestBonus ?? 0) + 4;
		 }     
	  },
	  applyCurse: {
		 _weight: 3,
		 id: "applyCurse",
		 description: "Вас прокляли",
		 callback: ({user, boss}) => {
			const hard = Math.min(
			  Math.floor(boss.level / 3),
			  2
			 );
			const curse = CurseManager.generate({user, hard});
			CurseManager.init({user, curse});
		 },
		 filter: ({user}) => !user.data.curses?.length || user.data.voidFreedomCurse     
	  },
	  improveDamageForAll: {
		 _weight: 5,
		 id: "improveDamageForAll",
		 description: "Урон по боссу увеличен на 1%",
		 callback: ({user, boss}) => {
			boss.diceDamageMultiplayer ||= 1;
			boss.diceDamageMultiplayer += 0.01;
		 },
		 filter: ({boss}) => boss.diceDamageMultiplayer 
	  },
	  choiseAttackDefense: {
		 _weight: 2,
		 id: "choiseAttackDefense",
		 description: "Требуется совершить выбор",
		 callback: async ({user, boss, channel, userStats}) => {
			const reactions = ["⚔️", "🛡️"];
			const embed = {
			  author: {name: user.username, iconURL: user.avatarURL()},
			  description: "Вас атакуют!\n— Пытаться контратаковать\n— Защитная поза",
			  reactions,
			  footer: {iconURL: user.avatarURL(), text: "Вы можете проигнорировать это сообщение"}
			}
 
			channel.sendTyping();
			await Util.sleep(2000);
 
			const message = await channel.msg(embed);
			const filter = ({emoji}, member) => user === member && reactions.includes(emoji.name);
			const collector = message.createReactionCollector({filter, time: 30_000, max: 1});
			collector.on("collect", (reaction) => {
			  const isLucky = Util.random(0, 1);
			  const emoji = reaction.emoji.name;
 
			  if (emoji === "⚔️" && isLucky){
				 const content = "Успех! Нанесено 125 урона";
				 message.msg({description: content});
				 BossManager.makeDamage(boss, 125, {sourceUser: user});
				 return;
			  }
 
			  if (emoji === "⚔️" && !isLucky){
				 const content = "После неудачной контратаки ваше оружие ушло на дополнительную перезарядку";
				 message.msg({description: content});
				 userStats.attack_CD += 3_600_000;
				 return;
			  }
 
			  if (emoji === "🛡️" && isLucky){
				 const content = "Успех! Получено 1000 золота";
				 message.msg({description: content});
				 user.data.coins += 1000;
				 return;
			  }
 
			  if (emoji === "🛡️" && !isLucky){
				 const content = "После неудачной защиты ваше оружие ушло на дополнительную перезарядку";
				 message.msg({description: content});
				 userStats.attack_CD += 3_600_000;
				 return;
			  }
			});
 
			collector.on("end", () => message.delete());
		 }
	  },
	  choiseCreatePotion: {
		 _weight: 1,
		 id: "choiseCreatePotion",
		 description: "Требуется совершить выбор",
		 callback: async ({user, boss, channel, userStats, attackContext}) => {
			const reactions = ["🧪", "🍯", "🩸"];
			const embed = {
			  author: {name: user.username, iconURL: user.avatarURL()},
			  description: "Сварите правильный эликсир\n— 🧪 Добавить больше порошка\n— 🍯 Подсыпать пудры\n— 🩸 Средство для усиления эффекта",
			  reactions,
			  footer: {iconURL: user.avatarURL(), text: "Используйте три реакции для наилучшего эффекта"}
			}
 
			channel.sendTyping();
			await Util.sleep(2000);
 
			const ingredients = [];
 
			const createSpell = (ingredients) => {
			  const spellsTable = {
				 "🧪🧪🧪": {
					description: "Создаёт особый котёл, который уменьшает перезарядку атаки каждого, кто использует его. Однако его длительность ограничена одним часом или пятью использованиями!",
					callback: async (message, _embed) => {
					  await message.react("🧪");
					  const collector = message.createReactionCollector({time: 3_600_000});
					  const gotTable = {};
					  collector.on("collect", (_reaction, user) => {
						 if (user.id in gotTable){
							message.msg({title: "Вы уже воспользовались котлом", color: "ff0000", delete: 3000});
							return;
						 }
 
						 if (Object.keys(gotTable) >= 5){
							collector.stop();
						 }
 
						 gotTable[user.id] = true;
						 const userStats = BossManager.getUserStats(boss, user.id);
						 const current = userStats.attackCooldown;
						 userStats.attackCooldown = Math.floor(userStats.attackCooldown * 0.80);
 
						 const description = `Кулдаун снизился на ${ Util.timestampToDate(current - userStats.attackCooldown) }`;
			
						 message.msg({description, footer: {iconURL: user.avatarURL(), text: user.tag}, delete: 8000});
					  });
 
					  collector.on("end", () => message.reactions.removeAll());
					}
				 },
				 "🧪🧪🍯": {
					description: "Создаёт особый котёл, который дарует богатсва каждому, кто использует его. Однако его длительность ограничена одним часом или пятью использованиями!",
					callback: async (message, _embed) => {
					  await message.react("🍯");
					  const collector = message.createReactionCollector({time: 3_600_000});
					  const gotTable = {};
					  collector.on("collect", (_reaction, user) => {
						 if (user.id in gotTable){
							message.msg({title: "Вы уже воспользовались котлом", color: "ff0000", delete: 3000});
							return;
						 }
 
						 if (Object.keys(gotTable) >= 5){
							collector.stop();
						 }
 
						 gotTable[user.id] = true;
 
						 user.data.chestBonus ||= 0;
						 user.data.chestBonus += 7;
						 const description = `Получено 7 бонусов сундука`;
			
						 message.msg({description, footer: {iconURL: user.avatarURL(), text: user.tag}, delete: 8000});
					  });
 
					  collector.on("end", () => message.reactions.removeAll());
					}
				 },
				 "🧪🧪🩸": {
					description: "Сбрасывает перезарядку на атаку и уменьшает постоянный кулдаун в полтора раза",
					callback: (_message, _embed) => {
					  delete userStats.attack_CD;
					  userStats.attackCooldown = Math.floor(userStats.attackCooldown / 1.5);
					}
				 },
				 "🧪🍯🍯": {
					description: "Значительно уменьшает цену на волка из лавки босса",
					callback: (_message, _embed) => {
					  userStats.bought ||= {};
					  userStats.bought.wolf ||= 0;
					  userStats.bought.wolf -= 2;
					}
				 },
				 "🧪🩸🩸": {
					description: "Значительно уменьшает цену на пазл из лавки босса",
					callback: (_message, _embed) => {
					  userStats.bought ||= {};
					  userStats.bought.puzzle ||= 0;
					  userStats.bought.puzzle -= 2;
					}
				 },
				 "🍯🍯🍯": {
					description: "Вы мгновенно получаете 35 бонусов сундука!",
					callback: (_message, _embed) => {
					  user.data.chestBonus ||= 0;
					  user.data.chestBonus += 35;
					}
				 },
				 "🩸🩸🩸": {
					description: "Босс теряет 10% от своего текущего здоровья",
					callback: (message, embed) => {
					  const thresholder = BossManager.calculateHealthPointThresholder(boss.level);
					  const currentHealth = thresholder - boss.damageTaken;
					  const damage = Math.floor(currentHealth * 0.10);
					  BossManager.makeDamage(boss, damage, {sourceUser: user});
 
					  embed.edit = true;
					  embed.author = {name: `Нанесено ${ damage }ед. урона`};
					  message.msg(embed);
					}
				 },
				 "🧪🍯🩸": {
					description: "Вы попросту перевели продукты..",
					callback: (_message, _embed) => {
 
					}
				 },
				 "🍯🍯🩸": {
					description: "Вы попросту перевели продукты..",
					callback: (_message, _embed) => {
 
					}
				 },
				 "🍯🩸🩸": {
					description: "Наносит ещё одну атаку с увеличенным уроном. Множитель урона Х4",
					callback: (message, embed) => {
					  const previousDamage = attackContext.damageDealt;
					  const damage = previousDamage * 4;
					  BossManager.makeDamage(boss, damage, {sourceUser: user});
 
					  embed.edit = true;
					  embed.author = {name: `Нанесено ${ damage }ед. урона`};
					  message.msg(embed);
					}
				 }
			  }
 
			  const sort = (a, b) => reactions.indexOf(a) > reactions.indexOf(b) ? 1 : -1;
 
			  const key = ingredients.sort(sort).join("");
			  const {callback, description} = spellsTable[key];
			  return {callback, description};
			}
 
 
			const message = await channel.msg(embed);
			const filter = ({emoji}, member) => user === member && reactions.includes(emoji.name);
			const collector = message.createReactionCollector({filter, time: 90_000});
			collector.on("collect", async (reaction, user) => {
			  reaction.users.remove(user);
 
			  const emoji = reaction.emoji.name;
 
			  
 
			  ingredients.push(emoji);
			  const MAX_INGEDIENTS = 3;
 
			  const ingredientsContent = `[__${ ingredients.join("") }__] + ${ ingredients.length }/${ MAX_INGEDIENTS }`;
			  await channel.msg({description: ingredientsContent, delete: 3000});
 
			  
 
 
			  if (ingredients.length === MAX_INGEDIENTS){
				 collector.stop();
 
				 if (!Util.random(0, 15)){
					const description = "Вы попросту перевели ресурсы, варево неудалось";
					channel.msg({title: "Мухомор, пудра, утконос", description, footer: {iconURL: user.avatarURL(), text: user.tag}});
					return;
				 }
 
				 const {callback, description} = createSpell(ingredients);
				 const embed = {
					title: "Трепещи, босс, я изобрёл нечто!",
					description,
					footer: {iconURL: user.avatarURL(), text: user.tag}
				 }
				 const message = await channel.msg(embed);
				 callback.call(null, message, embed);
			  }
 
			});
 
			collector.on("end", () => message.delete());
		 }
	  }
	  // ______e4example: {
	  //   _weight: 2,
	  //   id: "______e4example",
	  //   description: "Требуется совершить выбор",
	  //   callback: async ({user, boss, channel, userStats}) => {
	  //   }
	  // }
 
	}));
 
	static BOSS_TYPES = new Collection([
 
	].map((type, index) => [index, type]));
 
	static USER_DEFAULT_ATTACK_COOLDOWN = 3_600_000 * 2;
	static USER_DEFAULT_ATTACK_DAMAGE = 10;


	static setClient(client){
		this.client = client;
	}
}

export default BossManager;