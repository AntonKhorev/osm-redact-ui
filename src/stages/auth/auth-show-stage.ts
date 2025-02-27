import OsmAuthManager from '../../osm-auth-manager'
import { isOsmAuthDataWithSameToken } from '../../osm-auth-data'
import { makeElement, makeLink } from '../../html'
import { bubbleEvent } from '../../events'

export default class AuthShowStage {
	private readonly $noCurrentAuthorizationMessage=makeElement('p')()(`No current authorization`)
	private readonly $authTable=makeElement('table')()()

	private readonly $form=makeElement('form')()()
	readonly $section=makeElement('section')()(
		makeElement('h3')()(`Current server and authorization`),
		this.$form
	)

	constructor(
		private readonly osmAuthManager: OsmAuthManager
	) {
		this.$authTable.hidden=true

		document.body.addEventListener('osmRedactUi:newAuth',ev=>{
			const osmAuthData=ev.detail

			osmAuthManager.addData(osmAuthData)
			osmAuthManager.currentData=osmAuthData

			this.updateAuthTable()
			bubbleEvent(this.$section,'osmRedactUi:currentAuthUpdate')
		})
	}

	start() {
		this.$form.append(
			this.$noCurrentAuthorizationMessage,
			this.$authTable
		)

		this.updateAuthTable()
		bubbleEvent(this.$section,'osmRedactUi:currentAuthUpdate')
	}

	private updateAuthTable() {
		let isEmpty=true
		for (const osmAuthData of this.osmAuthManager.listData()) {
			if (isEmpty) this.$authTable.replaceChildren(
				makeElement('tr')()(
					makeElement('th')()(),
					makeElement('th')()(`server`),
					makeElement('th')()(`user`),
					makeElement('th')()(`mod?`)
				)
			)
			isEmpty=false

			const $radio=makeElement('input')()()
			$radio.type='radio'
			$radio.name='osm-auth'
			$radio.checked=Boolean(this.osmAuthManager.currentData && isOsmAuthDataWithSameToken(osmAuthData,this.osmAuthManager.currentData))
			$radio.onclick=()=>{
				this.osmAuthManager.currentData=osmAuthData

				bubbleEvent(this.$section,'osmRedactUi:currentAuthUpdate')
			}

			const $removeButton=makeElement('button')()(`Remove`)
			$removeButton.type='button'
			$removeButton.onclick=async()=>{
				try {
					if (osmAuthData.user && osmAuthData.user.clientId) {
						const url=`${osmAuthData.webRoot}oauth2/revoke`
						// this.runLogger.appendRequest('POST',url) // TODO
						await fetch(url,{
							// signal: abortSignal, // TODO
							method: 'POST',
							body: new URLSearchParams([
								['token',osmAuthData.user.token],
								['client_id',osmAuthData.user.clientId],
							])
						})
						// don't need to throw on error
						// TODO: log error
					}
				} catch (ex) {
					console.log(ex)
				}
				if (this.osmAuthManager.removeDataPossiblyRemovingCurrentData(osmAuthData)) {
					bubbleEvent(this.$section,'osmRedactUi:currentAuthUpdate')
				}
				this.updateAuthTable()
			}

			this.$authTable.append(
				makeElement('tr')()(
					makeElement('td')()(
						$radio
					),
					makeElement('td')()(
						makeLink(osmAuthData.webRoot,osmAuthData.webRoot)
					),
					makeElement('td')()(
						osmAuthData.user
							? makeLink(osmAuthData.user.name,`${osmAuthData.webRoot}user/${encodeURIComponent(osmAuthData.user.name)}`)
							: makeElement('em')()(`unauthorized`)
					),
					makeElement('td')()(
						osmAuthData.user?.isModerator ? `★` : ``
					),
					makeElement('td')()(
						$removeButton
					)
				)
			)
		}

		this.$noCurrentAuthorizationMessage.hidden=!isEmpty
		this.$authTable.hidden=isEmpty
	}
}
