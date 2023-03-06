import config from "#config";
import { getPackageJSON } from "#lib/safe-utils.js";
import Greenlock from "greenlock";

const LETS_ENCRYPT_SERVER_URL = "https://acme-v02.api.letsencrypt.org/directory"

function updateSSL(){
	const packageJSON = getPackageJSON();
	const greenlock = Greenlock.create({
		directoryUrl: "/folder/SSLSecret",
		maintainerEmail: "zoodogood@gmail.com",
		agreeTos: true,
		server: LETS_ENCRYPT_SERVER_URL,
		domains: [config.server.hostname],
		packageAgent: `${ packageJSON.name }/${ packageJSON.version }`,
		getCertificate(){

		},
		debug: true
	});

	console.log(greenlock);
}

updateSSL()

export { updateSSL };