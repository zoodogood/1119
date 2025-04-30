import config from '#config'

export function getAddress( server ) {
	return config.server.origin

	const protocol = config.server.hasSSLCertificate ? 'https' : 'http'
	const { address , port } = server.address()
	return `${ protocol }://${ address.startsWith( '::' ) ? 'localhost' : address }:${ port }/`
}
