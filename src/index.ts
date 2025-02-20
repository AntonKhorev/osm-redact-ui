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

	const $form=makeElement('form')()(
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
	
	let abortController: AbortController | null = null
	$form.onsubmit=async(ev)=>{
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

			{
				for (const query of startingVersions.listMultiFetchBatches()) {
					const url=`${$apiInput.value}api/0.6/${query}`
					appendGetRequestToFetchLog(url)
					abortController=new AbortController
					const response=await fetch(url,{signal: abortController.signal})
					if (!response.ok) throw new TypeError(`failed to fetch top element versions`)
					const json=await response.json()
					console.log(json)
				}
			}
		} catch (ex) {
			console.log(ex)
		} finally {
			$startButton.disabled=false
			abortController=null
		}
		// TODO: compare number of changes to downloaded
		// TODO: fetch top versions of elements
	}

	document.body.append(
		makeElement('h1')()(`Redact changeset`),
		makeElement('section')()(
			makeElement('h2')()(`Enter initial information`),
			$form
		),
		makeElement('section')()(
			makeElement('h2')()(`See initial fetch results`),
			$fetchDetails,
			makeDiv('output-group')(
				`Expected changes count: `,$expectedChangesCountOutput
			),
			makeDiv('output-group')(
				`Downloaded changes count: `,$downloadedChangesCountOutput
			)
		)
	)

	function clearResults(): void {
		$expectedChangesCountOutput.value=''
		$fetchLog.replaceChildren()
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

function isObject(value: unknown): value is object {
	return !!(value && typeof value == 'object')
}

function toPositiveInteger(s: unknown): number {
	if (typeof s != 'string') throw new TypeError(`received invalid number`)
	const n=parseInt(s,10)
	if (!(n>0)) throw new TypeError(`received invalid number`)
	return n
}
