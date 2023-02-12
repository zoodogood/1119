import * as Util from '#lib/util.js';

class Command {

	async onChatInput(msg, interaction){
    let guild = msg.guild;
    let answer;

    if (guild.data.hi) {
        let early = await msg.msg({title: "Ранее установленное приветствие:", color: guild.data.hi.color, image: guild.data.hi.image, description: guild.data.hi.message, scope: {tag: msg.author.toString(), name: msg.author.username}, footer: {text: "Нажмите реакцию, чтобы продолжить редактирование"}});
        let react = await early.awaitReact({user: msg.author, removeType: "all", time: 20000}, "✏️");
        early.delete();
        if (!react) return;
    }

    let whatMessage = await msg.msg({title: "Введите сообщение с которым бот будет встречать новых пользователей!", description: "Используйте шаблонные строки {name}, они знатно вам помогут!"});
    answer = await msg.channel.awaitMessage({user: msg.author});
    if (!answer) {
      return;
    }

    let message = answer.content;
    whatMessage.delete();

    let whatColor = await msg.msg({title: "Укажите цвет в формате HEX `#38f913`", description: "Используйте реакцию ❌, чтобы пропустить этот пункт"});
    answer = await Util.awaitReactOrMessage(whatColor, msg.author, "❌");
    if (!answer){
      return;
    }

    let color = (answer.content) ? answer.content.replace("#", "") : null;
    whatColor.delete();

    let whatImage = await msg.msg({title: "Укажите ссылку на изображение", description: "Или пропустите этот пункт"});
    answer = await Util.awaitReactOrMessage(whatImage, msg.author, "❌");
    if (!answer) {
      return;
    }

    let image = answer.content || null;
    whatImage.delete();
    if (image && !image.startsWith("http")) return msg.msg({title: "Вы должны указать ссылку на изображение", color: "#ff0000", delete: 3000});

    let rolesId;
    let whatRoles = await msg.msg({title: "Вы можете указать айди ролей через пробел, они будут выдаваться всем новым пользователям", description: "Этот пункт тоже можно пропустить"});
    answer = await Util.awaitReactOrMessage(whatRoles, msg.author, "❌");
    if (!answer) return;
    whatRoles.delete();
    if (answer.content){
      rolesId = answer.content.split(" ");
      let roles   = rolesId.map(el => msg.guild.roles.cache.get(el)).filter(el => el);
      if (rolesId.length != roles.length) return msg.msg({title: `Не удалось найти роли по следующим иденфикаторам: ${rolesId.filter(el => !roles.map(el => el.id).includes(el)).join(" ")}`, delete: 5000, color: "#ff0000"});
    }
    else rolesId = false;



    let whatChannel = await msg.msg({title: "Упомяните канал для отправки приветсвий или...", color: "#ffff00", description: `📥 - Установить в этом канале ${guild.channels.cache.get(guild.data.hiChannel) ? ("\nСейчас установлен:\n" + guild.channels.cache.get(guild.data.hiChannel).toString() + " - Оставить как есть 🔰") : ""}`});
    answer = await Util.awaitReactOrMessage(whatChannel, msg.author, "📥", ((guild.data.hiChannel) ? "🔰" : null));
    if (!answer) {
      return;
    }

    whatChannel.delete();

    if (answer !== "🔰") {
      guild.data.hiChannel = answer.mentions.channels.first() ? answer.mentions.channels.first().id : msg.channel.id;
      msg.channel.msg({title: `#${msg.guild.channels.cache.get(msg.channel.id).name} установлен каналом для приветсвия новых пользователей`, delete: 4500});
    }

    guild.data.hi = {message, color, image, rolesId};
    msg.msg({title: "Готово! Предпросмотр", color: color, image: image, description: message, scope: {tag: msg.author.toString(), name: msg.author.username}, delete: 15000});

  }


	options = {
	  "name": "welcomer",
	  "id": 13,
	  "media": {
	    "description": "\n\nБот будет приветствовать новых пользователей именно так, как вы ему скажете, может выдавать новичкам роли, отправлять в канал ваше сообщение или просто помахать рукой.\n\n:pencil2:\n```python\n!welcomer (без аргументов)\n```\n\n"
	  },
	  "allias": "установитьприветствие sethello приветствие",
		"allowDM": true,
		"type": "guild",
		"Permissions": 32
	};
};

export default Command;