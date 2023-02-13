
/** .bat */
// @echo off

// cd ../../

// echo "Node version:"
// call node -v || echo "ERROR: Need install Node.js" && exit /b


// echo "Install modules:"
// call npm install || echo "Unknow error" && exit /b


// echo "Check files:"
// call node ./folder/scripts/checkFiles.js || echo "Unknow error" && exit /b


// echo "Build bundle:"
// call rollup -c ./src/site/rollup.config.mjs || echo "Unknow error" && exit /b


// echo "Success!"

// process.on("uncaughtException", () => {
// 	console.log(123);
// })

import { spawn } from 'child_process';

const root = process.cwd();


const info = async (...params) => console.info(...params);

const run = async (command, params) => {
	const child = spawn(command, params, {cwd: root});
	const exit = {resolve: null, reject: null};

	child.on("error", (error) => {
		info(`Error: ${ error.message }`);
		exit.reject(error);
	})
	
	child.stdout.on('error', (error) => {
		info(`Error: ${ error.message }`);
		exit.reject(error);
	})

	child.stderr.on('error', (data) => {
		info(`Error: ${ error.message }`);
		exit.reject(error);
	})

	child.stderr.on('data', data => {
		console.info( data.toString() );
	})

	child.stdout.on('data', (data) => {
		console.info( data.toString() );
	});


	child.on("message", (data) => {
		console.info( data.toString() );
	});

	child.on("spawn", () => {
		info("Spawn!");
	});

	child.on("exit", () => {
		console.info("\n\n");
		exit.resolve();
	});

	return new Promise(
		(resolve, reject) => Object.assign(exit, {resolve, reject})
	);
}




await info("Node version:");
await run("node", ["-v"]);

await info("Install modules:");
await run("npm.cmd", ["install"]);

await info("Check files:");
await run("node", ["./folder/scripts/checkFiles.js"]);

await info("Build bundle:");
await run("npm.cmd", ["run", "site-build"]);

await info("Success");