import { getOsmRedactionIdFromString } from '../src/osm-redaction-data'

describe(`getOsmRedactionIdFromString`,()=>{
	const defaultServerUrls={
		webRoot: `https://www.example.com/`,
		apiRoot: `https://api.example.com/`
	}

	test(`fails on empty input`,()=>{
		expect(
			()=>getOsmRedactionIdFromString(
				defaultServerUrls,
				``
			)
		).toThrow(TypeError)
	})
	test(`parses :id`,()=>{
		expect(
			getOsmRedactionIdFromString(
				defaultServerUrls,
				`42`
			)
		).toBe(42)
	})
	test(`parses redaction/:id`,()=>{
		expect(
			getOsmRedactionIdFromString(
				defaultServerUrls,
				`redaction/43`
			)
		).toBe(43)
	})
	test(`parses redactions/:id`,()=>{
		expect(
			getOsmRedactionIdFromString(
				defaultServerUrls,
				`redactions/43`
			)
		).toBe(43)
	})
	test(`parses redaction=:id`,()=>{
		expect(
			getOsmRedactionIdFromString(
				defaultServerUrls,
				`redaction=44`
			)
		).toBe(44)
	})
	test(`fails on unknown origin in web url`,()=>{
		expect(
			()=>getOsmRedactionIdFromString(
				defaultServerUrls,
				`https://unknown.example.com/redactions/5`
			)
		).toThrow(TypeError)
	})
	test(`parses web url`,()=>{
		expect(
			getOsmRedactionIdFromString(
				defaultServerUrls,
				`https://www.example.com/redactions/5`
			)
		).toBe(5)
	})
	test(`parses web url with extra slashes`,()=>{
		expect(
			getOsmRedactionIdFromString(
				defaultServerUrls,
				`https://www.example.com/////redactions///5/////`
			)
		).toBe(5)
	})
})
