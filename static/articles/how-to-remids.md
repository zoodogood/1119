# Напоминания — мощный инструмент.

##### Как удалить собственное напоминание:
- Способ 1. Через вызов `!напомни`, без аргументов — покажет все ваши напоминания с возможностью их удаления по средствам нажатия на реакцию корзины (🗑️). Она появляется под сообщением, если существует хотя бы одно напоминание;
- Способ 2. `!напомни --delete N` — используем флаг `--delete` (сокращенно `-d`), где N — номер напоминания для удаления.
  
В обоих случаях вы можете использовать ключевой символ `"+"` вместо указания параметра N (индекса элемента для удаления). Ключевой символ `"+"` означает: *удалить всё напоминания*.  
  
Также вы можете использовать отрицательные номера, вроде `--delete -1`, чтобы удалить последний элемент списка.
При использовании флага `--delete` вы так же можете удалить несколько напоминаний по номеру за раз: `--delete "1 2"`, — обратите внимание, что кавычки здесь используются для захвата в группу. Это обязательно, если значение флага имеет символ пробела.  
  
##### Как деактивировать напоминание пользователя на сервере:  
*Повторяющиеся напоминания могут быть очень полезны или деструктивны. Если участник отказывается сотрудничать, может быть разумно принять следующую меру:*  
  
Напоминания пользователя не будут отсылаться в те каналы, где участник не может отправлять сообщения. Это значит что временное заглушение (мьют), ограничение права отправки сообщений в определенном канале или изгнание с сервера — сведут на нет спам рассылку напоминаниями.  
  
***

### Применение
##### Базовое использование:
`!вызов_команды {время} <фраза>`  
**Время** может быть как относительное: 1м (с момента вызова команды), так и абсолютное: 12:00. Вы можете комбинировать метки времени, например: 12:00 1д 50с — означает завтра в 12:00:50. Или вот: 12.03 11:30 — полное указание даты и времени.  
**Фраза** — то, что бот вам отправит по достижении назначенного времени.  
  
*Интересно: `{}` — аргумент является обязательным; `<>` — параметр можно проигнорировать.*  
```
!напомни 2ч Вызвать команду босс
```
  
##### Исполняемая фраза:  
`!напомни 1m --eval {}`  
— Вызывает команду !эвал с параметром *фразы* по истечению времени.  
```
m'executeCommand("chest")
```
  
##### Повторяющиеся напоминания:
`!напомни 1m --repeat {}`, например --repeat 10  
  
— Одно и то же напоминание выполнится множество раз, в примере: 10, через равные промежутки времени.  
  
##### Упс: как задать время повторяющемуся напоминанию (хак):
*По умолчанию: Напоминания будут повторяться через одинаковый промежуток времени с момента их инициализации и вы не можете напрямую их вызывать, например, каждый день в 15:00, только если не вызовите эту команду в это время*.  
*Цель: заставить напоминание выполняться каждый день в 15:00*.  
  
```
!нап 15:00 --eval m'executeCommand("нап", "1d -r {количество_повторов} <фраза>")
```
##### Очистка напоминаний:
Смотреть выше: как удалить собственное напоминание.  