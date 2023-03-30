//@ts-check

import * as Util from '#lib/util.js';
import { client } from '#bot/client.js';





class Command {
  async askChannel(interaction){
    
    let answer = await Util.awaitUserAccept({name: "reactor", message: {title: "С помощью этой команды вы можете создавать реакции выдающее роли. \nРеакции должны быть установлены заранее\nВы уже установили реакциии?)"}, channel: interaction.channel, userData: interaction.userData});
    if (!answer){
      return;
    }

    interaction.questionMessage = await interaction.channel.msg({title: "Укажите айди или упомяните канал в котором находится сообщение.\nЕсли оно находится в этом канале, нажмите реакцию ниже"});
    answer = await Util.awaitReactOrMessage({target: interaction.questionMessage, user: interaction.user, reactionOptions: {reactions: ["640449832799961088"]}});
    interaction.questionMessage.delete();

    const channel = interaction.guild.channels.cache.get(
      answer === "640449832799961088" ? interaction.channel.id : answer.content.match(/\d{17,19}/)?.[1]
    );

    if (!channel) {
      interaction.channel.msg({title: "Канал не найден", delete: 3000, color: "#ff0000"});
      return null;
    }

    return channel;
  }

  async askMessage(interaction){
    const channel = interaction.reactor.channel;
    const questionMessage = await channel.msg({title: "Укажите айди сообщения или ответьте на него"});
    const answer = await channel.awaitMessage({user: interaction.user});
    questionMessage.delete();

    const id = answer.content.match(/\d{17,20}/)?.[1] ?? answer.reference.messageId;

    const message = await channel.messages.fetch({message: id});
    if (!message){
      channel.msg({title: "Не удалось найти сообщение", delete: 3000, color: "#ff0000"});
      return null;
    }

    return message;
  }

  async askType(interaction){

  }

	async onChatInput(msg, interaction){
    
    const reactor = {
      channel: null,
      message: null
    };
    interaction.reactor = reactor;

    const channel = await this.askChannel(interaction);
    reactor.channel = channel;

    const message = await this.askMessage(interaction);
    reactor.message = message;

    const type = await this.askType(interaction);
    reactor.type = type;
   

    

    let reactions = [...message.reactions.cache.keys()];
    if (!reactions.length) {
      let whatReactions = await msg.msg({title: "Вы не установили ни одной реакции под сообщением, сделайте это сейчас.\nКогда будете готовы, нажмите галочку ниже."});
      while (true){
        let react = await whatReactions.awaitReact({user: msg.author, removeType: "all"}, "685057435161198594");
        if (!react) {
          return;
        }

        reactions = [...message.reactions.cache.keys()];
        if (!reactions.length) client.api.channels(msg.channel.id).messages.post({data: {"content": "Сначала установите реакции под приклеплённым сообщением", "message_reference": {message_id: channel.id}}});
        else {
          break;
        }
      }
      whatReactions.delete();
    }

    let whatRoles = await msg.msg({title: "Укажите роли через пробел\nВо избежание лишних упоминаний, только по айди"});
    answer = await msg.channel.awaitMessage({user: msg.author, time: 300000});
    whatRoles.delete();

    let rolesId = answer.content.match(/\d{17,20}/g);
    if (!rolesId) {
      msg.msg({title: `Не удалось найти иденфикаторы ролей`, delete: 5000, color: "#ff0000"});
      return;
    }

    let roles = rolesId.map(el => channel.guild.roles.cache.get(el)).filter(el => el);
    if (rolesId.length !== roles.length) {
      msg.msg({title: `Не удалось найти роли по следующим иденфикаторам: ${rolesId.filter(el => !roles.map(el => el.id).includes(el)).join(" ")}`, delete: 5000, color: "#ff0000"});
      return;
    }

    if (roles.length > reactions.length) {
      msg.msg({title: "Ролей указано больше, чем стоит реакций под сообщением.", delete: 5000, color: "#ff0000"});
      return;
    }

    if (roles.length < reactions) {
      answer = await msg.msg({title: "Ролей указано меньше, чем стоит реакций под сообщением, вы хотите продолжить?"});
      let react = await answer.awaitReact({user: msg.author, removeType: "all"}, "685057435161198594", "❌");

      if (react != "685057435161198594") {
        msg.msg({title: "Действие отменено ❌", delete: 4500});
        return;
      }
    }

    // let settings = {
    //
    // }

    let obj = {};
    roles.forEach((e, i) => obj[reactions[i]] = e.id);
    new ReactionsManager(message.id, channel.id, channel.guild.id, "reactor", obj);

    msg.msg({title: "Установлен реактор сообщения", description: `Сообщению с ID ${message.id} были присвоены реакции выдающие следущие роли:\n${roles.map(e => " • " + e.name).join("\n")}`, delete: 9000});
    msg.guild.logSend({title: "Установлен реактор сообщения", description: `Сообщению с ID ${message.id} были присвоены реакции выдающие следущие роли:\n${roles.map(e => " • " + e.name).join("\n")}`});
  }


	options = {
	  "name": "reactor",
	  "id": 19,
	  "media": {
	    "description": "\n\nРеактор — команда позволяющая создавать \"роли за реакции\" — возможность пользователям выбирать себе роли нажимая реакции под сообщением.\n\n:information_source:\nВозможность пользователями выбирать роли даёт множество вариантов персонализации сервера.\n\n✏️\n```python\n!reactor #без аргументов\n```\n\n"
	  },
	  "allias": "реактор",
		"allowDM": true,
		"cooldown": 30000000,
		"type": "guild",
		"myPermissions": 268435456,
		"Permissions": 268435488
	};
};

export default Command;