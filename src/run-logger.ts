import { makeElement, makeDiv, makeLink } from "./html"

class RunLoggerRequestEntry {
	constructor(
		private readonly $li: HTMLLIElement
	) {}

	appendStatus(response: Response): void {
		this.$li.append(
			makeElement('code')()(` → `),
			makeElement('code')()(`${response.status} ${response.statusText}`)
		)
	}
}

export default class RunLogger {
	private readonly $list=makeElement('ul')()()
	readonly $widget=makeElement('details')()(
		makeElement('summary')()(`Log`),
		makeDiv('log')(
			this.$list
		)
	)

	clear(): void {
		this.$list.replaceChildren()
	}

	appendRequest(method: string, url: string): RunLoggerRequestEntry {
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
		return new RunLoggerRequestEntry($li)
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
