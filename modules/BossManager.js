
import { Collection } from "@discordjs/collection";
import { DataManager, CurseManager, Properties, ErrorsHandler } from "#src/modules/mod.js";
import TimeEventsManager from '#src/modules/TimeEventsManager.js';
import { elementsEnum } from "#src/commands/thing.js";
import { Actions } from '#src/modules/ActionManager.js';
import * as Util from '#src/modules/util.js';


class BossShop {

	static async createShop({guild, channel, user}){
		const boss = guild.data.boss;

		const userStats = BossManager.getUserStats(boss, user.id);
		const boughtMap = (userStats.bought ||= {});
		

		const createEmbed = ({boss, user, edit}) => {
			const data = user.data;

			const getDescription = (product) => typeof product.description === "function" ? product.description({userStats, boss, user, product}) : product.description;

			const productsContent = this.PRODUCTS
				.map((product) => ({
					label: `${ product.emoji } — ${ getDescription(product) }.`,
					price: this.calculatePrice({ product, boughtCount: this.getBoughtCount({userStats, product}) }),
					product
				}))
				.map(({label, price, product}) => `${ label }\n${ price } ${ Properties.endingOf(product.resource, price) };`)
				.join("\n");

			const descriptionContent = `Приобретите эти товары! Ваши экономические возможности:\n${  Util.ending(data.coins, "монет", "", "а", "ы") } <:coin:637533074879414272> и ${ Util.ending(data.keys, "ключ", "ей", "", "а") } 🔩 на руках`;
			const description = `${ descriptionContent }\n\n${ productsContent }`;

			return {
				title: "Тайная лавка Гремпенса",
				author: {name: user.username, iconURL: user.avatarURL()},
				description,
				edit,
				reactions: edit ? [] : [...this.PRODUCTS.filter(product => this.isUserCanBuyProduct({user, product, userStats})).map(({emoji}) => emoji)]
			};
		}

		
		
	
		let message = await channel.msg( createEmbed({boss, user, edit: false}) );
		const filter = (_reaction, member) => user.id === member.id;
		const collector = message.createReactionCollector({filter, time: 60_000});

		collector.on("collect", async (reaction, user) => {
			reaction.users.remove(user);
			const product = this.PRODUCTS.get(reaction.emoji.name);
			const currentBought = this.getBoughtCount({userStats, product});
			
			const price = this.calculatePrice({
				product,
				boughtCount: currentBought
			});


			if (!this.isUserCanBuyProduct({user, product, userStats})){
				message.msg({title: "Недостаточно средств!", delete: 3000});
				reaction.remove();
				return;
			}

			product.callback({ user, userStats, boss, product });
			boughtMap[ product.keyword ] = currentBought + 1;
			user.data[ product.resource ] -= price;
			message.msg({description: `${ product.emoji } +1`, delete: 7000});
			message = await message.msg( createEmbed({boss, user, edit: true}) );
		});
	
		collector.on("end", () => message.reactions.removeAll());
	}

	static isUserCanBuyProduct({user, product, userStats}){
		return user.data[product.resource] >= this.calculatePrice({
			product,
			boughtCount: this.getBoughtCount({userStats, product})
		});
	}


	static getBoughtCount({userStats, product}){
		const boughtMap = userStats.bought ?? {};
		return boughtMap[ product.keyword ] || 0;
	}

	static calculatePrice({product, boughtCount}){
		const grossPrice = product.basePrice * product.priceMultiplayer ** (boughtCount ?? 0);
		const price = grossPrice > 30 ? Math.floor(grossPrice - (grossPrice % 5)) : grossPrice;
		return price;
	}

	static PRODUCTS = new Collection(Object.entries({
		"🧩": {
			emoji: "🧩",
			keyword: "puzzle",
			description: "Множитель атаки: 1.25",
			basePrice: 100,
			priceMultiplayer: 2,
			resource: "coins",
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
			resource: "coins",
			callback: ({userStats}) => {
				userStats.attackCooldown ||= BossManager.USER_DEFAULT_ATTACK_COOLDOWN;
				userStats.attackCooldown = Math.floor(userStats.attackCooldown / 2);

				userStats.attack_CD -= userStats.attackCooldown;
			}
		},
		"📡": {
			emoji: "📡",
			keyword: "anntena",
			description: "На 1 больше урона за сообщение",
			basePrice: 1,
			priceMultiplayer: 2,
			resource: "keys",
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
			resource: "coins",
			callback: ({boss}) => {
				boss.diceDamageMultiplayer ||= 1;
				boss.diceDamageMultiplayer += 0.01;
			},
		}
	}));
}

class BossEvents {
	static onBossDeath(boss, context){
		const {fromLevel, toLevel} = context;
		const levels = [...new Array(toLevel - fromLevel)].map((_, i) => i + fromLevel);

		const modFive = levels.find(level => level % 5 === 0);
		if (modFive){
			this.events.get("bossNowHeals").callback(boss, context);
		}

		const precedesTen = levels.find(level => level - 1 === 10);
		if (precedesTen){
			this.events.get("notifyLevel10").callback(boss, context);
		}
	}

	static onTakeDamage(boss, context){

	}

	static beforeAttacked(){

	}

	static afterAttacked(){

	}

	static beforeDeath(boss, context){
		const MAXIMUM_LEVEL = BossManager.MAXIMUM_LEVEL;
		const transition = context.fromLevel < MAXIMUM_LEVEL && context.toLevel > MAXIMUM_LEVEL;
		if (transition){
			context.possibleLevels = MAXIMUM_LEVEL;
		}
		return;
	}

	static events = new Collection(Object.entries({
		bossNowHeals: {
			id: "bossNowHeals",
			callback(){

			}
		},
		notifyLevel10: {
			id: "notifyLevel10",
			callback(boss, context){
				const now = Date.now();
				const contents = {
					time: Util.timestampToDate(now - (boss.endingAtDay - BossManager.BOSS_DURATION_IN_DAYS) * 86_400_000)
				};
				const description = `**10-й уровень за ${ contents.time }**\n\nС момента достижения этого уровня босс станет сложнее, а игроки имеют шанс получить осколки реликвий. Соберите 5 штук, чтобы получить случайную из них`;
				context.channel.msg({
					description,
					color: BossManager.MAIN_COLOR
				});
			}
		}
	}));
}

class BossEffects {
	static applyEffect({effectBase, guild, user, values = {}}){
		const effects = (user.data.bossEffects ||= []);
		const callbackMap = (user.data.bossEffectsCallbackMap ||= {});
		Object.keys(effectBase.callback).forEach(callbackKey => {
			callbackMap[callbackKey] = true;
		});

		
		const effect = {
			id: effectBase.id,
			guildId: guild.id,
			timestamp: Date.now(),
			values: {}
		};

		Object.entries({...effectBase.values, ...values})
			.forEach(([key, fn]) => effect.values[key] = typeof fn === "function" ? fn(user, effect, guild) : fn);

		const context = {
			effect,
			defaultPrevented: false,
			preventDefault(){
				this.defaultPrevented = true;
			}
		};
		user.action(Actions.bossBeforeEffectInit, context);

		if (context.defaultPrevented){
			return;
		};

		if (effect.values.timer){
			const args = [user.id, effect.timestamp];
			TimeEventsManager.create("boss-effect-timeout-end", effect.values.timer, args);
		}

		effects.push(effect);
		user.action(Actions.bossEffectInit, effect);
		return effect;
	}

	static removeEffect({effect, user}){

		const index = user.data.bossEffects.indexOf(effect);
		if (index === -1){
			return null;
		}
	
		user.data.bossEffects.splice(index, 1);

		const needRemove = (callbackKey) => !user.data.bossEffects.some(({id}) => callbackKey in this.effectBases.get(id).callback);
		const callbackMap = user.data.bossEffectsCallbackMap;
		Object.keys(callbackMap).filter(needRemove)
			.forEach(key => delete callbackMap[key]);
	}

	static effectsOf({boss, user}){
		return user.data.bossEffects?.filter(({guildId}) => guildId === boss.guildId) ?? [];
	}

	static effectBases = new Collection(Object.entries({
		increaseDamageByAfkTime: {
			id: "increaseDamageByAfkTime",
			callback: {
				bossBeforeAttack: (user, effect, data) => {
					const {attackContext} = data;
					const {power, lastAttackTimestamp} = effect.values;
					attackContext.damageMultiplayer += (Date.now() - lastAttackTimestamp) * power;

					effect.values.lastAttackTimestamp = Date.now();
				}
			},
			values: {
				power: () => 1 / 100_000,
				lastAttackTimestamp: () => Date.now()
			},
			influence: "positive"
		},
		increaseDamageByBossCurrentHealthPoints: {
			id: "increaseDamageByBossCurrentHealthPoints",
			callback: {
				bossBeforeAttack: (user, effect, data) => {
					const {attackContext, boss} = data;
					const {power} = effect.values;

					const thresholder = BossManager.calculateHealthPointThresholder(boss.level);
					const currentHealth = thresholder - boss.damageTaken;
					const damage = Math.floor(currentHealth * power);
					attackContext.baseDamage += damage;
				}
			},
			values: {
				power: () => 0.001
			},
			influence: "positive"
		},
		increaseAttackEventsCount: {
			id: "increaseAttackEventsCount",
			callback: {
				bossBeforeAttack: (user, effect, data) => {
					const {attackContext} = data;
					const {power} = effect.values;
					attackContext.eventsCount += power;
				}
			},
			values: {
				power: () => 1
			},
			influence: "positive"
		},
		increaseDamageForBoss: {
			id: "increaseDamageForBoss",
			callback: {
				bossBeforeAttack: (user, effect, data) => {
					const {boss} = data;
					const {power} = effect.values;
					boss.legendaryWearonDamageMultiplayer ||= 1;
					boss.legendaryWearonDamageMultiplayer += power;
				}
			},
			values: {
				power: () => 1 / 100_000
			},
			influence: "positive"
		},
		increaseDamageWhenStrictlyMessageChallenge: {
			id: "increaseDamageWhenStrictlyMessageChallenge",
			callback: {
				messageCreate: (user, effect, message) => {
					const values = effect.values;
					const userStats = BossManager.getUserStats(message.guild.data.boss, message.author.id);

					const currentHour = Math.floor(Date.now() / 3_600_000);

					const hoursMap = (values.hoursMap ||= {});

					if (currentHour in hoursMap === false){
						hoursMap[currentHour] = 0;
						const previousHourMessages = Object.entries(hoursMap)
							.reduce((acc, entrie) => +acc.at(0) > +entrie.at(0) ? acc : entrie, [])
							.at(1);

						if (previousHourMessages === values.goal){
							userStats.damagePerMessage = Math.ceil(
								(userStats.damagePerMessage || 1)
								* values.power + values.basic
							);
							message.react("685057435161198594");
						}
					}
					
					hoursMap[currentHour]++;
					if (hoursMap[currentHour] === values.goal){
						message.react("998886124380487761");
					}

					if (hoursMap[currentHour] === values.goal + 1){
						message.react("🫵");
					}
				}
			},
			values: {
				power: () => 1.5,
				basic: () => 2,
				goal: () => 30,
				hours: () => {}
			},
			influence: "positive"
		},
		deadlyCurse: {
			id: "deadlyCurse",
			callback: {
				curseTimeEnd: (user, effect, {curse}) => {
					if (effect.values.targetTimestamp !== curse.timestamp){
						return;
					}
					const guild = BossManager.client.guilds.cache.get(effect.guildId);
					
					if (!BossManager.isArrivedIn(guild)){
						return;
					}
					const userStats = BossManager.getUserStats(guild.data.boss, user.id);
					userStats.heroIsDead = true;
				},
				curseEnd: (user, effect, curse) => {
					const effectValues = effect.values;

					if (effectValues.targetTimestamp !== curse.timestamp){
						return;
					}

					BossEffects.removeEffect({effect, user});
				},
				bossEffectInit: (user, effect, initedEffect) => {
					if (initedEffect.timestamp !== effect.timestamp){
						return;
					}

					const isShort = curseBase => curseBase.interactionIsShort;
					const curseBase = CurseManager.getGeneratePull(user)
						.filter(isShort)
						.random({_weights: true});

					const curse = CurseManager.generateOfBase({curseBase, user});
					curse.values.timer = effect.values.time;
					CurseManager.init({curse, user});

					effect.values.targetTimestamp = curse.timestamp;

					if (effectValues.keepAliveUserId){
						const userStats = BossManager.getUserStats(guild.data.boss, effectValues.keepAliveUserId);
						userStats.alreadyKeepAliveRitualBy = user.id;
					}
				},
				bossEffectEnd: (user, effect, target) => {
					if (effect.timestamp !== target.timestamp){
						return;
					}
					
					const guild = BossManager.client.guilds.cache.get(effect.guildId);
					if (!BossManager.isArrivedIn(guild)){
						return;
					}
					const userStats = BossManager.getUserStats(guild.data.boss, user.id);
					if (userStats.heroIsDead){
						return;
					}

					if (effectValues.keepAliveUserId){
						const userStats = BossManager.getUserStats(guild.data.boss, effectValues.keepAliveUserId);
						delete userStats.isHeroDeath;
						delete userStats.alreadyKeepAliveRitualBy;
					}
				}
			},
			values: {
				time: () => 60_000 * 5
			},
			influence: "negative",
			canPrevented: false
		},
		preventNegativeEffects: {
			id: "preventNegativeEffects",
			callback: {
				bossBeforeEffectInit: (user, effect, context) => {
					const target = context.effect;
					const effectBase = CurseManager.cursesBase.get(target.id);
					if (effectBase.influence !== "negative" && effectBase.influence !== "neutral"){
						return;
					}

					if (effectBase.canPrevented){
						return;
					}

					effect.values.count--;
					context.preventDefault();
					if (!effect.values.count){
						BossEffects.removeEffect({user, effect});
					}
				}
			},
			values: {
				count: () => 1
			},
			influence: "positive"
		},
		increaseAttackDamage: {
			id: "increaseAttackDamage",
			callback: {
				bossBeforeAttack: (user, effect, {attackContext}) => {
					attackContext.damageMultiplayer *= effect.values.power;

					effect.values.duration--;
					if (!effect.values.duration){
						BossEffects.removeEffect({user, effect});
					}
				}
			},
			values: {
				power: 2,
				duration: 1
			},
			influence: "positive"
		}
	}));
}

class BossRelics {
	static collection = new Collection(Object.entries({
		"to-do: rename1": {
			id: "to-do: rename1"
		}
	}));

	static isUserHasRelic({relic, userData}){
		return !!userData.bossRelics?.includes(relic.id);
	}
}

const LegendaryWearonList = new Collection(Object.entries({
	afkPower:
	{
		description: "Урон ваших атак будет расти за время простоя",
		effect: "increaseDamageByAfkTime",
		emoji: "❄️",
		values: {
			power: () => 1 / (60_000 * 10)
		}
	},
	percentDamage:
	{
		description: "Базовый урон атак равен 0.05% от текущего здоровья босса",
		effect: "increaseDamageByBossCurrentHealthPoints",
		emoji: "🩸",
		values: {
			power: () => 0.0005
		}
	},
	manyEvent:
	{
		description: "Увеличивает количество событий атаки на 3",
		effect: "increaseAttackEventsCount",
		emoji: "✨",
		values: {
			power: () => 3
		}
	},
	togetherWeAre: 
	{
		description: "Каждая ваша атака увеличивает урон по боссу независимо от кубика",
		effect: "increaseDamageForBoss",
		emoji: "💧",
		values: {
			power: () => 0.0005
		}
	},
	complexWork:
	{
		description: "Отправляйте строго по 30 сообщений в час, чтобы на следующий период времени получить прибавку к урону",
		effect: "increaseDamageWhenStrictlyMessageChallenge",
		emoji: "🎈",
		values: {
			power: () => 1.1,
			basic: () => 20
		}
	}
}));

class BossManager {
	static MAIN_COLOR = "";
	static ELITE_MAIN_COLOR = "";
	static BOSS_DURATION_IN_DAYS = 3;
	static MAXIMUM_LEVEL = 100;

	static async bossApparance(guild){

		const TWO_MONTH = 5_259_600_000;

		if ( guild.members.me.joinedTimestamp > Date.now() + TWO_MONTH )
			return;

		

		const guildData = guild.data;
		const now = new Date();

		const generateEndDate = () => {
			const days = DataManager.data.bot.currentDay;
			guildData.boss.endingAtDay = days + this.BOSS_DURATION_IN_DAYS;
		}

		const generateNextApparance = () => {

			// the boss cannot spawn on other days
			const MIN = 1;
			const MAX = 28;
			const date = new Date(now.getFullYear(), now.getMonth() + 1, Util.random(MIN, MAX));
			const days = Math.floor(date.getTime() / 86_400_000);
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

		if (guildData.boss.apparanceAtDay <= DataManager.data.bot.currentDay){
			generateEndDate();
			delete guildData.boss.apparanceAtDay;

			BossManager.initBossData(guildData.boss, guild);
		}

	}

	static isArrivedIn(guild){
		const boss = guild.data.boss;
		if (!boss){
			return false;
		}

		return !!boss.isArrived;
	}

	static isElite(boss){
		return boss.level >= 10;
	}

	static isDefeated(boss){
		return boss.isDefeated;
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
	
	static calculateBossDamageMultiplayer(boss, {context = {}, sourceUser = {}} = {}){
		let multiplier = 1;
		multiplier *= (boss.diceDamageMultiplayer ?? 1);
		multiplier *= (boss.legendaryWearonDamageMultiplayer ?? 1);

		if (context.restoreHealthByDamage){
			multiplier *= -context.restoreHealthByDamage;
		}

		return multiplier;
	}

	static makeDamage(boss, damage, {sourceUser, damageSourceType} = {}){
		const baseDamage = damage;
		damage *= this.calculateBossDamageMultiplayer(boss, {sourceUser, context: {
			restoreHealthByDamage: sourceUser.effects?.damageRestoreHealht ?? false
		}});
		damage = Math.floor(damage);

		if (isNaN(damage)){
			throw new TypeError("Damage not a Number");
		}
	
	
		const context = {boss, damage, damageSourceType, sourceUser, baseDamage};
		boss.damageTaken += damage;
	
		if (sourceUser){
			const stats = BossManager.getUserStats(boss, sourceUser.id);
			stats.damageDealt ||= 0;
			stats.damageDealt += damage;
	
			sourceUser.action(Actions.bossMakeDamage, context);
		}

		if (damageSourceType){
			const damageStats = boss.stats.damage;
			damageStats[damageSourceType] ??= 0;
			damageStats[damageSourceType] += damage;
		}

		BossEvents.onTakeDamage(boss, context);


		
	
		if (boss.damageTaken >= boss.healthThresholder){
			BossManager.fatalDamage(context);
		}

		return damage;
	}

	static fatalDamage(context){
		const calculatePossibleLevels = (boss) => {
			let currentLevel = boss.level - 1;
			let healthThresholder;
			do {
				currentLevel++;
				healthThresholder = BossManager.calculateHealthPointThresholder(currentLevel);
			} while (boss.damageTaken >= healthThresholder);

			return currentLevel;
		};
		const {boss} = context;
		Object.assign(context, {
			possibleLevels: calculatePossibleLevels(boss),
			preventDefault(){
				this.defaultPrevented = true;
			},
			defaultPrevented: false
		})

		BossEvents.beforeDeath(boss, context);
		if (context.defaultPrevented){
			return;
		}

		BossManager.kill({...context, fromLevel: boss.level, toLevel: context.possibleLevels});
	}

	
	static calculateKillReward({fromLevel, toLevel}){
		const perLevel = 500 + (toLevel - fromLevel + 1) * 250;
		return perLevel * (toLevel - fromLevel);	
	}

	static kill(context){
		const {boss, sourceUser, fromLevel, toLevel} = context;
		const expReward = this.calculateKillReward({fromLevel, toLevel});

		if (sourceUser){
			sourceUser.data.exp += expReward;
		}

		BossEvents.onBossDeath(boss, {fromLevel, toLevel, sourceUser})
		
		const guild = this.client.guilds.cache.get(boss.guildId);
		
		boss.level = toLevel;
		boss.healthThresholder = BossManager.calculateHealthPointThresholder(toLevel);


		if (boss.level >= this.MAXIMUM_LEVEL){
			this.victory(guild);
		}

		const contents = {
			footerText: "Образ переходит в новую стадию",
			title: "Слишком просто! Следующий!",
			main: sourceUser ? `${ sourceUser.username } наносит пронзающий удар и получает ${ expReward } <:crys2:763767958559391795>` : "Пронзительный удар из ни откуда нанёс критический для босса урон",
			isImagine: toLevel - 1 !== fromLevel ? "<:tan:1068072988492189726>" : "",
			levels: `${ fromLevel }...${ toLevel }`
		}
		const footer = {text: contents.footerText, iconURL: sourceUser ? sourceUser.avatarURL() : guild.iconURL()};
		guild.chatSend({
			description: `${ contents.title } (${ contents.levels })\n${ contents.main }\n${ contents.isImagine }`,
			footer
		});
		BossManager.BonusesChest.createCollector({guild, boss, fromLevel, toLevel});
	}

	static victory(guild){
		const boss = guild.data.boss;
		if (boss.isDefeated){
			return;
		}

		guild.chatSend({
			description: "Вы сильные. Спасибо Вам за то, что вы рядом.\nБосс побеждён и прямые атаки по нему больше не проходят. Вы можете использовать реликвии и другие способы нанесения урона, чтобы продвинуться в топ'е"
		});
		boss.isDefeated = true;
	}
	

	static BonusesChest = {
		BASE_BONUSES: 50,
		BONUSES_PER_LEVEL: 10,
		RECEIVE_LIMIT: 20,
		BONUS_VOID_PULL: 3,
		DAMAGE_FOR_VOID: 15_000,
		GUARANTEE_DAMAGE_PART_FOR_VOID: 0.2,
		VOID_REWARD_DENOMINATOR: 0.8,
		DAMAGE_FOR_KEY: 200,
		MAIN_COLOR: "#ffda73",

		createRewardPull: ({userStats, level, bonuses = true}) => {
			const BossChest = BossManager.BonusesChest;

			// chestBonus
			const bonusesReward = BossChest.BASE_BONUSES + level * BossChest.BONUSES_PER_LEVEL;

			// void
			const numerator = Math.random() * userStats.damageDealt + userStats.damageDealt * BossChest.GUARANTEE_DAMAGE_PART_FOR_VOID;

			const byDamage = (numerator / BossChest.DAMAGE_FOR_VOID) ** BossChest.VOID_REWARD_DENOMINATOR;

			const bonus = Number(Util.random(BossChest.BONUS_VOID_PULL) === 1);

			const voidReward = Math.floor(byDamage + bonus);

			// keys
			const keysReward = Math.floor(userStats.damageDealt * BossChest.DAMAGE_FOR_KEY);

			const rewards = {
				"chestBonus": bonuses ? bonusesReward : 0,
				"void": voidReward,
				"keys": keysReward
			}
			return rewards;
		},
		createEmbed: ({fromLevel, toLevel, taking}) => {
			const levelsDiff = toLevel - fromLevel;
			const contents = {
				rewardPer: `Получите бонусы за победу над боссом ур. ${ toLevel }`,
				timeLimit: `Время ограничено двумя часами с момента отправки этого сообщения`,
				receiveLimit: `${ taking ? `\nСобрано: ${ taking }/${ BossManager.BonusesChest.RECEIVE_LIMIT }` : "" }`
			}
			return {
				title: "Сундук с наградами",
				description: `${ contents.rewardPer }\n${ contents.timeLimit }.${ contents.receiveLimit }`,
				thumbnail: "https://media.discordapp.net/attachments/629546680840093696/1038767024643522600/1476613756146739089.png?width=593&height=593",
				footer: {text: "Внимание, вы можете получить награду не более чем из одного сундука за время пребывания босса"},
				color: BossManager.BonusesChest.MAIN_COLOR,
				reactions: ["637533074879414272"]
			};
		},
		createCollector: async ({guild, toLevel, fromLevel}) => {
			const BossChest = BossManager.BonusesChest;
	
			const embed = BossChest.createEmbed({toLevel, fromLevel, taking: 0});
			const context = {
				taking: 0,
				toLevel,
				fromLevel,
				message: null,
				guild
			}
	
			context.message = await guild.chatSend(embed);
			if (!context.message){
				return;
			};

			const collector = context.message.createReactionCollector({filter: (_, user) => !user.bot, time: 3_600_000 * 2});
			collector.on("collect", (_reaction, user) => {
				const result = BossChest.onCollect(user, context);
				if (!result){
					return;
				}
				context.taking++;
				if (context.taking >= BossChest.RECEIVE_LIMIT){
					collector.stop();
				}
				context.message.msg({...BossChest.createEmbed(context), edit: true});
			});
	
			collector.on("end", () => context.message.delete());
		},
		onCollect: (user, {toLevel, message, guild}) => {
			const boss = guild.data.boss;
			const userStats = BossManager.getUserStats(boss, user.id);
			const userData = user.data;
	
			if ("chestRewardAt" in userStats){
				message.msg({title: `Вы уже взяли награду на ур. ${ userStats.chestRewardAt }`, delete: 5000});
				return;
			};

			const rewardPull = BossManager.BonusesChest.createRewardPull({level: toLevel, userStats, bonuses: true});
			userStats.chestRewardAt = toLevel;
			Object.entries(rewardPull).forEach(([key, count]) => 
				userData[key] = (userData[key] ?? 0) + count
			)
			message.msg({description: `Получено ${  Util.ending(rewardPull.chestBonus, "бонус", "ов", "", "а") } для сундука <a:chest:805405279326961684>, ${ rewardPull.keys } 🔩 и ${ rewardPull.void } <a:void:768047066890895360>`, color: BossManager.BonusesChest.MAIN_COLOR, delete: 7000});

			return true;
		}
	};
 

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
			color: "#210052",
			description
		}

		await guild.chatSend(embed);
	}

	static async beforeEnd(guild){
		const boss = guild.data.boss;
		const usersCache = guild.client.users.cache;

		if (boss.level > 1 === false){
			guild.chatSend({content: "Босс покинул сервер в страхе..."});
			return;
		}
		const DAMAGE_THRESHOLDER_FOR_REWARD = 10_000;
		const createRewardPull = BossManager.BonusesChest.createRewardPull;

		const sendReward = ([id, userStats]) => {
			const userData = usersCache.get(id).data;
			const reward = createRewardPull({bonuses: false, userStats, level: boss.level});
			Object.entries(reward).forEach(([key, count]) => 
				userData[key] = (userData[key] ?? 0) + count
			)
		};

		Object.entries(boss.users)
			.filter(([_id, {damageDealt}]) => damageDealt > DAMAGE_THRESHOLDER_FOR_REWARD)
			.forEach(sendReward);
		

		const contents = {
			dice: `Максимальный множитель урона от эффектов: Х${ this.calculateBossDamageMultiplayer(boss).toFixed(2) };`,
			bossLevel: `Достигнутый уровень: ${ boss.level } (${ this.calculateKillReward({fromLevel: 1, toLevel: boss.level}) } опыта)`,
			damageDealt: `Совместными усилиями участники сервера нанесли ${ boss.damageTaken } единиц урона`,
			usersCount: `Приняло участие: ${  Util.ending(Object.keys(boss.users).length, "человек", "", "", "а") }`,
			parting: boss.level > 3 ? "Босс остался доволен.." : "Босс недоволен..",
			rewards: `Пользователи получают ключи в количестве равном ${ 100 / BossManager.BonusesChest.DAMAGE_FOR_KEY }% от нанесенного урона и примерно случайное количество нестабильности в зависимости от нанесенного урона`,
		}
	
		
			
		
		const footer = {
			text: `Пробыл здесь 3 дня`,
			iconURL: guild.iconURL()
		};
	
		const description = `${ contents.dice }\n${ contents.bossLevel }\n\n${ contents.damageDealt }. 🩸\n${ contents.usersCount }. ${ contents.parting }\n${ contents.rewards }.`;
		const embed = {
			title: "Среди ночи он покинул сервер",
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
		boss.elementType = this.BOSS_TYPES.random().type;

		boss.stats = {
			damage: {}
		}
	
		boss.guildId = guild.id;
		boss.healthThresholder = BossManager.calculateHealthPointThresholder(boss.level);

		boss.avatarURL = this.getMediaAvatars().random();
		return boss;
	}

	static getMediaAvatars(){
		return [
			"https://media.discordapp.net/attachments/629546680840093696/1047587012665933884/batman-gif.gif",
			"https://media.discordapp.net/attachments/629546680840093696/1051424759537225748/stan.png",
			"https://cdn.discordapp.com/attachments/629546680840093696/1062620914321211432/DeepTown.png"
		];
	}

	static userAttack({boss, user, channel}){
		const userStats = BossManager.getUserStats(boss, user.id);

		if (userStats.heroIsDead){
			channel.msg({
				description: "Недоступно до воскрешения",
				color: "#ff0000",
				footer: {text: user.username, iconURL: user.avatarURL()},
				delete: 30_000
			})
			return;
		}

		userStats.attack_CD ||= 0;
		userStats.attackCooldown ||= this.USER_DEFAULT_ATTACK_COOLDOWN;

		const footer = {iconURL: user.avatarURL(), text: user.tag};
		if (userStats.attack_CD > Date.now()){
			const description = `**${ Util.timestampToDate(userStats.attack_CD - Date.now()) }**. Дождитесь подготовки перед атакой.`;
			channel.msg({title: "⚔️ Перезарядка..!", color: "#ff0000", description, delete: 7000, footer});
			return;
		}


		userStats.attack_CD = Date.now() + userStats.attackCooldown;


		const attackContext = {
			damageMultiplayer: 1,
			listOfEvents: [],
			defaultDamage: this.USER_DEFAULT_ATTACK_DAMAGE,
			eventsCount: Math.floor(boss.level ** 0.5) + Util.random(-1, 1)
		};
	
		
		const data = {
			user,
			userStats,
			boss,
			channel,
			attackContext,
			guild: channel.guild,
			preventDefault(){
				this.defaultPrevented = true;
			}
		};


		user.action(Actions.bossBeforeAttack, data);
		BossEvents.beforeAttacked(boss, data);

		if (data.defaultPrevented){
			return;
		}

		const pull = [...BossManager.eventBases.values()]
			.filter(event => !event.filter || event.filter(data))
			.map(event => ({
				...event,
				_weight: typeof event.weight === "function" ? event.weight(data) : event.weight
			}));


		for (let i = 0; i < attackContext.eventsCount; i++){
			
			const event = pull.random({weights: true});
			
			if (!event){
				continue;
			}
			if (!event.repeats){
				const index = pull.indexOf(event);
				(~index) && pull.splice(index, 1);
			}

			try {
				event.callback(data);
			}
			catch (error){
				ErrorsHandler.Audit.push(error);
				channel.msg({title: `Источник исключения: ${ event.id }. Он был убран из списка возможных событий на неопределенный срок`, description: `**${ error.message }:**\n${ error.stack }`});
				BossManager.eventBases.delete(event.id);
			}
			attackContext.listOfEvents.push(event);
		}


		const damage = Math.ceil((userStats.attacksDamageMultiplayer ?? 1) * attackContext.defaultDamage * attackContext.damageMultiplayer);
		attackContext.defaultDamage = attackContext.damageDealt = damage;
		const dealt = BossManager.makeDamage(boss, damage, {sourceUser: user});

		user.action(Actions.bossAfterAttack, data);
		BossEvents.afterAttacked(boss, data);

		const eventsContent = attackContext.listOfEvents.map(event => `・ ${ event.description }.`).join("\n");
		const description = `Нанесено урона с прямой атаки: ${ dealt }ед.\n\n${ eventsContent }`;
		const embed = {
			title: `⚔️ За сервер ${ channel.guild.name }!`,
			description,
			footer
		}
		channel.msg(embed);
	}


	static eventBases = new Collection(Object.entries({
		increaseAttackCooldown: {
			weight: 1500,
			id: "increaseAttackCooldown",
			description: "Перезарядка атаки больше на 20 минут",
			callback: ({userStats}) => {
				userStats.attackCooldown ||= this.USER_DEFAULT_ATTACK_COOLDOWN;
				const adding = 60_000 * 20;
				userStats.attackCooldown += adding;
				userStats.attack_CD += adding;
			},
			filter: ({attackContext}) => 
				!attackContext.listOfEvents.some(({id}) => ["reduceAttackDamage"].includes(id))      
		},
		increaseCurrentAttackDamage: {
			weight: 4500,
			repeats: true,
			id: "increaseAttackCooldown",
			description: "Урон текущей атаки был увеличен",
			callback: ({attackContext}) => {
				attackContext.damageMultiplayer *= 5;
			}     
		},
		increaseNextTwoAttacksDamage: {
			weight: 1000,
			repeats: true,
			id: "increaseAttackCooldown",
			description: "Урон следующих двух атак был увеличен",
			callback: ({guild, user}) => {
				const effectBase = BossEffects.effectBases.get("increaseAttackDamage");
				const values = {duration: 2, power: 3};
				BossEffects.applyEffect({values, guild, user, effectBase});
			}     
		},
		giveChestBonus: {
			weight: 1200,
			id: "giveChestBonus",
			description: "Выбито 4 бонуса сундука",
			callback: ({user}) => {
				user.data.chestBonus = (user.data.chestBonus ?? 0) + 4;
			}     
		},
		applyCurse: {
			weight: 900,
			id: "applyCurse",
			description: "Вас прокляли",
			callback: ({user, boss, channel}) => {
				const hard = Math.min(
					Math.floor(boss.level / 5),
					2
				);
				const curse = CurseManager.generate({user, hard, guild: channel.guild});
				CurseManager.init({user, curse});
			},
			filter: ({user}) => !user.data.curses?.length || user.data.voidFreedomCurse     
		},
		improveDamageForAll: {
			weight: 300,
			id: "improveDamageForAll",
			description: "Кубик — урон по боссу увеличен на 1%",
			callback: ({user, boss}) => {
				boss.diceDamageMultiplayer ||= 1;
				boss.diceDamageMultiplayer += 0.01;
			},
			filter: ({boss}) => boss.diceDamageMultiplayer 
		},
		choiseAttackDefense: {
			weight: 700,
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
					const DAMAGE = 125;
					const content = `Успех! Нанесено ${ DAMAGE } урона`;
					message.msg({description: content});
					BossManager.makeDamage(boss, DAMAGE, {sourceUser: user});
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
		selectLegendaryWearon: {
			weight: 100,
			id: "selectLegendaryWearon",
			description: "Требуется совершить выбор",
			callback: async ({user, boss, channel, userStats, guild}) => {
				
				const reactions = [...LegendaryWearonList.values()].map(({emoji}) => emoji);
				const getLabel = ({description, emoji}) => `${ emoji } ${ description }.`;
				const embed = {
					description: `**Выберите инструмент с привлекательным для Вас эпическим эффектом:**\n${ LegendaryWearonList.map(getLabel).join("\n") }`,
					color: "#3d17a0",
					reactions,
					footer: {iconURL: user.avatarURL(), text: "Это событие появляется единожды"}
				}

				channel.sendTyping();
				await Util.sleep(2000);

				const message = await channel.msg(embed);
				const filter = ({emoji}, member) => user === member && reactions.includes(emoji.name);
				const collector = message.createReactionCollector({filter, time: 300_000, max: 1});
				collector.on("collect", async (reaction) => {
					const emoji = reaction.emoji.name;
					const wearon = LegendaryWearonList.find(wearon => wearon.emoji === emoji);
					if (!wearon){
						throw new Error("Unexpected Exception");
					}
					
					const effectBase = BossEffects.effectBases.get(wearon.effect);
					const values = wearon.values;
					BossEffects.applyEffect({guild, user, effectBase, values});
					userStats.haveLegendaryWearon = true;

					message.channel.msg({color: "#000000", description: `Выбрано: ${ wearon.description }`, reference: message.id});
					await Util.sleep(10_000);
					collector.stop();
				});

				collector.on("end", () => message.delete());
			},

			filter: ({userStats, boss}) => !userStats.haveLegendaryWearon && boss.level >= 5
		},
		choiseCreatePotion: {
			weight: 300,
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
								message.msg({title: "Вы уже воспользовались котлом", color: "#ff0000", delete: 3000});
								return;
								}

								if (Object.keys(gotTable).length >= 5){
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
									message.msg({title: "Вы уже воспользовались котлом", color: "#ff0000", delete: 3000});
									return;
								}

								if (Object.keys(gotTable).length >= 5){
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
						description: "Босс теряет 7% от своего текущего здоровья",
						callback: (message, embed) => {
							const thresholder = BossManager.calculateHealthPointThresholder(boss.level);
							const currentHealth = thresholder - boss.damageTaken;
							const damage = Math.floor(currentHealth * 0.07);
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
				const collector = message.createReactionCollector({filter, time: 90_000, max: 3});
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
		},
		powerOfEarth: {
			weight: 1500,
			id: "powerOfEarth",
			description: "Вознаграждение за терпение",
			callback: ({user, boss}) => {
				const berry = 3 + boss.level;
				user.data.berry += berry;
			},
			filter: ({boss}) => boss.elementType === elementsEnum.earth
		},
		powerOfWind: {
			weight: 1500,
			id: "powerOfWind",
			description: "Уменьшает перезарядку на случайное значение",
			callback: ({userStats}) => {
				const maximum = 0.2;
				const piece = Math.random() * userStats.attackCooldown * maximum + userStats.attackCooldown * (1 - maximum);
				userStats.attack_CD = Date.now() + piece;
				userStats.attackCooldown = piece;
			},
			filter: ({boss}) => boss.elementType === elementsEnum.wind
		},
		powerOfFire: {
			weight: 1500,
			id: "powerOfFire",
			description: "На что вы надеятесь?",
			callback: ({boss}) => {
				boss.damageTaken -= 15 * boss.level;
			},
			filter: ({boss}) => boss.elementType === elementsEnum.fire
		},
		powerOfDarkness: {
			weight: 1500,
			id: "powerOfDarkness",
			description: "Вознагражение за настойчивость",
			callback: ({user, boss}) => {
				const userData = user.data;
				userData.keys += 5 + boss.level * 2;
				userData.chestBonus = (userData.chestBonus || 0) + 2 + boss.level;
				userData.coins += 20 + 15 * boss.level;
			},
			filter: ({boss}) => boss.elementType === elementsEnum.darkness
		},
		powerOfEarthRare: {
			weight: 100,
			id: "powerOfEarthRare",
			description: "Вы получаете защиту от двух следующих негативных или нейтальных эффектов",
			callback: ({user, boss}) => {
				// to-do: need realese
			},
			filter: ({boss}) => boss.elementType === elementsEnum.earth
		},
		powerOfWindRare: {
			weight: 100,
			id: "powerOfWindRare",
			description: "",
			callback: ({user, boss}) => {
				// to-do: need idea
			},
			filter: ({boss}) => boss.elementType === elementsEnum.wind
		},
		powerOfFireRare: {
			weight: 100,
			id: "powerOfFireRare",
			description: "Ваши прямые атаки наносят гораздо больше урона по боссу",
			callback: ({user, boss, userStats}) => {
				const multiplier = 1.2;
				userStats.attacksDamageMultiplayer = +(
					(userStats.attacksDamageMultiplayer ?? 1) *
					multiplier
				).toFixed(3);
			},
			filter: ({boss}) => boss.elementType === elementsEnum.fire
		},
		powerOfDarknessRare: {
			weight: 100,
			id: "powerOfDarknessRare",
			description: "Получена нестабильность. Перезарядка атаки свыше 8 ч.",
			callback: ({user, boss, userStats}) => {
				const adding = 3_600_000 * 8;
				userStats.attackCooldown += adding;
				userStats.attack_CD += adding;
				user.data.void++;
			},
			filter: ({boss}) => boss.elementType === elementsEnum.darkness
		},
		pests: {
			weight: ({boss}) => 400 * 1.2 ** (boss.level - 10),
			id: "pests",
			description: "Клопы",
			callback: ({user, boss, userStats}) => {
				const addingCooldowm = 60_000;
				userStats.attackCooldown += addingCooldowm;
				userStats.attack_CD += addingCooldowm;

				const decreaseMultiplayer = 0.005;
				userStats.attacksDamageMultiplayer ||= 1;
				userStats.attacksDamageMultiplayer -= decreaseMultiplayer;
			},
			repeats: true,
			filter: ({boss}) => boss.level >= 10
		},
		death: {
			weight: 100,
			id: "death",
			description: "Смэрть",
			callback: ({userStats}) => {
				userStats.heroIsDead = true;
			},
			repeats: true,
			filter: ({boss}) => boss.level >= 3
		},
		theRarestEvent: {
			weight: 1,
			id: "theRarestEvent",
			description: "Вы получили один ключ ~",
			callback: ({user, boss, userStats}) => {
				user.data.keys += 1;
			}
		},
		takeRelicsShard: {
			weight: 20,
			id: "relics",
			description: "Получен осколок случайной реликвии",
			callback: ({userStats, userData}) => {
				userStats.relicsShards ||= 0;
				userStats.relicsShards++;
				const NEED_SHARDS_TO_GROUP = 5;

				if (userStats.relicsShards <= NEED_SHARDS_TO_GROUP){
					userStats.relicIsTaked = true;
					delete userStats.relicIsTaked;
					
					userData.bossRelics ||= [];
					
					const relicKey = BossRelics.collection
						.filter(relic => BossRelics.isUserHasRelic({userData, relic}) && relic.inPull)
						.randomKey();

					relicKey && userData.bossRelics.push(relicKey);
				}
			},
			filter: ({boss, userStats}) => {
				return BossManager.isElite(boss) && userStats.relicIsTaked;
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

	static BOSS_TYPES = new Collection(Object.entries({
		earth: {
			key: "earth",
			type: elementsEnum.earth
		},
		wind: {
			key: "wind",
			type: elementsEnum.wind		
		},
		fire: {
			key: "fire",
			type: elementsEnum.fire
		},
		darkness: {
			key: "darkness",
			type: elementsEnum.darkness
		}
	}));

	static DAMAGE_SOURCES = {
		message: 0,
		attack: 1,
		thing: 2,
		other: 3,
		"0": {
			label: "Сообщения",
			key: "message"
		},
		"1": {
			label: "Прямые атаки",
			key: "attack"
		},
		"2": {
			label: "Штука",
			key: "thing"
		},
		"3": {
			label: "Другое",
			key: "other"
		}
	}

	static USER_DEFAULT_ATTACK_COOLDOWN = 3_600_000 * 2;
	static USER_DEFAULT_ATTACK_DAMAGE = 10;


	static setClient(client){
		this.client = client;
	}

	static BossShop = BossShop;
	static BossEvents = BossEvents;
	static BossRelics = BossRelics;
	static BossEffects = BossEffects;
}



export { BossManager, BossShop, BossEvents, BossEffects, LegendaryWearonList };
export default BossManager;