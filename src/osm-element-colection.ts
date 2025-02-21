export type OsmElementType = 'node'|'way'|'relation'

export function isOsmElementType(t: unknown): t is OsmElementType {
	if (typeof t != 'string') return false
	return t=='node' || t=='way' || t=='relation'
}

export class OsmElementLowerVersionCollection {
	nodes=new Map<number,number>
	ways=new Map<number,number>
	relations=new Map<number,number>

	add(type: OsmElementType, id: number, version: number) {
		let typeMap: Map<number,number>
		if (type=='node') {
			typeMap=this.nodes
		} else if (type=='way') {
			typeMap=this.ways
		} else if (type=='relation') {
			typeMap=this.relations
		} else {
			throw new TypeError(`tried to add invalid element type`)
		}
		const existingVersion=typeMap.get(id)
		if (existingVersion==null || version<existingVersion) {
			typeMap.set(id,version)
		}
	}

	*listElementTypesIdsAndVersionsBefore(that: OsmElementLowerVersionCollection): Generator<[OsmElementType,number,number]> {
		const typesAndMaps: [OsmElementType,Map<number,number>,Map<number,number>][] = [
			['node', this.nodes, that.nodes],
			['way', this.ways, that.ways],
			['relation', this.relations, that.relations],
		]
		for (const [type,thisTypeMap,thatTypeMap] of typesAndMaps) {
			const ids=[...thatTypeMap.keys()]
			ids.sort((a,b)=>a-b)
			for (const id of ids) {
				const fromVersion=thisTypeMap.get(id)
				const toVersion=thatTypeMap.get(id)
				if (fromVersion==null || toVersion==null) continue
				for (let version=fromVersion;version<toVersion;version++) {
					yield [type,id,version]
				}
			}
		}
	}

	*listMultiFetchBatches(): Generator<string> {
		const maxQueryLength=1000
		const typesAndMaps: [string,Map<number,number>][] = [
			['nodes', this.nodes],
			['ways', this.ways],
			['relations', this.relations],
		]
		for (const [pluralType,typeMap] of typesAndMaps) {
			let query: string|undefined
			for (const id of typeMap.keys()) {
				if (query && query.length>maxQueryLength) {
					yield query
					query=undefined
				}
				if (query==null) {
					query=`${pluralType}.json?${pluralType}=`
				} else {
					query+=`,`
				}
				query+=String(id)
			}
			if (query!=null) yield query
		}
	}
}
