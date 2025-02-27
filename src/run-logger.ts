import { makeElement, makeLink } from "./html"

export default class RunLogger {
	private $list=makeElement('ul')()()
	private $summary=makeElement('summary')()()
	$widget=makeElement('details')('log')(
		this.$summary,
		this.$list
	)

	constructor(summary: string) {
		this.$summary.textContent=summary
	}

	clear(): void {
		this.$list.replaceChildren()
	}

	appendRequest(method: string, url: string): void {
		const $li=makeElement('li')()(
			makeElement('code')()(
				method,` `,
				(method=='GET'
					? makeLink(url,url)
					: url
				)
			)
		)
		this.$list.append($li)
	}

	appendOperation(text: string, url?: string): void {
		const $li=makeElement('li')()(text)
		if (url) $li.append(` `,
			makeElement('code')()(
				makeLink(url,url)
			)
		)
		this.$list.append($li)
	}
}
