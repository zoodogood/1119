import ErrorsHandler from "#src/ErrorsHandler/ErrorsHandler.js";
import { PreviousSession } from "#src/ErrorsHandler/PreviousSessionInstance/PreviousSession.js";

export const errors_handler_previous_session = new PreviousSession(
	ErrorsHandler,
);

export function get_session() {
	return errors_handler_previous_session.value;
}
