import FileSystem from 'fs';
import {Template, ErrorsHandler, Util} from '#src/modules/mod.js';
import { Collection } from '@discordjs/collection';

class CounterManager {

	static async create(counter){
	  this.data.push(counter);
	  const result = await this.call(counter);
	  this.file.write();
 
	  return {result, counter};
	}
 
	static delete(counterOrIndex){
	  const index = typeof counterOrIndex == "number" ?
		 counterOrIndex :
		 this.counterData.indexOf(counterOrIndex);
		 
	  if (~index === 0){
		 return false;
	  }
 
	  this.data.splice(index, 1);
	  this.file.write();
	}

	static freeze(counter){
		counter.freezed = true;
	}

	static reportException(counter, error){
		const channel = this.#client.channels.cache.get(counter.channelId);
		const user = this.#client.users.cache.get(counter.authorId);
		const target = channel.isTextBased() ? channel : user;

		const description = `Во время обработки счётчика в канале ${ channel.toString() } произошло исключение.\n\nЗапускаемый счётчик заморожен до ручного возобновления. Узнать больше информации — через команду \`!счётчики\`.\nОн был создан/изменён пользователем:\n${ user.tag } (ID: ${ user.id }).`;
		ErrorsHandler.sendErrorInfo({channel: target, error, description});
	}

	static resume(counter){
		delete counter.freezed;
	}
 
	static async *createGenerator(){
	  let i = 0;
	  const MINUTE = 60_000;
	  const MINUTES = 15;
 
	  while (true) {
		 const counter = this.data[i];
		 yield this.call(counter);
 
		 await Util.sleep(MINUTE * MINUTES / (this.data.length + 1));
		 i++;
		 i %= this.data.length;
	  }
	}
 
	static async handle(){
	  const queue = this.createGenerator();
	  for await (const _counter of queue){};
	}
 
	static async call(counter){
		if (!counter){
			return;
		}

		const client = this.#client;

		if (counter.freezed){
			return null;
		}
	
	
		try {
			const channel = client.guilds.cache.get(counter.guildId).channels.cache.get(counter.channelId);
			const context = {client, counter, channel};
			const templater = new Template({executer: counter.authorId, type: Template.sourceTypes.counter}, context);
		
			const result = await this.countersTypes.get(counter.type).handle(context, templater);
			return result;
		}
		catch (error) {
			this.reportException(counter, error);
			this.freeze(counter);
			return error;
		}
	}
 
	static file = {
		 path: `${ process.cwd() }/data/counters.json`,
		 load: async () => {
			const path = this.file.path;
			const content = FileSystem.readFileSync(path, "utf-8");
			const data = JSON.parse(content);
			this.data = data;
		 },
		 write: async () => {
			const path = this.file.path;
			const data = JSON.stringify(this.data);
			FileSystem.writeFileSync(path, data);
		 }
	}
 
	static data = {};

	static countersTypes = new Collection(Object.entries({
      "message":
		{
			emoji: "🖊️",
			label: "🖊️Сообщение",
			description: "Единожды отправляет сообщение и после, ненавязчиво, изменяет его содержимое",
			key: "message",
			change: async (context) => {
				const interaction = context.interaction;
				const counter = context.counter;
				counter.type = context.typeBase.key;
				counter.channelId = interaction.channel.id;
				counter.guildId   = interaction.guild.id;
				counter.authorId  = interaction.user.id;

				const questionNeedEmbed = async () => {
					const message = await interaction.message.msg({title: "Вашему сообщению нужен эмбед?", description: `Вы сможете передать JSON-набор для эмбед сообщения`});
					const react = await message.awaitReact({user: interaction.user, removeType: "all"}, "685057435161198594", "763807890573885456");
					message.delete();
					return react === "685057435161198594";
				}

				context.needEmbed = await questionNeedEmbed();

				if (context.needEmbed){
					
				}

				return counter;
			},
			async handle({channel, counter}, templater){
				
				const messageOptions = counter.message;
				messageOptions.title 		&&= await templater.replaceAll(messageOptions.title);
				messageOptions.description &&= await templater.replaceAll(messageOptions.description);
				messageOptions.content 		&&= await templater.replaceAll(messageOptions.content);
				 

				const message = await channel.messages.fetch(counter.messageId);
				message.msg({...messageOptions, edit: true});
				return message;
			}
      },
      "channel":
		{
			emoji: "🪧",
			label: "🪧Имя канала",
			description: "Изменяет имя указаного канала",
			key: "channel",
			change: async (context) => {
				const interaction = context.interaction;
				const counter = context.counter;

				counter.type = context.typeBase.key;
				counter.guildId   = interaction.guild.id;
				counter.authorId  = interaction.user.id;

				const fetchChannel = async () => {
					const message = await interaction.channel.msg({title: "Введите айди канала или упомяните его"});
					const answer = await interaction.channel.awaitMessage({user: interaction.user});
					if (!answer){
						return null;
					}
					const id = answer.content.match(/\d{17,19}/)?.[0];
					if (!id){
						message.msg({color: "#ff0000", delete: 8_000, description: "Не удалось обнаружить метку канала"});
						return false;
					}
					const channel = interaction.guild.channels.cache.get(id);
					if (!channel){
						message.msg({color: "#ff0000", delete: 8_000, description: `Не найдено канала с ID \`${ id }\``});
						return false;
					}
					
					return channel;
				}

				
				const channel = await fetchChannel();
				if (!channel){
					return;
				}

				counter.channelId = channel.id;
				counter.value = context.template;
				return counter;
			},
			async handle({channel, counter}, templater){
				const value = await templater.replaceAll(counter.value);
				await channel.setName(value, `!commandInfo Counter, initialized by <@${ counter.authorId }>`);
				return value;
			}
      },
      "poster": 
		{
			emoji: "🖌️",
			label: "🖌️Отправка сообщения",
			description: "Отправляет в указаный канал с интервалом в 15 минут",
			key: "poster",
			change: async (context) => {
				const interaction = context.interaction;
				const counter = context.counter;
				counter.type = context.typeBase.key;
				counter.channelId = interaction.channel.id;
				counter.guildId   = interaction.guild.id;
				counter.authorId  = interaction.user.id;
				counter.value 		= context.template;
				return counter;
			},
			async handle({channel, counter}, templater){
				const content = await templater.replaceAll(counter.value);
				await channel.msg({content});
				return content;
			}
      }
	}));

	static #client;
	static setClient(client){
		this.#client = client;
	}
 }



 
 export default CounterManager;


//  switch (type) {
// 	case "🖊️":
// 	  let embed = {embed: true};
// 	  let textValue = template;
// 	  let message = await msg.msg({title: "Вашему сообщению нужен эмбед?", description: `Подразумивается эмбед-обёртка, цвет и заглавие`});
// 	  react = await message.awaitReact({user: msg.author, removeType: "all"}, "685057435161198594", "763807890573885456");
// 	  message.delete();
// 	  if (react == 685057435161198594){
// 		 embed = {description: template}
// 		 answer = await msg.channel.awaitMessage(msg.author, {title: "Укажите оглавление эмбеда", embed: {description: `Оглавление — голова эмбед сообщения...\nОна поддерживает шаблоны`, time: 1_200_000}});
// 		 if (!answer) return false;
// 		 textValue = answer.content || "";

// 		 answer = await msg.channel.awaitMessage(msg.author, {title: "Введите цвет в HEX формате", embed: {description: `HEX — #ff0000, где первые два числа в 16-значной системе (0,1,2,...,e,f) — красный, за ним зеленый и синий`, time: 1_200_000}});
// 		 if (!answer) return false;
// 		 embed.color = answer.content.replace("#", "");
// 	  }

// 	  msg.msg({title: "Через секунду здесь появится сообщение", description: "Это и будет готовый счётчик", delete: 7000});
// 	  await Util.sleep(1500);
// 	  counter = await msg.msg({title: textValue, ...embed});
	  
// 	break;
// 	case "🪧":
// 	  let channel = await msg.channel.awaitMessage(msg.author, {title: "Введите айди канала или упомяните его"});
// 	  if (channel){
// 		 channel = (channel.mentions.channels.first()) ? channel.mentions.channels.first() : msg.guild.channels.cache.get(channel.content);
// 		 msg.msg({title: "Готово, название этого канала отображает введенную инфомацию.", description: "Чтобы удалить счётчик, воспользуйтесь командой `!counters`", delete: 7000});
// 		 CounterManager.create({channelId: channel.id, guildId: msg.guild.id, type: "channel", template});
// 	  }
// 	  else msg.channel.msg({title: "Канал не существует", color: "#ff0000"});
// 	break;
// 	case "🖌️":
// 	  let interval = await msg.channel.awaitMessage(msg.author, {title: "Укажите кол-во минут между отправкой сообщения", description: "Минимум 15м"});
// 	  interval = interval && +interval.content > 15 && +interval.content;
// 	  if (!interval) return msg.msg({title: "Неверное значение", color: "#ff0000", delete: 4000});
// 	  CounterManager.create({channelId: msg.channel.id, guildId: msg.guild.id, type: "poster", template, params: interval});
// 	break;
// 	default: return await Util.sleep(2000);

//  }