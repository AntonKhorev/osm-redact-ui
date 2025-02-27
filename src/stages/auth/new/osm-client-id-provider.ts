export default abstract class OsmClientIdProvider {
	abstract getWidgets(): HTMLElement[]

	abstract get clientId(): string
}
