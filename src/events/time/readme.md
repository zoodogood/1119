The nearestEvent field should point to the nearest event. Always.
This is the basis for functions such as this one:
```ts
// getNearestDay() is:
(this._nearestEvent && timestampDay(this._nearestEvent.timestamp))
```

#### Lifecycle

onActiveNearestEventCancelled(): request that _nearestEvent swapped

_nearestEvent_onPerformRequest(): request perform nearestEvent

onEventTimestampChanged(): make sure that order is ensured

onStartup(): start lifecycle