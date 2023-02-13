async function ReadPackageJson(){
	const {default: FileSystem} = await import("fs/promises");
	const value = await FileSystem.readFile("package.json");
	
	return JSON.parse(value);
}

 export {
	ReadPackageJson
};