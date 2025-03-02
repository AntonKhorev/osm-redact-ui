export type OsmServerUrls = {
	webRoot: string
	apiRoot: string
}

export function extractWebPath(osmServerUrls: OsmServerUrls, input: string): string {
	const inputUrl=new URL(input)
	const webRootUrl=new URL(osmServerUrls.webRoot)
	if (
		inputUrl.origin==webRootUrl.origin &&
		inputUrl.pathname.startsWith(webRootUrl.pathname)
	) {
		return inputUrl.pathname.slice(webRootUrl.pathname.length)
	}
	throw new TypeError(`Was unable to extract web path`)
}
