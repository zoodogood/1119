[ErrorsHandler](../readme.md)/   
{ PreviousSessionInstance

### PreviousSession
Лениво предоставляет и мемоизирует данные о файле с данными ошибок предыдущей сессии

```mermaid
flowchart TD
	IN[/"get_session()"/] --> B("{meta: {}, groups: []}")
```

### Playground
Выполните команду `!bug --errors-list`.
Она использует данную функциональность чтобы предоставить релевантную информацию об ошибках.