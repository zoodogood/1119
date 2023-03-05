import net from 'net';
import { CustomCollector } from '@zoodogood/utils/objectives';
import config from '#config';

function checkPort(port) {
	const server = net.createServer();
	 server.listen(port);

	 return new Promise((resolve, reject) => {

		const errorCollector = new CustomCollector({target: server, event: "error"});
		const listeningCollector = new CustomCollector({target: server, event: "listening"});

		errorCollector.setCallback((error) => {
			errorCollector.end();
			listeningCollector.end();
			server.close();
			error.code === "EADDRINUSE" ? resolve(false) : reject(error);
		});

		listeningCollector.setCallback(() => {
			errorCollector.end();
			listeningCollector.end();
			server.close();
			resolve(true);
		})
	 })
}

function getAddress(server){
	return config.server.origin;

	const protocol = config.server.hasSSLCertificate ? "https" : "http";
	const { address, port } = server.address();
	return `${ protocol }://${ address.startsWith("::") ? "localhost" : address }:${ port }/`;
}

export {
	checkPort,
	getAddress
}