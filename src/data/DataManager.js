import { mol_tree2_string_from_json } from '#src/$mol.js'
import { assert } from '#src/assert/export.js'
import client from '#src/bot/client/singleton.js'
import StorageManager from '#src/data/StorageManager/singleton/index.js'
import { EventEmitter } from '#src/EventEmitter/export.js'
import { Guild , User } from 'discord.js'

class DataManager {
	/**
	 * @type {import("#src/data/schema.js").DataManager}
	 */
	static data = {}

	static emitter = ( new EventEmitter )
	static Events = {
		Ready: 'Ready' ,
	}

	static file = {
		load: async () => {
			const data = await ( async () => {
				try {
					const content = await StorageManager.read( 'main.json' )
					assert( content !== null )
					return JSON.parse( content )
				} catch {
					return this.file.defaultData
				}
			} )()

			this.data = data
			this.emitter.emit( DataManager.Events.Ready )
		} ,
		write: async () => {
			const data = JSON.stringify( this.data )
			await StorageManager.write( 'main.json' , data )
			await StorageManager.write(
				'data_manager__data.tree' ,
				mol_tree2_string_from_json( this.data ) ,
			)
		} ,
		defaultData: {
			bot: {
				commandsUsed: {} ,
			} ,
			guilds: [] ,
			users: [] ,
		} ,
	}

	static extendsGlobalPrototypes() {
		const manager = this

		Object.defineProperty( Guild.prototype , 'data' , {
			enumerable: false ,
			get() {
				if ( 'cacheData' in this ) {
					return this.cacheData
				}
				const guild = manager.getGuild( this.id )
				Object.defineProperty( this , 'cacheData' , {
					value: guild ,
				} )
				return guild
			} ,
		} )

		Object.defineProperty( User.prototype , 'data' , {
			enumerable: false ,
			get() {
				if ( 'cacheData' in this ) {
					return this.cacheData
				}
				const userData = manager.getUser( this.id )
				Object.defineProperty( this , 'cacheData' , {
					value: userData ,
				} )
				return userData
			} ,
		} )
	}

	static getGuild( id ) {
		const createGuild = ( id ) => {
			const guild = client.guilds.cache.get( id )
			const data = this.guildToDefaultData( guild , id )
			this.data.guilds.push( data )
			return data
		}

		return this.data.guilds.find( guild => guild.id === id ) ?? createGuild( id )
	}

	static getUser( id ) {
		const createUser = ( id ) => {
			const user = client.users.cache.get( id )
			const data = this.userToDefaultData( user , id )
			this.data.users.push( data )
			return data
		}
		return this.data.users.find( user => user.id === id ) ?? createUser( id )
	}

	static guildToDefaultData( guild , id ) {
		return {
			id ,
			name: guild?.name ?? null ,
			day_msg: 0 ,
			msg_total: 0 ,
			days: 0 ,
			commandsLaunched: 0 ,
			coins: 0 ,
			commandsUsed: {} ,
			members: {} ,
		}
	}

	static require_load() {
		return !!Object.keys( this.data ).length || this.file.load()
	}

	static userToDefaultData( user , id ) {
		return {
			id: user?.id ?? id ,
			name: user?.username ?? null ,
			coins: 50 ,
			level: 1 ,
			exp: 0 ,
			berrys: 1 ,
			chestLevel: 0 ,
			void: 0 ,
			keys: 0 ,
			voidRituals: 0 ,
			voidCoins: 0 ,
		}
	}
}

export default DataManager
