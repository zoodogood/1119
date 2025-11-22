import { path } from '#src/url/export.js'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 
 * @description Always indicates to project root folder
 */
export function projectRootPath() {
	return resolve(dirname(fileURLToPath(import.meta.url)), '..')
}

export function relativeToProjectRoot(...paths: string[]){
	return path.join(projectRootPath(), ...paths)
}