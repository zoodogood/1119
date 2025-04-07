import { readPackageJson } from '#src/nodejs/readPackageJson.js'

const { version } = await readPackageJson()
export { version }
