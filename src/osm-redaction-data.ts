import { OsmServerUrls, extractWebPath } from './osm-server-urls'
import { toPositiveInteger } from './types'

export function getOsmRedactionIdFromString(serverUrls: OsmServerUrls, input: string): number {
	const extractData=(regExp: RegExp, s: string)=>{
		const match=s.match(regExp)
		if (!match) throw new TypeError(`Received invalid redaction reference`)
		const [,idString]=match
		const id=toPositiveInteger(idString)
		return id
	}

	try {
		return extractData(
			new RegExp(`^redactions/(\\d+)$`),
			extractWebPath(serverUrls,input)
		)
	} catch {}

	return extractData(
		new RegExp(`^(?:redactions?[/=])?(\\d+)$`),
		input
	)
}
