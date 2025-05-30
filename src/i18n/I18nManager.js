import { mol_tree2_json_from_string } from '#src/$mol.js'
import { accrueAsync , arrayMapFactory , promiseAll } from '#src/accrue/accrue.js'
import { FileSystem } from '#src/nodejs/FileSystem/export.js'
import { deepAssign , toDotNotatedFlat } from '#src/safe-utils.js'
import { glob } from 'glob'

class StorageUtils {
	static async readLocales() {
		return await accrueAsync(
			glob( '**/*.i18n.tree' , { absolute: true } ) ,
			arrayMapFactory( p => accrueAsync( p , FileSystem.readFile , mol_tree2_json_from_string ) ) ,
			promiseAll ,
			values => deepAssign( ... values ) ,
			values => toDotNotatedFlat( values , entry => 'ru' in entry ) ,
			Object.freeze ,
		)
	}
}
class I18nManager {
	static DEFAULT_LOCALE = 'ru'

	static resolveLocale( locale ) {
		locale ||= this.DEFAULT_LOCALE
		return (
			{
				'ru': 'ru' ,
				'ru-ru': 'ru' ,
				'uk': 'ua' ,
				'ua': 'ua' ,
				'en': 'en' ,
				'uk_ua': 'ua' ,
				'ua-ua': 'ua' ,
				'en_us': 'en' ,
				'en_gb': 'en' ,
				'en-en': 'en' ,
			}[ locale.toLowerCase() ] ?? this.DEFAULT_LOCALE
		)
	}

	f( ... params ) {
		return this.format( ... params )
	}

	format( key , locale , { values = {} } = {} ) {
		locale = I18nManager.resolveLocale( locale )
		let string
			= this.getRaw( key , locale ) || this.getRaw( key , I18nManager.DEFAULT_LOCALE )

		for ( const [ replacer , value ] of Object.entries( values ) ) {
			string = string.replace( `$${ replacer }` , value )
		}

		if ( !string ) {
			throw new Error( `I18n not found: cannot find "${ key }"` )
		}

		return string
	}

	getRaw( key , locale ) {
		return this.data[ key ]?.[ locale ]
	}

	async load() {
		this.data = await StorageUtils.readLocales()
	}
}

export { I18nManager }
export default I18nManager
