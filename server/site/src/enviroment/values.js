import { readFileSync } from "fs";
import config from '#src/config';
const packageJSON = JSON.parse(readFileSync(`${ config.cwd }/package.json`));

export default {
	"__version__": JSON.stringify(packageJSON.version.split(".")),
	"__buildedTimestamp__": Date.now()
}