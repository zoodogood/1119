import * as Util from '#src/modules/util.js';
import { client } from '#src/index.js';
import config from '#src/config';
import DataManager from '#src/modules/DataManager.js';
import CommandsManager from '#src/modules/CommandsManager.js';
import app from '#src/modules/app.js';
import ErrorsHandler from '#src/modules/ErrorsHandler.js';

import { CreateModal } from '@zoodogood/utils/discordjs';
import { ButtonStyle, ComponentType, TextInputStyle } from 'discord.js';


class Command {

  onComponent({params: rawParams, interaction}){
    const [target, ...params] = rawParams.split(":");
    this.componentsCallbacks[target].call(this, interaction, ...params);
  }

  getMainInterfaceComponents(){
    const components = [
      {
        type: ComponentType.Button,
        label: "Больше",
        style: ButtonStyle.Success,
        customId: "@command/bot/getMoreInfo"
      },
      {
        type: ComponentType.Button,
        label: "Сервер",
        style: ButtonStyle.Link,
        url: config.guild.url,
        emoji: {name: "grempen", id: "753287402101014649"}
      },
      {
        type: ComponentType.Button,
        label: "Пригласить",
        style: ButtonStyle.Link,
        url: `https://discord.com/api/oauth2/authorize?client_id=${ client.user.id }&permissions=1073741832&scope=applications.commands%20bot`,
        emoji: {name: "berry", id: "756114492055617558"}
      }
    ];
    return components;
  }

  displayMainInterface(interaction){
    const {rss, heapTotal} = process.memoryUsage();
    const { address, port } = app.server?.address() || {};

    const season = ["Зима", "Весна", "Лето", "Осень"][Math.floor((new Date().getMonth() + 1) / 3) % 4];
    const version = config.version;

    const contents = {
      ping: `<:online:637544335037956096> Пинг: ${ client.ws.ping }`,
      version: `V${ version }`,
      season: `[#${season}](https://hytale.com/supersecretpage)`,
      guilds: `Серваков...**${ client.guilds.cache.size }**`,
      commands: `Команд: ${ CommandsManager.collection.size }`,
      time: `Время сервера: ${ new Intl.DateTimeFormat("ru-ru", {hour: "2-digit", minute: "2-digit"}).format() }`,
      address: address ? `; Доступен по адрессу: http://${ address.replace("::", "localhost") }:${ port }` : "",
      performance: `\`${ ( heapTotal/1024/1024 ).toFixed(2) } мб / ${( rss/1024/1024 ).toFixed(2)} МБ\``,
      errors: `Ошибок за текущий сеанс: ${ ErrorsHandler.Audit.collection.reduce((acc, errors) => acc + errors.length, 0) }`,
      uniqueErrors: `Уникальных ошибок: ${ ErrorsHandler.Audit.collection.size }`
    };

    const embed = {
      title: "ну типа.. ай, да, я живой, да",
      description: `${ contents.ping } ${ contents.version } ${ contents.season }, что сюда ещё запихнуть?\n${ contents.guilds }(?) ${ contents.commands }\n${ contents.performance }\n${ contents.time }${ contents.address }\n${ contents.errors };\n${ contents.uniqueErrors }`,
      footer: {text: `Укушу! Прошло времени с момента добавления бота на новый сервер: ${ Util.timestampToDate(Date.now() - (DataManager.data.bot.newGuildTimestamp ?? null), 2) }`},
      components: this.getMainInterfaceComponents()
    };

    interaction.channel.msg(embed);
  }

  componentsCallbacks = {
    removeMessage(interaction){
      interaction.message.delete();
      
      interaction.msg({
        title: "Сообщение удалено",
        description: "Зачем удалено, почему удалено, что было бы если бы вы не удалили это сообщение, имело ли это какой-нибудь скрытый смысл...?",
        author: {
          name: interaction.member.user.username,
          iconURL: interaction.user.avatarURL()
        }
      });
      return;
    },
    async getMoreInfo(interaction){
      const parent = interaction.message;
      const embed = {
        components: [
          {
            type: ComponentType.Button,
            label: "Удалить!",
            style: ButtonStyle.Primary,
            customId: "@command/bot/removeMessage"
          },
          {
            type: ComponentType.Button,
            label: "Отправить отзыв.",
            style: ButtonStyle.Primary,
            customId: "@command/bot/postReview"
          }
        ]
      };

      interaction.msg(embed);

      const components = this.getMainInterfaceComponents();
      components.at(0).disabled = true;

      parent.msg({edit: true, components});
      return;
    },
    postReview(interaction){
      const components = [{
        type: ComponentType.TextInput,
        customId: "content",
        style: TextInputStyle.Paragraph,
        label: "Введите сообщение"
      }];

      
      const modal = CreateModal({
        components,
        customId: "@command/bot/postReviewModal",
        title: "Отправьте отзыв"
        
      });
      
      interaction.showModal(modal);
      return;
    },
    postReviewModal(interaction){
      const description = interaction.fields.getField("content").value;
      const {user} = interaction;
      interaction.msg({
        ephemeral: true,
        content: "Спасибо!"
      });

      const embed = {
        author: {iconURL: client.user.avatarURL(), name: `Получен отзыв из сервера с ${ interaction.guild ? interaction.guild.memberCount : 0 } участниками(-ом)\nСодержимое:`},
        description,
        footer: {text: `${ user.tag } | ${ user.id }`, iconURL: user.avatarURL()},
        components: [{
          type: ComponentType.Button,
          label: "Ответить",
          customId: `@command/bot/answerForReview:${ user.id }`,
          style: ButtonStyle.Success
        }]
      };

      config.developers?.forEach(id => {
        const user = client.users.cache.get(id);
        user?.msg(embed);
      });
    },
    answerForReview(interaction, id){
      const user = client.users.cache.get(id);
      if (!user){
        interaction.msg({ephemeral: true, color: "#ff0000", description: "Неудалось найти пользователя"});
        return;
      }

      const components = [{
        type: ComponentType.TextInput,
        customId: "content",
        style: TextInputStyle.Paragraph,
        label: "Введите сообщение"
      }];

      
      const modal = CreateModal({
        components,
        customId: `@command/bot/answerForReviewModal:${ id }`,
        title: `Ответ ${ user.username }'у`
        
      });
      
      interaction.showModal(modal);
      return;
    },
    async answerForReviewModal(interaction, id){
      const description = interaction.fields.getField("content").value;
      const user = client.users.cache.get(id);
      

      const embed = {
        author: {iconURL: interaction.user.avatarURL(), name: `Получен ответ на отзыв`},
        description,
        color: "#6534bf",
        footer: {text: `Ответ предоставил ${ interaction.user.tag }`},
        image: "https://www.freepnglogos.com/uploads/line-png/draw-black-line-transparent-png-11.png"
      };

      const message = await user.msg(embed);

      Object.assign(embed, {
        reference: message.id,
        description: `<t:${ Math.floor(interaction.message.createdTimestamp / 1_000) }>\n>>> ${ interaction.message.embeds.at(0).description }`,
        author: {name: "Содержимое Вашего отзыва:", iconURL: user.avatarURL()},
        color: "#3260a8",
        footer: null
      });

      await user.msg(embed);

      

      interaction.msg({
        ephemeral: true,
        content: "Ваш ответ дошёл до пользователя!",
      });
    }
  }

	async onChatInput(msg, interaction){
    this.displayMainInterface(interaction);
  }


	options = {
	  "name": "bot",
	  "id": 15,
	  "media": {
	    "description": "\n\nПоказывает интересную информацию о боте. Именно здесь находится ссылка для приглашения его на сервер.\n\n:pencil2:\n```python\n!bot #без аргументов\n```\n\n"
	  },
	  "allias": "бот stats статс ping пинг стата invite пригласить",
		"allowDM": true,
		"cooldown": 10000000,
		"type": "bot"
	};
};

export default Command;
