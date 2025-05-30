import config from '#config'
import { DAY } from '#constants/time.js'
import { fetchFromInnerApi } from '#src/http_requests/fetchFromInnerApi.js'

import { parseDocumentLocate , ReplaceTemplate } from '#src/safe-utils.js'
import PagesURLs from '#src/site/build/_public_out/enum[builded].mjs'
import { createDialog } from '#src/site/build/components/lib/createDialog.js'

import { whenDocumentReadyStateIsComplete } from '#src/site/build/components/lib/dom_utils.js'

import HashController from '#src/site/build/components/lib/HashController.js'
import PagesRouter from '#src/site/build/components/lib/page_router_singleton.js'
import enviroment from '#src/site/build/rollup-plugin-replace/template.js'
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
	url = parseDocumentLocate( document.location )
	user = this.storage.getUserData()

	get href() {
		return document.location.href
	}

	constructor() {
		this.lang = this.storage.getSelectedLocale() ?? 'ru'
		this.i18n = this.enviroment.i18n?.[ this.lang ]

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
		await whenDocumentReadyStateIsComplete()

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

	#checkURLLocaleProtocol() {
		const locale = this.url.queries.lang
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
