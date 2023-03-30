

class Command {

	async onChatInput(msg, interaction){
    if (!interaction.params) {
      return;
    }

    msg.msg({description: "Эта бонусная функция доступна только для пользователей поддерживающих нас :green_heart: \nХотите быть одним из них? [**Поддержите нас!**](https://www.youtube.com/watch?v=MX-CO5i5S9g)"});
  }


	options = {
	  "name": "delete",
	  "id": 1,
	  "media": {
	    "description": "Шуточная команда, при попытке пользователем что-то удалить отправляет сообщение с требованием купить премиум и ссылкой на картофильное видео.\n\n✏️\n```python\n# secret\n```\n\n"
	  },
	  "allias": "удалить удали",
		"allowDM": true,
		"cooldown": 5000000,
		"type": "other"
	};
};

export default Command;