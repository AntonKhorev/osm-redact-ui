import AuthStage from './auth-stage'
import { makeElement, makeDiv, makeLabel } from '../html'

export default class AuthTypeSelectStage {
	private $authTypeSelect=makeElement('select')()()
	protected $form=makeElement('form')()()

	$section=makeElement('section')()(
		makeElement('h2')()(`Select authorization type`)
	)

	constructor(
		authStageSpecs: [text: string, value: string, stage: AuthStage][]
	) {
		this.$authTypeSelect.append(
			...authStageSpecs.map(([text,value])=>new Option(text,value))
		)

		const updateAuthStagesVisibility=()=>{
			for (const [text,value,stage] of authStageSpecs) {
				stage.$section.hidden=this.$authTypeSelect.value!=value
			}
		}
		updateAuthStagesVisibility()
		this.$authTypeSelect.oninput=updateAuthStagesVisibility
	}

	render() {
		this.$form.append(
			makeDiv('input-group')(
				makeLabel()(
					`Authorization type `, this.$authTypeSelect
				)
			)
		)

		this.$section.append(this.$form)
	}
}
