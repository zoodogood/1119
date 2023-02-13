
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


const root = process.cwd();
import get from '#lib/child-process-utils.js';

const {run, info} = get({root, logger: true});


await info("Node version:");
await run("node", ["-v"]);

await info("Install modules:");
await run("npm.cmd", ["install"]);

await info("Check files:");
await run("node", ["./folder/scripts/checkFiles.js"]);

await info("Build bundle:");
await run("npm.cmd", ["run", "site-build"]);

await info("Success");
