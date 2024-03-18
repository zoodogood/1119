<p align="center">
  <img src="https://user-images.githubusercontent.com/52154209/179919919-1dbe8380-5a08-4c19-8039-9f3520f582d9.png" data- width="120" height="120" />  
<p>



> `pnpm build` ИЛИ `pnpm docker`  
Чтобы произвести инициализацию вне контейнера: pnpm build & pnpm start или концепция докер контейнеров: pnpm docker чтобы собрать и запустить образ в докере


В обоих случаях прежде требуется установить переменные окружения:   
`cp folder/developers/.env.example .env`  
Настройка файла конфигурации не является обязательной для первичного запуска:  
`cp folder/developers/config.json.js.example src/config.json.js`

***

Discord Bot с множеством интересных возможностей, и да, как вы заметили весь код нахоидтся в одном файле.  
Что интересно поддерживать его всегда было очень легко, даже сейчас спустя 2 года по необходимости я могу исправить какой-то баг, изменить команду или что-то поменять в корне  
  
[Пригласить бота.](https://discord.com/api/oauth2/authorize?client_id=924322448298639422&permissions=1073741832&scope=applications.commands%20bot)  
***

## Список команд:

Шуточная команда, при попытке пользователем что-то удалить отправляет сообщение с требованием купить премиум и ссылкой на картофильное видео.

✏️
```python
# secret
```

---

Отправляет ваше сообщение от имени призрака. Также это отличная команда для тестирования шаблонов.
Личная просьба: Используя команду при разговоре, не нарушайте каноничность характера бота, это действительно важно в первую очередь для меня. Спасибо за понимание :green_heart:

✏️
```python
!c {text}
```
![](https://cdn.discordapp.com/attachments/769566192846635010/872441895215824916/send.gif)

---

Отображает профиль пользователя — ежедневный квест, количество коинов, уровень, содержимое инвентаря и тому подобное.

✏️
```python
!user <memb>
```

---

Стандартная команда отображающую основную информацию о возможностях бота. Она нужна чтобы помочь новым пользователям. Её так же можно вызвать отправив `/help`

✏️
```python
!help #без аргументов
```

---

Можете похвалить пользователя, например, если он классный. Однако количество похвал ограничено и зависит от уровня в профиле.

✏️
```python
!praise {memb}
```

---

Отображает список людей, которых вы похвалили и которые похвалили вас.

✏️
```python
!praises <memb>
```

---

Выдаёт формальное предупреждение пользователю — —

✏️
```python
!warn {memb}
```

---

**Чистит сообщения в канале и имеет четыре режима:**
1. Количесвенная чистка — удаляет указанное число.
2. "Удалить до" — чистит всё до сообщения с указанным содержимым.
3. Сообщения пользователя — стирает только сообщения отправленные указанным пользователем.
4. Если не указать аргументов, будет удалено 75 последних сообщений.
ᅠ
✏️
```python
!clear <memb | count | messageContent> #messageContent — содержимое сообщения до которого провести чистку, не учитывает эмбеды и форматирование текста*
```
![](https://media.discordapp.net/attachments/769566192846635010/872526568965177385/clear.gif)

---

Создаёт эмбед конструктор — позволяет настроить красивое сообщение и отправить в канал на вашем сервере.

❓ Кроме того, что это любимая команда разработчика, конструктор весьма прост и полезен. Используйте реакции, для настройки эмбеда

✏️
```python
!embed <JSON>
```

---

Архивирует сообщения в канале и отправляет содержимое пользователю в виде файла.

✏️
```python
!archive #без аргументов
```

---

Устанавливает для бота указанный канал, как чат, туда будет отправляться ежедневная статистика, а также не будут удалятся сообщения о повышении уровня.

✏️
```python
!setChat <channel>
```

---

Устанавливает для бота указанный канал, как логи, иначе говоря — журнал, туда будет записываться информация о применении пользователями небезопасных команд, статистике, важных изменениях и многом другом.
Настоятельно рекомендуется создать такой канал, если его нет.

✏️
```python
!setLogs <channel>
```

---

Бот будет приветствовать новых пользователей именно так, как вы ему скажете, может выдавать новичкам роли, отправлять в канал ваше сообщение или просто помахать рукой.

✏️
```python
!welcomer (без аргументов)
```

---

Используйте, чтобы передать коины другому пользователю в качестве доброго подарка или оплаты за помощь :wink:

✏️
```python
!pay {memb} {coinsCount | "+"} <message> #аргументы можно указывать в любом порядке. "+" обозначает "Все коины, которые у вас есть"
```

---

Показывает интересную информацию о боте. Именно здесь находится ссылка для приглашения его на сервер.

✏️
```python
!bot #без аргументов
```

---

Отображает список лидеров на сервере по различным показателям.

Существующие данные:
• Количество коинов
• Уровень
• Похвалы
• Успешность краж
• Статистика квестов
• Использование котла

✏️
```python
!top #без аргументов
```

---

Заглушает пользователя во всех каналах сервера не давая ему отправлять сообщения. Необходимо её использовать, когда участники мешают беседе или нарушают правила.

❓ Вы можете указать время, через которое пользователь автоматически снова сможет общаться.

✏️
```python
!mute {memb} <cause> <time> #Вы можете вводить аргументы в любом порядке, время в формате 1 день 3 с 15min
```
![](https://images-ext-2.discordapp.net/external/fBq1I0O3Tdhoi-DeVVm7nDadXN-uzdgKveyekp-Vm88/https/media.discordapp.net/attachments/769566192846635010/872776969341796382/mute.gif)

---

Мут наоборот — снимает ограничения на общение в чатах для пользователей.

✏️
```python
!unmute {memb}
```

---

Реактор — команда позволяющая создавать "роли за реакции" — возможность пользователям выбирать себе роли нажимая реакции под сообщением.

:information_source:
Возможность пользователями выбирать роли даёт множество вариантов персонализации сервера.

✏️
```python
!reactor #без аргументов
```

---

Настройки вашего профиля: Цвет, описание, день рождения и режим конфиденциальности

✏️
```python
!setProfile {"осебе" | "цвет" | "др" | "конфиденциальность"} {value} #для реж. конфиденциальности аргумент value не нужен
```

---

Старые тестирования муз. команд.

✏️
```python
!voice #без аргументов
```

---

Отображает список ближайших именинников! :tada:
Не забудьте поздравить их с праздником.

✏️
```python
!birthdays #без аргументов
```

---

Отправляет список смайликов на сервере или подробную информацию об одном из них.

✏️
```python
!emojis <emoji|emojiID>
```

---

Если у вас есть идеи как можно улучшить бота — с помощью этой команды отправьте её на сервер.
Не забудьте позже обсудить её в чате, подробно расписывая особенности вы повышаете вероятность того, что она будет реализована.


✏️
```python
!idea {content}
```

---

Лавка бесполезных вещей, цены которых невероятно завышены, на удивление, заведение имеет хорошую репутацию и постоянных клиентов.

✏️
```python
!grempen #без аргументов
```

---

– Знаете.. Дискорд ужасная платформа для написания документаций и другой работы с текстом при использовании ботов. Чтобы сделать маленькую поправку, зачастую нужно заново отправлять каждое сообщение.

Для решения этой проблемы создана эта команда, она может:
• Изменить порядок сообщений в канале;
• Получать JSON объект эмбед-сообщения, для его дальнейшего редактирования;

✏️
```python
!embeds <messageID> # messageID нужен только если в канале больше 100 эмбедов
```

---

Клубника — яркий аналог золотых слитков, цена которых зависит от спроса.
Через эту команду осуществляется её покупка и продажа, тут-же можно увидеть курс.

✏️
```python
!berry <"продать" | "купить"> <count>
```

---

Отображает основную информацию и статистику о сервере, в том числе бонусы связанные с этим ботом.
В неё входят: количество пользователей, каналов, сообщений или эффект клевера (если есть), а также установленные каналы, дата создания и другое

✏️
```python
!server #без аргументов
```

---

Настройки сервера (бот) — Фильтр чата, канал логов, основной чат, описание и баннер для команды `!сервер` — способы управления сервером.

✏️
```python
!editserver #без аргументов
```

---

Отправляет сообщение от вашего имени в указанное время;
Удалено в связи с тем, что время пользователей может отличатся от времени бота

✏️
```python
!postpone {content} {time} #время в формате 15:30
```

---

Хотя мы не знаем ваш настоящий IQ, можем предложить наш собственный..
Возможно, когда-то у нас появится тест на ICQ

✏️
```python
!iq <memb>
```

---

Ежедневный-обычный сундук, ничем не примечательный...
Пожалуйста, не пытайтесь в него заглядывать 20 раз в сутки.

❓ Может быть улучшен:
Улучшение происходит через проведение ритуала в котле при достаточном количестве ресурса, Ключей.
Для улучшения сундука до второго надо 150 ключей, и 500 до третьего.

✏️
```python
!chest #без аргументов
```

---

Отправляет красивое [изображние-карточку](https://media.discordapp.net/attachments/781902008973393940/784507304350580826/level.png) вашего уровня!
Согласитесь, выглядит [неплохо](https://cdn.discordapp.com/attachments/781902008973393940/784513626413072404/level.png).

[Апхчи.](https://cdn.discordapp.com/attachments/702057949031563264/786891802698711050/level.png)

✏️
```python
!level <memb>
```

---

Только величайшие из невеличайших смогут разгадать этот пазл, и то, почему-же он удалён...
🧐

✏️
```python
!puzzle <answer> #answer — ответ на головоломку, ответите правильно, получите 3000 золотых
```

---

Вы можете присваивать пользователям информацию, удобно изменять её и просматривать.
Это полезная и универсальная функция для РП серверов, хотя для большенства она может оказаться бесполезной.

✏️
```python
!variables <memb | "сервер"> <propertyName> <properyValue> # propery переводится как: "свойство"
```

---

Создание пользовательских команд на сервере — ещё один этап к многофункциональной системе шаблонов и переменных сервера, обязательно комбинируйте эти технологии
_устарело*_

✏️
```python
!guildCommand #без аргументов
```

---

Бывает такое, что вы хотите дать право для одной роли управлять другой ролью, и только ею? Редко, но такая потребность действительно имеется, и теперь вы знаете что с ней делать!

✏️
```python
!role <memb> <roleID> #аргументы нужны только при выдаче / снятии роли. roleID Даже в этом случае необязателен
```

---

Мини-игра "Жгучий перчик" подразумивает перебрасывание вымешленного перца, который через некоторое время бабахнет в руках у одного из участников — в этом случае игрок проигрывает.
Стратегия здесь приветсвуется, а сама игра отлично подходит для проведения турниров.

✏️
```python
!chilli {memb}
```

---

Правила просты:
Ваши перчатки позволяют ограбить участника, при условии, что он находится онлайн.
В течении минуты у ограбленного есть возможность догнать вас и вернуть деньги.
Если попадётесь дважды, то перчатки нужно покупать заново — риск.
Нужно быть осторожным и ловким, искать момента.

А пользователям стоит применять хитрость, если кто-то обнаружил, что у вас есть перчатки.
Цель участников спровоцировать на них напасть и поймать вас на горячем, а вор, то есть вы, должен выждать хорошего момента и совершить атаку.

✏️
```python
!rob {memb} <note> # С помощью `note` вы можете оставлять записки пользователям, которых грабите
```
![](https://static.tumblr.com/3f31d88965fd2e42728392a079958659/ngjf4de/g0np1hy8q/tumblr_static_filename_2048_v2.gif)

---

Всегда отвечающий "нет" Шар, почему все думают, что он всевидящий?

✏️
```python
!ball {question?} # Не спрашивайте у него как его дела
```
![](https://media.discordapp.net/attachments/769566192846635010/872442452152307762/ball.gif)

---

Отправляет картинку-аватар красивого пользователя <:panda:637290369964310530>
Если вы хотите достичь более хорошего качества чем 128х128px, вам явно понадобится напрямую попросить человека поделится фоточками

✏️
```python
!avatar <memb>
```

---

Отличный способ отображать статистику — с помощью шаблонов создайте динамический текст, который будет меняться каждые 15 минут. Счётчики могут менять как имя любого канала, так и содержание сообщения.

✏️
```python
!counter #без аргументов
```

---

Отображает список существующих счётчиков на сервере. См. команду `!counter`

✏️
```python
!counters #без аргументов
```

---

Создаёт напоминание, например, выключить суп, ну или что ещё вам напомнить надо :rolling_eyes:

✏️
```python
!remind {time} {text} #Время в формате 1ч 2д 18м
```

---

Хотите порадовать участников сервера? Поднять планку ажиотажа? :tada:
С помощью этой команды вы сможете разыграть награду между пользователями, а какую именно — решать только вам, будь это роль, ключик от игры или мешочек коинов?

❓ Чтобы участвовать пользователи нажимают реакцию под появившимся сообщением, и через указанное время среди всех, кто это сделал случайно будет один или несколько победителей.

✏️
```python
!giveaway #без аргументов
```

---

Команда сугубо для тестирования новой версии шаблонов

✏️
```python
!template {template}
```

---

Ежедневные и глобальные квесты помогают поднять актив на сервере, ставят цели и награждают за их достижения.
Используя команду, вы можете просмотреть их список, а также статистику.

✏️
```python
!quests <memb>
```

---

Котелок даёт неплохие бонусы, а так же вводит концовку в боте — используя котёл 20 раз, вы раскроете её, попутно читая небольшой рассказ и уничтожив парочку вселенных.

✏️
```python
!witch #без аргументов
```

---

Вы слишком добрые, если собираетесь воспользоваться этой командой, она позволяет раздать коины случайным участникам на сервере, их получат даже неактивные участники. Перед тем как устроить благотворительность подумайте больше одного раза, ведь это не имеет смысла

✏️
```python
!charity {coins | "+"} <usersCount> #"+" обозначает "Все коины, которые у вас есть"
```

---

Во-первых, банк позволяет не смешивать приключения с обязанностями, а во-вторых, это просто удобно.
Также с их помощью вы можете создать на сервере профессии с автоматически выдаваемыми зарплатами!

✏️
```python
!bank <"взять" | "положить"> <coins | "+"> #"+" обозначает "Все коины, которые у вас есть"
```
![](https://cdn.discordapp.com/attachments/769566192846635010/872463081672949890/bank.gif)

---

Хотя это и команда разработчика, вы можете просмотреть ваши данные из базы данных в JSON формате, для этого просто не вводите никаких аргументов.

✏️
```python
!eval #без аргументов
```

---

Повезло-повезло:
1) Даёт деньги в банк сервера
2) Абсолютно рандомная и непредсказуемая фигня
3) Также даёт неплохие бонусы
Пссс, человек, я принимаю идеи по добавлению новых ивентов, надеюсь, ты знаешь где меня искать..

✏️
```python
!thing <"улучшить" | "я">
```

---

Показывает информацию об указанной команде, собственно, на её основе вы и видите это сообщение


✏️
```python
!commandInfo {command}
```

---

Клубничное дерево? М-м, вкусно, а говорят они на деревьях не ростут..
Оно общее и распространяется по серверу. Будет приносить ягоды, которые может собрать каждый
_Будьте осторожны, растение может засохнуть, если на сервере недостаточно "актива"_

✏️
```python
!tree #без аргументов
```

---

Совместный Ютуб — новая возможность дискорда, в отличии от музыкальных команд видео транслируется напрямую из ютуба, а не к боту и уже потом к каналу. Нагрузка на бота при таком подходе сводится к нулю.
Самая скучная по своим внутренностям команда.

✏️
```python
!youtube #без аргументов
```

---

Присвойте ссылкам их уникальную роль. Как это работает?
Вы как администратор создаете роль, назовём её \"Фунтик\" и решаете, какие пользователи будут получать её при входе на сервер. Есть несколько типов условий, которые это определяют, они указаны в порядке приоритета и их может быть несколько.

1) В режиме постоянной ссылки, вы просто указывете её, и всем, кто пришёл на сервер через эту ссылку будет выдана роль Фунтик.
2) Выдаваемая роль будет определяться наличием у пригласившего другой роли, например, \"Хороший друг\". Любая ссылка созданная \"Хорошим другом\" будет давать Фунтика
3) По умолчанию. Если не отработал ни один вариант выше, будет выдана наша роль

Зачем это?
Вы можете определить права участника в зависимости от того, кто его пригласил; ведение статистики, распределение людей которые пришли с партнёрки и по знакомству, тому подобное. Это то, что вы можете сделать с помощью этой команды

✏️
```python
!invites #без аргументов
```

---

Меня долго просили сделать Казино. И вот оно здесь!
Такое же пустое как и ваши кошельки

✏️
```python
!casino {coinsBet | "+"}
```

---

Никто кроме владельца не может просматривать содержимое сумки. В неё можно положить любой предмет будь то нестабильность, клубника и даже бонусы
Сумка это альтернатива использования казны как личного хранилища. При этом она всегда под рукой!

✏️
```python
!bag <"take" | "put"> <item> <count | "+"> # аргументы могут быть указаны в любом порядке
```
