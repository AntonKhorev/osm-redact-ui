export default class PopupWindowOpener {
	open(url: string): Window {
		const width=600
		const height=600
		const popupWindow=open(url,'_blank',
			`width=${width},height=${height},left=${screen.width/2-width/2},top=${screen.height/2-height/2}`
		)
		if (!popupWindow) throw new TypeError(`failed to open popup window`)
		return popupWindow
	}
}
