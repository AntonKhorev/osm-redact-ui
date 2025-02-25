import ConnectionShowStage from './connection-show-stage'
import RunControl from './run-control'
import AuthFlowFactory from './auth-flow-factory'
import { OsmConnection } from './osm-connection'
import OsmApi from './osm-api'
import { makeElement, makeDiv, makeLabel } from './html'
import { isObject, isArrayOfStrings } from './types'

export default abstract class AuthStage {
	protected authFlowFactory=new AuthFlowFactory
	
	protected runControl=new RunControl(
		`Authorize`,
		`Abort authorization`,
		`Authorization log`
	)

	protected $osmWebRootInput=makeElement('input')()()
	protected $osmApiRootInput=makeElement('input')()()
	protected $form=makeElement('form')()()

	$section=makeElement('section')()()

	constructor() {
		this.$osmApiRootInput.name='osm-api-root'
		this.$osmApiRootInput.required=true
		this.$osmApiRootInput.value=`http://127.0.0.1:3000/`

		this.$osmWebRootInput.name='osm-web-root'
		this.$osmWebRootInput.required=true
		this.$osmWebRootInput.value=`http://127.0.0.1:3000/`
	}

	render() {
		this.$form.append(
			makeDiv('input-group')(
				makeLabel()(
					`OSM web url`, this.$osmWebRootInput
				)
			),
			makeDiv('input-group')(
				makeLabel()(
					`OSM API url`, this.$osmApiRootInput
				)
			),
			...this.renderPreRunControlWidgets(),
			this.runControl.$widget,
			...this.renderPostRunControlWidgets() // TODO: remove from form
		)

		this.$section.append(
			this.renderHeading(),
			this.$form
		)
	}

	protected abstract renderHeading(): HTMLHeadingElement

	protected renderPreRunControlWidgets(): HTMLElement[] {
		return []
	}

	protected renderPostRunControlWidgets(): HTMLElement[] {
		return []
	}

	protected async passToken(connectionShowStage: ConnectionShowStage, abortSignal: AbortSignal, token: string): Promise<void> {
		const osmConnection: OsmConnection = {
			webRoot: this.$osmWebRootInput.value.trim(),
			apiRoot: this.$osmApiRootInput.value.trim(),
		}
		if (token) {
			const osmApi=new OsmApi(osmConnection.apiRoot,token,this.runControl.logger,abortSignal)
			const response=await osmApi.get(`user/details.json`)
			if (!response.ok) throw new TypeError(`failed to fetch user details`)
			const json=await response.json()
			osmConnection.user={
				token,
				name: getNameFromOsmUserDetailsJson(json),
				isModerator: getIsModeratorFromOsmUserDetailsJson(json)
			}
		}
		connectionShowStage.setReadyState(osmConnection)
	}
}

function getNameFromOsmUserDetailsJson(json: unknown): string {
	if (
		isObject(json) && 'user' in json &&
		isObject(json.user) && `display_name` in json.user &&
		typeof json.user.display_name == 'string'
	) {
		return json.user.display_name
	}
	throw new TypeError(`received invalid user details`)
}

function getIsModeratorFromOsmUserDetailsJson(json: unknown): boolean {
	if (
		isObject(json) && 'user' in json && isObject(json.user)
	) {
		if (
			'roles' in json.user && isArrayOfStrings(json.user.roles)
		) {
			return json.user.roles.includes('moderator')
		} else {
			return false
		}
	}
	throw new TypeError(`received invalid user details`)
}
