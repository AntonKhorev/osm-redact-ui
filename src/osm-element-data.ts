import { toPositiveInteger } from './types'

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

const osmElementVersionRegExp=new RegExp(`^(node|way|relation)/(\\d+)/(?:history/)?(\\d+)$`)

export function getOsmElementVersionDataFromString(s: string): OsmElementVersionData {
	const match=s.match(osmElementVersionRegExp)
	if (!match) throw new TypeError(`Received invalid element reference`)

	const [,type,idString,versionString]=match
	if (!isOsmElementType(type)) throw new TypeError(`Received invalid element type`)
	const id=toPositiveInteger(idString)
	const version=toPositiveInteger(versionString)
	return {type,id,version}
}
