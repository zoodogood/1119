
const { default: packageConfig } = await import("#src/package.json", {assert: {type: "json"}});

export default {
	developers: ["416701743733145612", "469879141873745921", "500293566187307008", "535402224373989396", "921403577539387454", "711450675938197565"],
	guild: {
		url: "https://discord.gg/76hCg2h7r8"
	},
	version: packageConfig.version
}