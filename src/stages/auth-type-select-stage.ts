import AuthStage from './auth-stage'
import { makeElement, makeDiv, makeLabel } from '../html'

export default class AuthTypeSelectStage {
	private $authTypeSelect=makeElement('select')()()
	protected $form=makeElement('form')()()

	$section=makeElement('section')()(
		makeElement('h2')()(`Select authorization type`)
	)

	constructor(
		authStages: AuthStage[]
	) {
		this.$authTypeSelect.append(
			...authStages.map(stage=>new Option(stage.title,stage.type))
		)

		const updateAuthStagesVisibility=()=>{
			for (const stage of authStages) {
				stage.$section.hidden=this.$authTypeSelect.value!=stage.type
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
