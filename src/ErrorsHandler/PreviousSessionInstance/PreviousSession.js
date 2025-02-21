/** @import {ErrorsHandler} from '#src/ErrorsHandler/ErrorsHandler.js' */
// declare state: file://./readme.md

import { process_startedAt } from "#src/nodejs/process_startedAt.js";

export class PreviousSession {
	_value = null;
	/**
	 * @type {ErrorsHandler}
	 */
	errorsHandler;

	get fileId() {
		const { File } = this.errorsHandler;
		return File.keys().then(($) =>
			Math.max(
				...$.map(Number).filter((session) => session !== process_startedAt()),
			),
		);
	}
	get value() {
		return (this._value ||= new Promise(async (resolve) => {
			const { File } = this.errorsHandler;
			const { fileId: newest } = this;
			resolve(await File.readFile(String(await newest)));
		}));
	}

	constructor(errorsHandler) {
		this.errorsHandler = errorsHandler;
	}
}
