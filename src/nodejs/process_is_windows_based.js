import process from 'node:process'

let _mem

export function processWindowsBased() {
	return _mem ||= process.platform === 'win32'
}
