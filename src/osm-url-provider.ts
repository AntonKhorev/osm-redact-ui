export default abstract class OsmUrlProvider {
	abstract getWidgets(): HTMLElement[]

	abstract get webRoot(): string
	abstract get apiRoot(): string
}
