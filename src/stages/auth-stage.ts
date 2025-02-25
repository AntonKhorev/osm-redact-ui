import ConnectionShowStage from './connection-show-stage'
import RunControl from '../run-control'
import RunLogger from '../run-logger'
import AuthFlowFactory from '../auth-flow-factory'
import { OsmConnection } from '../osm-connection'
import OsmApi from '../osm-api'
import { makeElement, makeDiv, makeLabel } from '../html'
import { isObject, isArrayOfStrings } from '../types'

export default abstract class AuthStage {
	protected authFlowFactory=new AuthFlowFactory
	
	protected runControl=new RunControl(
		`Authorize`,
		`Abort authorization`
	)
	protected runLogger=new RunLogger(`Authorization log`)

	private osmRoots: {
		$osmWebRootInput: HTMLInputElement
		$osmApiRootInput: HTMLInputElement
	} | {
		osmWebRoot: string
		osmApiRoot: string
	}

	protected $form=makeElement('form')()()

	$section=makeElement('section')()()

	constructor(osmRoots?: {osmWebRoot: string, osmApiRoot: string}) {
		if (osmRoots) {
			this.osmRoots=osmRoots
		} else {
			const $osmWebRootInput=makeElement('input')()()
			$osmWebRootInput.name='osm-web-root'
			$osmWebRootInput.required=true
			const $osmApiRootInput=makeElement('input')()()
			$osmApiRootInput.name='osm-api-root'
			this.osmRoots={
				$osmWebRootInput, $osmApiRootInput
			}
		}
	}

	protected get osmWebRoot(): string {
		if ('osmWebRoot' in this.osmRoots) {
			return this.osmRoots.osmWebRoot
		} else {
			return this.osmRoots.$osmWebRootInput.value.trim()
		}
	}

	protected get osmApiRoot(): string {
		if ('osmApiRoot' in this.osmRoots) {
			return this.osmRoots.osmApiRoot
		} else {
			const ownValue=this.osmRoots.$osmApiRootInput.value.trim()
			return ownValue || this.osmWebRoot
		}
	}

	render() {
		if (
			'$osmWebRootInput' in this.osmRoots &&
			'$osmApiRootInput' in this.osmRoots
		) {
			this.$form.append(
				makeDiv('input-group')(
					makeLabel()(
						`OSM web URL`, this.osmRoots.$osmWebRootInput
					)
				),
				makeDiv('input-group')(
					makeLabel()(
						`OSM API URL (if different from web URL)`, this.osmRoots.$osmApiRootInput
					)
				)
			)
		}
		this.$form.append(
			...this.renderPreRunControlWidgets(),
			this.runControl.$widget,
		)

		this.$section.append(
			this.renderHeading(),
			this.$form,
			this.runLogger.$widget,
			...this.renderPostRunControlWidgets()
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
			webRoot: this.osmWebRoot,
			apiRoot: this.osmApiRoot,
		}
		if (token) {
			const osmApi=new OsmApi(osmConnection.apiRoot,token,this.runLogger,abortSignal)
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
