import AuthStage from './auth-stage'
import ConnectionShowStage from './connection-show-stage'
import OsmUrlProvider from '../osm-url-provider'
import AbortManager from '../abort-manager'
import { makeElement } from '../html'

export default class AuthSkipStage extends AuthStage {
	constructor(osmUrlProvider: OsmUrlProvider, abortManager: AbortManager, connectionShowStage: ConnectionShowStage) {
		super(osmUrlProvider)

		abortManager.addRunControl(this.runControl)

		this.$form.onsubmit=async(ev)=>{
			ev.preventDefault()
			this.runLogger.clear()
			const abortSignal=abortManager.enterStage(this.runControl)
			try {
				const token=''
				await this.passToken(connectionShowStage,abortSignal,token)
			} catch (ex) {
				console.log(ex)
			}
			abortManager.exitStage()
		}
	}

	protected renderHeading(): HTMLHeadingElement {
		return makeElement('h2')()(`Skip authorization`)
	}
}
