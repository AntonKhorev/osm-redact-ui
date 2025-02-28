import AuthNewStage from './auth-new-stage'
import OsmUrlProvider from './osm-url-provider'

export default class AuthNewAnonymousStage extends AuthNewStage {
	constructor(
		title: string, type: string,
		osmUrlProvider: OsmUrlProvider
	) {
		super(title,type,osmUrlProvider)

		this.$form.onsubmit=async(ev)=>{
			ev.preventDefault()
			const abortSignal=this.runControl.enter(this.$runButton)
			try {
				await this.passToken(abortSignal)
			} catch (ex) {
				this.runControl.handleException(ex)
			}
			this.runControl.exit()
		}
	}
}
