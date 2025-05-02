export function responseWithAvatar( interaction ) {
	interaction.msg( { content: interaction.mentionedOrAuthor.avatarURL( {
		dynamic: true ,
	} ) } )
}
