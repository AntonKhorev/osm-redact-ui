import { getOsmChangesetIdFromString } from '../src/osm-changeset-data'

describe(`getOsmChangesetIdFromString`,()=>{
	const defaultServerUrls={
		webRoot: `https://www.example.com/`,
		apiRoot: `https://api.example.com/`
	}

	test(`fails on empty input`,()=>{
		expect(
			()=>getOsmChangesetIdFromString(
				defaultServerUrls,
				``
			)
		).toThrow(TypeError)
	})
	test(`parses :id`,()=>{
		expect(
			getOsmChangesetIdFromString(
				defaultServerUrls,
				`42`
			)
		).toBe(42)
	})
	test(`parses changeset/:id`,()=>{
		expect(
			getOsmChangesetIdFromString(
				defaultServerUrls,
				`changeset/43`
			)
		).toBe(43)
	})
	test(`parses changesets/:id`,()=>{
		expect(
			getOsmChangesetIdFromString(
				defaultServerUrls,
				`changesets/43`
			)
		).toBe(43)
	})
	test(`parses changeset=:id`,()=>{
		expect(
			getOsmChangesetIdFromString(
				defaultServerUrls,
				`changeset=44`
			)
		).toBe(44)
	})
	test(`fails on unknown origin in web url`,()=>{
		expect(
			()=>getOsmChangesetIdFromString(
				defaultServerUrls,
				`https://unknown.example.com/changeset/217`
			)
		).toThrow(TypeError)
	})
	test(`parses web url`,()=>{
		expect(
			getOsmChangesetIdFromString(
				defaultServerUrls,
				`https://www.example.com/changeset/217`
			)
		).toBe(217)
	})
	test(`parses web url with extra slashes`,()=>{
		expect(
			getOsmChangesetIdFromString(
				defaultServerUrls,
				`https://www.example.com////changeset//218//`
			)
		).toBe(218)
	})
	test(`parses web url`,()=>{
		expect(
			getOsmChangesetIdFromString(
				defaultServerUrls,
				`https://www.example.com/changeset/219#map=18/59.906201/30.283974`
			)
		).toBe(219)
	})
})
