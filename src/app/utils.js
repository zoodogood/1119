import Path from 'path';
const root = process.cwd();

async function ReadPackageJson(){
	const {default: FileSystem} = await import("fs/promises");
	const value = await FileSystem.readFile("package.json");
	
	return JSON.parse(value);
}


function takePath(...relativePath){
	return Path.resolve(root, ...relativePath);
}

 export {
	takePath,
	ReadPackageJson
};