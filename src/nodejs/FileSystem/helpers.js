import { FileSystem } from '#src/nodejs/FileSystem/export.js'
import { path } from '#src/url/export.js'

export function mkdirRecursive( path ) {
	return FileSystem.mkdir( path , { recursive: true } )
}

export async function file_symlink_auto( existingPath , destination ) {
	await mkdirRecursive( path.dirname( destination ) )
	return FileSystem.symlink( existingPath , destination , 'file' ).catch( ( error ) => {
		if ( error.code === 'EEXIST' ) {
			return
		}
		console.error( error )
		throw error
	} )
}
