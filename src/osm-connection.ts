export type OsmConnection = {
	webRoot: string
	apiRoot: string
	user?: {
		token: string
		name: string
		isModerator: boolean
	}
}
