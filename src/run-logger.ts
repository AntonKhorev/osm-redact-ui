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
		this.$list.append(
			makeElement('li')()(
				makeElement('code')()(
					method,` `,
					(method=='GET'
						? makeLink(url,url)
						: url
					)
				)
			)
		)
	}

	appendText(text: string): void {
		this.$list.append(
			makeElement('li')()(text)
		)
	}
}
