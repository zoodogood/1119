/** @import {ErrorsHandler} from '#src/ErrorsHandler/ErrorsHandler.js' */
// declare state: file://./readme.md

import { process_startedAt } from "#src/nodejs/process_startedAt.js";

export class PreviousSession {
	_value = null;
	/**
	 * @type {ErrorsHandler}
	 */
	errorsHandler;
	constructor(errorsHandler) {
		this.errorsHandler = errorsHandler;
	}

	get value() {
		return (this._value ||= new Promise(async (resolve) => {
			const { File } = this.errorsHandler;
			const newest = Math.max(
				...(await File.keys())
					.map(Number)
					.filter((session) => session !== process_startedAt()),
			);
			resolve(await File.readFile(String(newest)));
		}));
	}
}
