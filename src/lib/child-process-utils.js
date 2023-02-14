import { spawn } from 'child_process';
import EventsEmitter from 'events';
import { bold } from 'console-log-colors';

export default (({root, logger = false}) => {

	// Solve problem: https://stackoverflow.com/questions/43230346/error-spawn-npm-enoent
	const _npm = process.platform === "win32" ? "npm.cmd" : "npm";

	const EventsCallbacks = [
		{
			key: "stdoutError",
			callback({exit}, error){
				logger && info(`Error: ${ error.message }`);
				exit.reject(error);
			}
		},
		
		{
			
			key: "stderrError",
			callback({exit}, error){
				logger && info(`Error: ${ error.message }`);
				exit.reject(error);
			}
		},

		{
			key: "stdoutData",
			callback({promise}, data){
				const content = String(data);
				promise.emmiter.emit("data", content);
				promise.outsring = promise.outsring.concat(content);
				logger && console.info( content );
			}
		},

		{
			key: "stderrData",
			callback({promise}, data){
				const content = String(data);
				promise.emmiter.emit("data", content);
				promise.outsring = promise.outsring.concat(content);
				logger && console.info( content );
			}
		},


		{
			key: "message",
			callback(_context, data){
				logger && console.info( data.toString() );
			}
		},
		{
			key: "exit",
			callback({exit, promise}){
				exit.resolve(promise.outsring);
			}
		},
		{
			key: "error",
			callback({exit}, error){
				logger && info(`Error: ${ error.message }`);
				exit.reject(error);
			}
		}
		
	]
	
	const info = async (string) => console.info( bold(string) );

	const run = async (command, params) => {
		const child = spawn(command, params, {cwd: root});
		const exit = {resolve: null, reject: null};

		const promise = new Promise(
			(resolve, reject) => Object.assign(exit, {resolve, reject})
		);
		promise.emmiter = new EventsEmitter();
		promise.outsring = "";

		const events = Object.fromEntries(
			EventsCallbacks.map(({callback, key}) => [key, callback.bind(null, {exit, promise, child})])
		);


		(() => {
			child.stdout.on("error",  events.stdoutError);
			child.stderr.on("error",  events.stderrError);
			child.stdout.on("data",   events.stdoutData);
			child.stderr.on("data",   events.stderrData);
			child.on("error", 		  events.error);
			child.on("message", 		  events.message);
			child.on("exit", 			  events.exit);
		})();
		

		promise.finally(() => {
			child.stdout.removeListener("error",  events.stdoutError);
			child.stderr.removeListener("error",  events.stderrError);
			child.stdout.removeListener("data",   events.stdoutData);
			child.stderr.removeListener("data",   events.stderrData);
			child.removeListener("error", 		  events.error);
			child.removeListener("message", 		  events.message);
			child.removeListener("exit", 			  events.exit);
		});

		
		return promise;
	}

	return {run, info, _npm};
});