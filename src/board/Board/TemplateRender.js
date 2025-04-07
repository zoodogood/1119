import EventEmitter from 'node:events'
import {
	mol_tree2_json_from_string ,
	mol_tree2_string_from_json ,
} from '#src/$mol.js'
import { Loop } from '#src/board/Board/Loop.js'
import StorageManager from '#src/data/StorageManager/StorageManager.js'

export class TemplateRender {
	emitter = ( new EventEmitter )
	loop = new Loop( { items: [] } )
	file = {
		path: `template_render_cron.tree` ,
		load: async () => {
			const { path } = this.file
			const plain = await StorageManager.read( path )
			const data = plain && mol_tree2_json_from_string( plain )
			this.loop.items = data || this.file.defaultData
		} ,
		write: async () => {
			const { path } = this.file
			const plain = mol_tree2_string_from_json( this.loop.items )
			await StorageManager.write( path , plain )
		} ,
		defaultData: [] ,
	}

	constructor( { interval } ) {
		this.loop.interval = interval
	}
}
