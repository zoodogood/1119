import config from '#config'

export function resolveGithubPath( relative , lineOfCode ) {
	const GITHUB_REPO = config.enviroment.github
	const BRANCH = config.enviroment.branch
	const BASE = `${ GITHUB_REPO }/blob/${ BRANCH }`
	return `${ BASE }/${ relative }${ lineOfCode ? `#L${ lineOfCode }` : '' }`
}
