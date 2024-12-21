import { default as EventEmitter } from "node:events";

export function disposableListen(emitter, eventName, listener) {
	emitter.on(eventName, listener);
	return () => emitter.off(eventName, listener);
}

export { EventEmitter };
