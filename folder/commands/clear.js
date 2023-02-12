import * as Util from '#lib/modules/util.js';
import { client } from '#bot/client.js';

class Command {

	async onChatInput(msg, interaction){
    await interaction.message.delete()
      .catch(() => {});

    const
      channel      = msg.channel,
      params       = interaction.params,
      _isDMBased   = interaction.channel.isDMBased();

    const referenceId = msg.reference ? msg.reference.messageId : null;

    const userId  = Util.match(params, /\d{17,19}/);
    const limit   = Util.match(params, /(?:\s|^)\d{1,16}(?:\s|$)/);


    const
      foundedMessages = [],
      twoWeekAgo      = new Date() - 1209600000,
      options         = { limit: 50 };

    const foundLimit =
      referenceId ? 500 :
      Math.min(
        limit !== null ? limit : 75,
        900
      );

    let lastMessageId = null;
    while (true) {
      if (lastMessageId)
        options.before = lastMessageId;

      const messages = await channel.messages.fetch(options);
      foundedMessages.push(...messages.values());

      if (referenceId){
        const founded = messages.find(message => message.id === referenceId);

        if (founded){
          foundedMessages.splice(foundedMessages.indexOf(founded));
          break;
        }

        if (messages.size !== 50 || foundedMessages.length === 350){
          msg.msg({title: "Не удалось найти сообщение", color: "#ff0000", delete: 3000, description: params});
          return;
        }
      }

      lastMessageId = messages.last().id;
      if (messages.size !== 50 || foundedMessages.length >= foundLimit){
        break;
      }
    };

    let messages = foundedMessages;

    messages = messages.filter(message => !message.pinned);

    if (_isDMBased)
      messages = messages.filter(message => message.author === client.user);


    if (userId)
      messages = messages.filter(message => message.author.id === userId);

    messages.splice(foundLimit);

    if (messages.length === 0)
      return msg.msg({title: "Вроде-как удалено 0 сообщений", delete: 3000, description: "Я серьёзно! Не удалено ни единого сообщения!"});


    let counter = await msg.msg({title: `Пожалуйста, Подождите... ${  Util.ending(messages.length, "сообщени", "й", "е", "я") } на удаление.`, description: "Нажмите реакцию чтобы отменить чистку", reactions: ["❌"]});
    let toDelete = messages.length;

    await Util.sleep(3000);

    if (messages.length > 120){
      msg.channel.sendTyping();
    }

    const byBulkDelete = [];
    const byOneDelete  = [];

    messages.forEach(msg => {
      if (_isDMBased)
        return byOneDelete.push(msg);

      if (msg.createdTimestamp - twoWeekAgo < 0)
        return byOneDelete.push(msg);

      byBulkDelete.push(msg);
    });

    const updateCounter = async () => {
      const current = toDelete - byOneDelete.length - byBulkDelete.length;
      counter = await counter.msg({title: `Пожалуйста, Подождите... ${ current } / ${ toDelete }`, edit: true});
    }

    const isReaction = () => {
      const reacted = counter.reactions.cache.get("❌");
      if (reacted)
        return reacted.users.cache.has(msg.author.id);
    }

    const sendLog = () => {
      const current = toDelete - byOneDelete.length - byBulkDelete.length;

      if (current === 0)
        return;

      const mode = (referenceId) ? `До указанного сообщения` : (userId) ? `Сообщения пользователя <@${ userId }>` : (limit) ? "Количественная выборка" : "Все сообщения";
      const isCancel = !!(toDelete - current);
      const description = `В канале: ${ channel.toString() }\nУдалил: ${msg.author.toString()}\nТип чистки: ${ mode }${ isCancel ? "\n\nЧистка была отменена" : "" }`;

      if (msg.guild){
        const title = `Удалено ${  Util.ending(current, "сообщени", "й", "е", "я") }`;
        msg.guild.logSend({title, description}); 
      }
        
    }

    while (byBulkDelete.length || byOneDelete.length){


      if ( isReaction() ){
        counter.delete();

        const current = toDelete - byOneDelete.length - byBulkDelete.length;
        const description = `Было очищено ${  Util.ending(current, "сообщени", "й", "е", "я") } до отмены`;
        msg.msg({title: "Очистка была отменена", description, delete: 12_000});

        sendLog();

        return;
      }




      if (byBulkDelete.length){
        await channel.bulkDelete( byBulkDelete.splice(0, 50) );
      }

      else {
        for (const message of byOneDelete.splice(0, Util.random(5, 15))){
          await message.delete();
        }
      }



      updateCounter();
    }

    await Util.sleep(toDelete * 30);

    counter.msg({title: `Удалено ${  Util.ending(toDelete, "сообщени", "й", "е", "я") }!`,  edit: true, delete: 1500 });

    sendLog();
  }


	options = {
	  "name": "clear",
	  "id": 8,
	  "media": {
	    "description": "**Чистит сообщения в канале и имеет четыре режима:**\n1. Количесвенная чистка — удаляет указанное число.\n2. \"Удалить до\" — чистит всё до сообщения с указанным содержимым.\n3. Сообщения пользователя — стирает только сообщения отправленные указанным пользователем.\n4. Если не указать аргументов, будет удалено 75 последних сообщений.\nᅠ\n:pencil2:\n```python\n!clear <memb | count | messageContent> #messageContent — содержимое сообщения до которого провести чистку, не учитывает эмбеды и форматирование текста*\n```",
	    "poster": "https://media.discordapp.net/attachments/769566192846635010/872526568965177385/clear.gif"
	  },
	  "allias": "очистить очисти очисть клир клиар",
		"allowDM": true,
		"cooldown": 15000000,
		"type": "guild",
		"myChannelPermissions": 8192n,
		"ChannelPermissions": 8192n
	};
};

export default Command;