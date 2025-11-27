type Url = `http${string}`
export interface Configuration {
	developers: string[],
		guild: {
				url: Url,
				logChannelId: string,
				ideaChannelId: string,
				patchlogChannelId: string,
				chatChannelId: string,
		},
		development: boolean,

		enviroment: {
				github: Url,
				branch: string,
		},

		server: {
				isAvailable: true,
				source: string,
				origin: Url,
				hostname: string,
				port: number,
				tls: boolean,
				paths: {
						public: string,
						site: string,
				},
		},
		site: {
				source: string,
				label: string,
		},
		i18n: {
				availableLanguages: string[],
		},
		giscus: {
				repository: `${string}/${string}`,
				repoId: string,
				categoryName: string,
				categoryId: string,
				/* https://giscus.app/ */
		},
		pm2: {
				id?: string,
		},
		database: {
			driver?: "localdb"
		},
		ai_payloads: {
			model: string,
			endpoint: Url,
			env_of_secret: string
		}[]
}