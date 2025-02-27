import AuthNewStage from './auth-new-stage'
import { makeElement, makeDiv, makeLabel } from '../../html'

export default class AuthTypeSelectStage {
	private $authTypeSelect=makeElement('select')()()
	protected $form=makeElement('form')()()

	$section=makeElement('section')()(
		makeElement('h3')()(`Authorization type`)
	)

	constructor(
		authStages: AuthNewStage[]
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

	start() {
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
