import { makeElement, makeDiv, makeLabel, makeLink } from './html'

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
					console.log($element.localName,$element.id,$element.getAttribute('version'))
				}
				$downloadedChangesCountOutput.value=String(downloadedChangesCount)
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
