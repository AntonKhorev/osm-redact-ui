import AuthStage from './auth-stage'
import OsmUrlProvider from '../osm-url-provider'
import AbortManager from '../abort-manager'

export default class AuthAnonymousStage extends AuthStage {
	constructor(
		title: string, type: string,
		osmUrlProvider: OsmUrlProvider,
		abortManager: AbortManager
	) {
		super(title,type,osmUrlProvider)

		abortManager.addRunControl(this.runControl)

		this.$form.onsubmit=async(ev)=>{
			ev.preventDefault()
			this.runLogger.clear()
			const abortSignal=abortManager.enterStage(this.runControl)
			try {
				const token=''
				await this.passToken(abortSignal,token)
			} catch (ex) {
				console.log(ex)
			}
			abortManager.exitStage()
		}
	}
}
