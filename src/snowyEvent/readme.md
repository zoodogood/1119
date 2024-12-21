Когда у разработчиков новогоднее настроение — это хорошо. 
Хочется поделится им с другими.
Иногда и у взрослых всё так же радостно как и в детсве.
Это хороший миг - одна из передышек целого года.
Всё хорошо

- [ ] Системы восстановлены 🔧  

### Время жизни события задукоментированно:

Глобально:
```mermaid
flowchart TD
	IN[/"new_day.time_event"/] --> A[TimeForSnowy?] 
A --> AA[mark_as_started]
A	-. No .-> AB[fully_clean]
```
Для каждой гильдии:
```mermaid
flowchart TD
	IN[/"onGetCoinsFromMessage"/] --> A["get_or_init_snowy_event_in(guild)"]
```

### Игровая площадка настроена:

// Последовательный способ активации события
- Чтобы досрочно вызвать событие установите DataManager.data.bot.snowyEvent.now в значение `true`
- Не стесняйся!

```
!eval m'DataManager.data.bot.snowyEvent ||= {};
m'DataManager.data.bot.snowyEvent.now = true
```
Досрочно получить коин-сообщение: 
```
!eval m'requestCoinFromNextMessage(userId)
```
Событие активируется на сервере, когда три разных участника получат коин из сообщения, после чего получения коин-сообщений будут приводить к получению проклятий `happySnowy`
***
// Продвинутый способ достижения атрибутов события
```
!eval const {guild} = m'interaction; 
m'DataManager.data.bot.snowyEvent = {now: true}
guild.data.snowyEvent = { preGlowExplorers: [], isArrived: true };
// удовлетворяет проверке на трёх участников-исследователей
guild.data.snowyEvent.preGlowExplorers = m'config.developers;

m'requestCoinFromNextMessage("id'")
```