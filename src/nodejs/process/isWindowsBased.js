import process from 'node:process'

let _mem

export function isWindowsBased() {
	return _mem ||= process.platform === 'win32'
}
