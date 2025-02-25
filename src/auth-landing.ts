import { makeElement, makeLink } from './html'

interface AuthOpener {
	receiveOsmAuthCode(code:unknown):unknown
	receiveOsmAuthDenial(errorDescription:unknown):unknown
}
function isAuthOpener(o:any): o is AuthOpener {
	return (
		o && typeof o == 'object' &&
		typeof o.receiveOsmAuthCode == 'function' &&
		typeof o.receiveOsmAuthDenial == 'function'
	)
}

export default class AuthLanding {
	getCode(abortSignal: AbortSignal): Promise<string> {
		return new Promise((resolve,reject)=>{
			const authOpener:AuthOpener=(<any>window)
			authOpener.receiveOsmAuthCode=(code: unknown)=>{
				if (typeof code == 'string') {
					resolve(code)
				} else {
					reject(new TypeError(`received unexpected code parameter type from popup window`))
				}
			}
			authOpener.receiveOsmAuthDenial=(errorDescription: unknown)=>{
				reject(new TypeError(typeof errorDescription == 'string'
					? errorDescription
					: `Unknown authorization error`
				))
			}
			abortSignal.onabort=reject
		})
	}

	cleanupAfterGetCode(abortSignal: AbortSignal): void {
		delete (<any>window).receiveOsmAuthCode
		delete (<any>window).receiveOsmAuthDenial
		abortSignal.onabort=null
	}

	land(): boolean {
		const app=()=>makeElement('em')()(`osm-redact-ui`)
		const params=new URLSearchParams(location.search)
		const code=params.get('code')
		const error=params.get('error')
		const errorDescription=params.get('error_description')
		if (code==null && error==null) {
			return false
		}
		if (!isAuthOpener(window.opener)) {
			document.body.append(makeElement('p')()(
				`This is the location of authentication redirect for `,app(),`. `,
				`It is expected to be opened in a popup window when performing a login. `,
				`Instead it is opened outside of a popup and cannot function properly. `,
				`If you want to continue using `,app(),`, please open `,makeLink(`this link`,this.url),`.`
			))
		} else if (code!=null) {
			window.opener.receiveOsmAuthCode(code)
		} else if (error!=null) {
			window.opener.receiveOsmAuthDenial(errorDescription??error)
		}
		return true
	}

	get url(): string {
		return `${location.protocol}//${location.host}${location.pathname}`
	}
}
