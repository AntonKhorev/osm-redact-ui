import CurrentOsmAuthManager from '../current-osm-auth-manager'
import AuthStorage from '../auth-storage'
import OsmAuth from '../osm-auth'
import { isOsmAuthDataWithSameToken } from '../osm-auth-data'
import { makeElement, makeLink } from '../html'
import { bubbleEvent } from '../events'

export default class AuthShowStage {
	private readonly $noCurrentAuthorizationMessage=makeElement('p')()(`No current authorization`)
	private readonly $authTable=makeElement('table')()()

	private readonly $form=makeElement('form')()()
	readonly $section=makeElement('section')()(
		makeElement('h2')()(`Current server and authorization`),
		this.$form
	)

	constructor(currentOsmAuthManager: CurrentOsmAuthManager, osmAuthStorage: AuthStorage) {
		this.$authTable.hidden=true

		const updateAuthTable=()=>{
			let isEmpty=true
			for (const osmAuthData of osmAuthStorage.list()) {
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
				$radio.checked=Boolean(currentOsmAuthManager.data && isOsmAuthDataWithSameToken(osmAuthData,currentOsmAuthManager.data))
				$radio.onclick=()=>{
					currentOsmAuthManager.data=osmAuthData
					bubbleEvent(this.$section,'osmRedactUi:currentAuthUpdate')
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
						)
					)
				)
			}

			this.$noCurrentAuthorizationMessage.hidden=!isEmpty
			this.$authTable.hidden=isEmpty
		}
		updateAuthTable()

		document.body.addEventListener('osmRedactUi:newAuth',ev=>{
			const osmAuthData=ev.detail

			osmAuthStorage.add(osmAuthData)
			currentOsmAuthManager.data=osmAuthData

			updateAuthTable()
			bubbleEvent(this.$section,'osmRedactUi:currentAuthUpdate')
		})
	}

	render() {
		this.$form.append(
			this.$noCurrentAuthorizationMessage,
			this.$authTable
		)
	}
}
