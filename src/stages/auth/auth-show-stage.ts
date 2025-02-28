import RunControl from '../../run-control'
import OsmAuthManager from '../../osm-auth-manager'
import { isOsmAuthDataWithSameToken, convertOsmUserDetailsJsonToOsmAuthUserData } from '../../osm-auth-data'
import OsmApi from '../../osm-api'
import { makeElement, makeLink } from '../../html'
import { bubbleEvent } from '../../events'

export default class AuthShowStage {
	private readonly runControl=new RunControl

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
			this.$authTable,
			this.runControl.$widget
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

			const $updateButton=makeElement('button')()(`Update`)
			$updateButton.type='button'
			$updateButton.disabled=!osmAuthData.user
			$updateButton.onclick=async()=>{
				const abortSignal=this.runControl.enter($updateButton)
				try {
					if (osmAuthData.user) {
						const osmApi=new OsmApi(osmAuthData.apiRoot,osmAuthData.user.token,this.runControl.logger,abortSignal)
						const response=await osmApi.get(`user/details.json`)
						if (!response.ok) throw new TypeError(`failed to fetch user details`)
						const json=await response.json()
						const {clientId,token}=osmAuthData.user
						osmAuthData.user=convertOsmUserDetailsJsonToOsmAuthUserData(json,{clientId,token})
						if (this.osmAuthManager.updateDataPossiblyUpdatingCurrentData(osmAuthData)) {
							bubbleEvent(this.$section,'osmRedactUi:currentAuthUpdate')
						}
					}
				} catch (ex) {
					console.log(ex)
				}
				this.runControl.exit()
				this.updateAuthTable()
			}

			const $removeButton=makeElement('button')()(`Remove`)
			$removeButton.type='button'
			$removeButton.onclick=async()=>{
				const abortSignal=this.runControl.enter($removeButton)
				try {
					if (osmAuthData.user && osmAuthData.user.clientId) {
						const url=`${osmAuthData.webRoot}oauth2/revoke`
						this.runControl.logger.appendRequest('POST',url)
						await fetch(url,{
							signal: abortSignal,
							method: 'POST',
							body: new URLSearchParams([
								['token',osmAuthData.user.token],
								['client_id',osmAuthData.user.clientId],
							])
						})
						// don't need to throw on error
						// TODO: log error
					}
					if (this.osmAuthManager.removeDataPossiblyRemovingCurrentData(osmAuthData)) {
						bubbleEvent(this.$section,'osmRedactUi:currentAuthUpdate')
					}
				} catch (ex) {
					console.log(ex)
				}
				this.runControl.exit()
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
						$updateButton
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
