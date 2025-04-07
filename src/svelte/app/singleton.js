import config from '#config'
import { DAY } from '#constants/time.js'
import enviroment from '#root/src/site/_build/src/_enviroment/mod.js'

import { createDialog } from '#root/src/site/_build/src/lib/createDialog.js'
import HashController from '#root/src/site/_build/src/lib/HashController.js'

import PagesRouter from '#root/src/site/_build/src/lib/page_router_singleton.js'
import { whenDocumentReadyStateIsComplete } from '#root/src/site/_build/src/lib/util.js'
import PagesURLs from '#root/src/site/public/build/svelte-pages/enum[builded].mjs'
import { fetchFromInnerApi } from '#src/http_requests/fetchFromInnerApi.js'
import { parseDocumentLocate , ReplaceTemplate } from '#src/safe-utils.js'
import { omit } from '@zoodogood/utils/objectives'

class StorageManager {
	getSelectedLocale() {
		return localStorage.getItem( 'selected_locale' ) ?? null
	}

	getToken() {
		return localStorage.getItem( 'access_token' )
	}

	getUserData() {
		return JSON.parse( localStorage.getItem( 'user' ) ?? null )
	}

	setLocale( locale ) {
		if ( locale === null ) {
			localStorage.removeItem( 'selected_locale' )
			return
		}

		localStorage.setItem( 'selected_locale' , locale )
	}

	setToken( token ) {
		if ( token === null ) {
			localStorage.removeItem( 'access_token' )
			return
		}

		return localStorage.setItem( 'access_token' , token )
	}

	setUserData( user ) {
		if ( user === null ) {
			localStorage.removeItem( 'user' )
			return
		}

		const ignoreKeysList = [ 'guilds' ]
		user = omit( user , key => !ignoreKeysList.includes( key ) )
		return localStorage.setItem( 'user' , JSON.stringify( user ) )
	}

	yetTokenHeat() {
		if ( localStorage.tokenHeat > Date.now() ) {
			return true
		}

		const HEAT_DELAY = DAY * 14
		localStorage.tokenHeat = Date.now() + HEAT_DELAY
		return false
	}
}

class SvelteApp {
	Date = ( new Date )
	document = document
	enviroment = enviroment
	Hash = this.#createHashController()
	HashData
	i18n = null
	PagesURLs = PagesURLs
	storage = ( new StorageManager )
	url = parseDocumentLocate( this.document.location )
	user = this.storage.getUserData()

	get href() {
		return this.document.location.href
	}

	constructor() {
		this.lang = this.url.base.lang ?? this.storage.getSelectedLocale() ?? 'ru'
		this.i18n = this.enviroment.i18n?.[ this.lang ]

		this.#checkOrigin()
		this.#checkExternalUserDataByToken()
		this.#checkURLLocaleProtocol()
		console.info( this )
	}

	getBot() {
		const bot = this.enviroment.bot ?? {
			id: null ,
			username: 'Призрак' ,
			discriminator: '1119' ,
			displayAvatarURL: `${ config.server.origin }/public/favicon.ico` ,
			invite: null ,
		}

		return bot
	}

	async #checkExternalUserDataByToken() {
		await whenDocumentReadyStateIsComplete( this.document )

		const token = this.storage.getToken()
		if ( !token ) {
			return
		}

		const yet = this.storage.yetTokenHeat()
		if ( yet ) {
			return
		}

		const headers = { Authorization: token }
		const user = await fetchFromInnerApi( 'oauth2/user' , { headers } ).catch(
			() => {} ,
		)

		if ( !user || typeof user === 'string' ) {
			const _key = PagesRouter.getPageBy( 'oauth' ).key
			const link = PagesRouter.relativeToPage( _key )
			createDialog( svelteApp , {
				title: this.i18n.general.app.externalTokenDialog.title ,
				description: ReplaceTemplate(
					this.i18n.general.app.externalTokenDialog.description ,
					{ link , _key } ,
				) ,
				isHTMLAccepted: true ,
			} )
			return
		}

		this.storage.setUserData( user )
	}

	#checkOrigin() {
		if ( config.server.origin !== this.document.location.origin ) {
			console.error(
				`You need set in config server.origin equal to ${ this.document.location.origin }\nCurrent: ${ config.server.origin }` ,
			)
		}
	}

	#checkURLLocaleProtocol() {
		const locale = this.url.base.lang
		if ( !locale ) {
			return
		}

		this.storage.setLocale( locale )
	}

	#createHashController() {
		const controller = ( new HashController ).subscribe()
		controller.store.subscribe( this.#onHashUpdate.bind( this ) )
		return controller
	}

	#onHashUpdate( hash ) {
		const data = ( this.HashData ||= { hash: {} } )
		data.currentHash = hash
		Object.assign( data.hash , hash )
	}
}

const svelteApp = ( new SvelteApp )

export default svelteApp
export { svelteApp }
