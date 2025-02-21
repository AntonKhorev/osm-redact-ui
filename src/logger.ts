import { makeElement, makeLink } from "./html"

export default class Logger {
	private $list=makeElement('ul')()()
	$widget=makeElement('details')()(
		makeElement('summary')()(`Changeset fetch details`),
		this.$list
	)

	clear(): void {
		this.$list.replaceChildren()
	}

	appendGetRequest(url: string): void {
		this.$list.append(
			makeElement('li')()(
				makeElement('code')()(
					`GET `,makeLink(url,url)
				)
			)
		)
	}
}
