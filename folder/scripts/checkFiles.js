import { execSync } from 'child_process';
import FileSystem from 'fs/promises';
import Path from 'path';

const root = process.cwd();
const resolve = (path) => Path.resolve(root, path);

const FileExists = async (path) =>
	!!(await FileSystem.stat(resolve(path)).catch(err => null));

const Write = async (path, content) => 
	await FileSystem.writeFile(resolve(path), content);

const Paths = {
	env: 			 ".env",
	envExample:  ".env.example",
	main: 		 "folder/data/main.json",
	counter: 	 "folder/data/counters.json",
	time: 		 "folder/data/time.json",

	firstBuildDocs: "static/special/first-build.html"
}





!await FileExists(Paths.env) && await 
(async () => {
	execSync(`start "" "file://${ resolve(Paths.firstBuildDocs) }"`);
	const source = resolve(Paths.envExample);
	const target = resolve(Paths.env);
	await FileSystem.copyFile(source, target);
})();


!await FileExists(Paths.main) && await 
(async () => {
	const DEFAULT_DATA = {bot: {}, users: [], guilds: []};
	const content = JSON.stringify(DEFAULT_DATA);
	await Write(Paths.main, content);
	console.info(`CREATED: ${ Paths.main }`);
})();

!await FileExists(Paths.counter) && await 
(async () => {
	const DEFAULT_DATA = [];
	const content = JSON.stringify(DEFAULT_DATA);
	await Write(Paths.counter, content);
	console.info(`CREATED: ${ Paths.counter }`);
})();

!await FileExists(Paths.time) && await 
(async () => {
	const DEFAULT_DATA = {};
	const content = JSON.stringify(DEFAULT_DATA);
	await Write(Paths.time, content);
	console.info(`CREATED: ${ Paths.time }`);
})();


