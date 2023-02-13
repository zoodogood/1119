
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




const root = process.cwd();
import get from '#lib/child-process-utils.js';

const {run, info, _npm} = get({root, logger: true});
const node = "node";



await info("Node version:");
await run(node, ["-v"]);

await info("Install modules:");
await run(_npm, ["install"]);

await info("Check files:");
await run(node, ["./folder/scripts/checkFiles.js"]);

await info("Build bundle:");
await run(_npm, ["run", "site-build"]);

await info("Success");
