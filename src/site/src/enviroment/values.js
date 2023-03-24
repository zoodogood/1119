
import config from "#config";
import { fetchFromInnerApi, getPackageJSON, yaml } from "#lib/safe-utils.js";
import { ImportDirectory } from "@zoodogood/import-directory";
import FileSystem from 'fs/promises';
import Path from 'path';

const packageJSON = await getPackageJSON();
const bot = (await fetchFromInnerApi("./client/user").catch(() => null)) ?? null;

const i18n = await new Promise(async resolve => {
	
	const FOLDER = `${ config.i18n.path }/site`;
	const files = await new ImportDirectory({regex: /\.yaml$/}).takeFilesPath({path: FOLDER});
	
	const locales = {};

	for (const filePath of files){
		const content = await FileSystem.readFile(filePath);
		const name = Path.basename(filePath, ".yaml");
		locales[name] = yaml.parse(String(content));
	}

	resolve(locales);
	return;
});

const data = {
	bot: Object(bot).id ? bot : null,
	version: packageJSON.version,
	buildedTimestamp: Date.now(),
	i18n
}
export default {
	__json__: JSON.stringify(data)
}