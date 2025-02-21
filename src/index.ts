import { makeElement, makeDiv, makeLabel, makeLink } from './html'

type OsmElementType = 'node'|'way'|'relation'

function isOsmElementType(t: unknown): t is OsmElementType {
	if (typeof t != 'string') return false
	return t=='node' || t=='way' || t=='relation'
}

class OsmElementLowerVersionCollection {
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

main()

function main(): void {
	const $apiInput=makeElement('input')()()
	$apiInput.required=true
	$apiInput.value=`http://127.0.0.1:3000/`

	const $tokenInput=makeElement('input')()()
	// $tokenInput.required=true

	const $redactedChangesetInput=makeElement('input')()()
	$redactedChangesetInput.required=true

	const $startButton=makeElement('button')()(`Start`)

	const $changesetForm=makeElement('form')()(
		makeDiv('input-group')(
			makeLabel()(
				`OSM API url`, $apiInput
			)
		),
		makeDiv('input-group')(
			makeLabel()(
				`Auth token`, $tokenInput
			)
		),
		makeDiv('input-group')(
			makeLabel()(
				`Redacted changeset`, $redactedChangesetInput
			)
		),
		makeDiv('input-group')(
			$startButton
		)
	)

	const $fetchLog=makeElement('ul')()()
	const $fetchDetails=makeElement('details')()(
		makeElement('summary')()(`Changeset fetch details`),
		$fetchLog
	)
	const $expectedChangesCountOutput=makeElement('output')()()
	const $downloadedChangesCountOutput=makeElement('output')()()
	const $elementsToRedactTextarea=makeElement('textarea')()()
	$elementsToRedactTextarea.rows=10
	const $elementsForm=makeElement('form')()(
		makeDiv('output-group')(
			`Expected changes count: `,$expectedChangesCountOutput
		),
		makeDiv('output-group')(
			`Downloaded changes count: `,$downloadedChangesCountOutput
		),
		makeDiv('input-group')(
			makeLabel()(
				`Elements to redact`, $elementsToRedactTextarea
			)
		)
	)
	
	let abortController: AbortController | null = null
	$changesetForm.onsubmit=async(ev)=>{
		ev.preventDefault()
		clearResults()
		$startButton.disabled=true
		abortController?.abort()
		// TODO: token
		try {
			let expectedChangesCount: number
			{
				const url=`${$apiInput.value}api/0.6/changeset/${encodeURIComponent($redactedChangesetInput.value)}.json`
				appendGetRequestToFetchLog(url)
				abortController=new AbortController
				const response=await fetch(url,{signal: abortController.signal})
				if (!response.ok) throw new TypeError(`failed to fetch changeset metadata`)
				const json=await response.json()
				expectedChangesCount=getChangesCountFromChangesetMetadataResponseJson(json)
			}
			$expectedChangesCountOutput.value=String(expectedChangesCount)

			let downloadedChangesCount=0
			const startingVersions=new OsmElementLowerVersionCollection
			{
				const url=`${$apiInput.value}api/0.6/changeset/${encodeURIComponent($redactedChangesetInput.value)}/download?show_redactions=true`
				appendGetRequestToFetchLog(url)
				abortController=new AbortController
				const response=await fetch(url,{signal: abortController.signal})
				if (!response.ok) throw new TypeError(`failed to fetch changeset changes`)
				const text=await response.text()
				const doc=new DOMParser().parseFromString(text,`text/xml`)
				for (const $element of doc.querySelectorAll('node, way, relation')) {
					downloadedChangesCount++
					const type=$element.localName
					if (!isOsmElementType(type)) throw new TypeError(`encountered invalid element type`)
					const id=toPositiveInteger($element.id)
					const version=toPositiveInteger($element.getAttribute('version'))
					startingVersions.add(type,id,version)
				}
				$downloadedChangesCountOutput.value=String(downloadedChangesCount)
			}
			if (expectedChangesCount!=downloadedChangesCount) throw new TypeError(`got missing elements in changeset changes`)

			const topVersions=new OsmElementLowerVersionCollection
			{
				for (const query of startingVersions.listMultiFetchBatches()) {
					const url=`${$apiInput.value}api/0.6/${query}`
					appendGetRequestToFetchLog(url)
					abortController=new AbortController
					const response=await fetch(url,{signal: abortController.signal})
					if (!response.ok) throw new TypeError(`failed to fetch top element versions`)
					const json=await response.json()
					for (const [type,id,version] of listElementTypesIdsAndVersionsFromElementsResponseJson(json)) {
						topVersions.add(type,id,version)
					}
				}
			}
			for (const [type,id,version] of startingVersions.listElementTypesIdsAndVersionsBefore(topVersions)) {
				$elementsToRedactTextarea.value+=`${type}/${id}/${version}\n`
			}
		} catch (ex) {
			console.log(ex)
		} finally {
			$startButton.disabled=false
			abortController=null
		}
	}

	document.body.append(
		makeElement('h1')()(`Redact changeset`),
		makeElement('section')()(
			makeElement('h2')()(`Enter initial information`),
			$changesetForm
		),
		makeElement('section')()(
			makeElement('h2')()(`See initial fetch results`),
			$fetchDetails,
			$elementsForm
		)
	)

	function clearResults(): void {
		$fetchLog.replaceChildren()
		$expectedChangesCountOutput.value=''
		$downloadedChangesCountOutput.value=''
		$elementsToRedactTextarea.value=''
	}

	function appendGetRequestToFetchLog(url: string): void {
		$fetchLog.append(
			makeElement('li')()(
				makeElement('code')()(
					`GET `,makeLink(url,url)
				)
			)
		)
	}
}

function getChangesCountFromChangesetMetadataResponseJson(json: unknown): number {
	if (
		isObject(json) && 'changeset' in json &&
		isObject(json.changeset) && 'changes_count' in json.changeset &&
		typeof json.changeset.changes_count == 'number'
	) {
		return json.changeset.changes_count
	} else {
		throw new TypeError(`received invalid changeset metadata`)
	}
}

function *listElementTypesIdsAndVersionsFromElementsResponseJson(json: unknown): Generator<[OsmElementType,number,number]> {
	if (
		isObject(json) && 'elements' in json &&
		isArray(json.elements)
	) {
		for (const element of json.elements) {
			if (
				isObject(element) &&
				'type' in element && isOsmElementType(element.type) &&
				'id' in element && typeof element.id == 'number' &&
				'version' in element && typeof element.version == 'number'
			) {
				yield [element.type,element.id,element.version]
			} else {
				throw new TypeError(`received invalid element data`)
			}
		}
	} else {
		throw new TypeError(`received invalid elements data`)
	}
}

function isObject(value: unknown): value is object {
	return !!(value && typeof value == 'object')
}

function isArray(value: unknown): value is unknown[] {
	return Array.isArray(value)
}

function toPositiveInteger(s: unknown): number {
	if (typeof s != 'string') throw new TypeError(`received invalid number`)
	const n=parseInt(s,10)
	if (!(n>0)) throw new TypeError(`received invalid number`)
	return n
}
