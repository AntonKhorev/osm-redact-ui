import { makeElement, makeDiv, makeLabel, makeLink } from './html'

main()

function main() {
	const $apiInput=makeElement('input')()()
	$apiInput.required=true
	$apiInput.value=`http://127.0.0.1:3000/`

	const $tokenInput=makeElement('input')()()
	$tokenInput.required=true

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
	
	let abortController: AbortController | null = null
	$form.onsubmit=async(ev)=>{
		ev.preventDefault()
		$startButton.disabled=true
		abortController?.abort()
		abortController=new AbortController
		const url=`${$apiInput.value}api/0.6/changeset/${encodeURIComponent($redactedChangesetInput.value)}.json`
		$fetchLog.replaceChildren()
		$fetchLog.append(
			makeElement('li')()(
				`Fetching `,
				makeElement('code')()(url)
			)
		)
		// TODO token + show redacted
		try {
			const response=await fetch(url,{signal: abortController.signal})
			const data=await response.json()
			console.log(data)
		} finally {
			$startButton.disabled=false
			abortController=null
		}
	}

	document.body.append(
		makeElement('h1')()(`Redact changeset`),
		makeElement('section')()(
			makeElement('h2')()(`Enter initial information`),
			$form
		),
		makeElement('section')()(
			makeElement('h2')()(`See initial fetch results`),
			$fetchDetails
		)
	)
}
