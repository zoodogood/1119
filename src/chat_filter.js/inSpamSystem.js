import {
	MESSAGES_SPAM_FILTER_ALLOWED_IN_SUCCESSION ,
	MESSAGES_SPAM_FILTER_TARGET_ALWAYS ,
	MESSAGES_SPAM_FILTER_TARGET_WHEN_PASSED ,
} from '#src/chat_filter.js/constants.js'

export function inMessageSpamLimit( user ) {
	return (
		Date.now()
		+ MESSAGES_SPAM_FILTER_ALLOWED_IN_SUCCESSION
		* MESSAGES_SPAM_FILTER_TARGET_WHEN_PASSED
		< user.CD_msg
	)
}

export function process_spam_protocol( user ) {
	user.CD_msg
		= Math.max( user.CD_msg || 0 , Date.now() ) + MESSAGES_SPAM_FILTER_TARGET_ALWAYS
	const prevent_like_spam = inMessageSpamLimit( user )
	if ( prevent_like_spam ) {
		return false
	}
	const perEffect = MESSAGES_SPAM_FILTER_TARGET_WHEN_PASSED / 20 / 2
	user.CD_msg
		+= MESSAGES_SPAM_FILTER_TARGET_WHEN_PASSED
			- perEffect * ( user.data.voidCooldown ?? 0 )
	return true
}
