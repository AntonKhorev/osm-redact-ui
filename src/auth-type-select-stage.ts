import AuthSkipStage from './auth-skip-stage'
import AuthTokenStage from './auth-token-stage'
import AuthManualGrantStage from './auth-manual-grant-stage'
import AuthAutoGrantStage from './auth-auto-grant-stage'
import { makeElement, makeDiv, makeLabel } from './html'

export default class AuthTypeSelectStage {
	private $authTypeSelect=makeElement('select')()()
	protected $form=makeElement('form')()()

	$section=makeElement('section')()(
		makeElement('h2')()(`Select authorization type`)
	)

	constructor(
		authSkipStage: AuthSkipStage,
		authTokenStage: AuthTokenStage,
		authManualGrantStage: AuthManualGrantStage,
		authAutoGrantStage: AuthAutoGrantStage
	) {
		this.$authTypeSelect.append(
			new Option(`skipped`,'skip'),
			new Option(`by entering an existing token`,'token'),
			new Option(`by manually copying a code`,'code'),
			new Option(`automatic`,'auto')
		)

		const updateAuthStagesVisibility=()=>{
			authSkipStage.$section.hidden=this.$authTypeSelect.value!='skip'
			authTokenStage.$section.hidden=this.$authTypeSelect.value!='token'
			authManualGrantStage.$section.hidden=this.$authTypeSelect.value!='code'
			authAutoGrantStage.$section.hidden=this.$authTypeSelect.value!='auto'
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
