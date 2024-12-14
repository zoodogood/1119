import { PreviousSession } from "#lib/ErrorsHandler/PreviousSessionInstance/PreviousSession.js";
import { ErrorsHandler } from "#lib/modules/mod.js";

export const errors_handler_previous_session = new PreviousSession(
	ErrorsHandler,
);

export function get_session() {
	return errors_handler_previous_session.value();
}
