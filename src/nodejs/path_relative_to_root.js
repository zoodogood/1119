import { path } from '#src/url/export.js'

const root = process.cwd()

export function cwd_path( ... relativePath ) {
	return path.resolve( root , ... relativePath )
}
