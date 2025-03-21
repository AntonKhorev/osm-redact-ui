import { OsmServerUrls, extractWebPath } from './osm-server-urls'
import { isObject, toPositiveInteger } from './types'

export type OsmElementType = 'node'|'way'|'relation'

export function isOsmElementType(t: unknown): t is OsmElementType {
	if (typeof t != 'string') return false
	return t=='node' || t=='way' || t=='relation'
}

export type OsmElementVersionData = {
	type: OsmElementType
	id: number
	version: number
}

export function isOsmElementVersionData(json: unknown): json is OsmElementVersionData {
	return (
		isObject(json) &&
		'type' in json && isOsmElementType(json.type) &&
		'id' in json && typeof json.id == 'number' &&
		'version' in json && typeof json.version == 'number'
	)
}

export function getOsmElementVersionDataFromString(serverUrls: OsmServerUrls, input: string): OsmElementVersionData {
	const extractData=(regExp: RegExp, s: string)=>{
		const match=s.match(regExp)
		if (!match) throw new TypeError(`Received invalid element reference`)
		let [,type,idString,versionString]=match
		if (type=='n') {
			type='node'
		} else if (type=='w') {
			type='way'
		} else if (type=='r') {
			type='relation'
		}
		if (!isOsmElementType(type)) {
			throw new TypeError(`Received invalid element type`)
		}
		const id=toPositiveInteger(idString)
		const version=toPositiveInteger(versionString)
		return {type,id,version}
	}

	try {
		return extractData(
			new RegExp(`^/*(node|way|relation)s?/+(\\d+)/+(?:history/*)?(\\d+)/*$`),
			extractWebPath(serverUrls,input)
		)
	} catch {}

	return extractData(
		new RegExp(`^([nwr]|node|way|relation)s?/?(\\d+)(?:/|/history/|v)?(\\d+)$`),
		input
	)
}

export function getOsmElementVersionDataFromDomElement($element: Element): OsmElementVersionData {
	const type=$element.localName
	if (!isOsmElementType(type)) throw new TypeError(`Encountered invalid element type`)
	const id=toPositiveInteger($element.id)
	const version=toPositiveInteger($element.getAttribute('version'))
	return {type,id,version}
}
