import { OsmServerUrls, extractWebPath } from './osm-server-urls'
import { toPositiveInteger } from './types'

export default (name: string)=>(serverUrls: OsmServerUrls, input: string)=>{
	const extractData=(regExp: RegExp, s: string)=>{
		const match=s.match(regExp)
		if (!match) throw new TypeError(`Received invalid ${name} reference`)
		const [,idString]=match
		const id=toPositiveInteger(idString)
		return id
	}

	try {
		return extractData(
			new RegExp(`^/*${name}s?/+(\\d+)/*$`),
			extractWebPath(serverUrls,input)
		)
	} catch {}

	return extractData(
		new RegExp(`^(?:${name}s?[/=])?(\\d+)$`),
		input
	)
}
