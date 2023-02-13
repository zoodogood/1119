:: Google it
@echo off

cd ../../

echo "Node version:"
call node -v || echo "ERROR: Need install Node.js" && exit /b


echo "Install modules:"
call npm install || echo "Unknow error" && exit /b


echo "Check files:"
call node ./folder/scripts/checkFiles.js || echo "Unknow error" && exit /b


echo "Build bundle:"
call rollup -c ./src/site/rollup.config.mjs || echo "Unknow error" && exit /b


echo "Success!"
