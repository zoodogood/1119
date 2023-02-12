import { readFileSync } from "fs";
const packageJSON = JSON.parse(readFileSync(`${ process.cwd() }/package.json`));

export default {
	"__version__": JSON.stringify(packageJSON.version.split(".")),
	"__buildedTimestamp__": Date.now()
}