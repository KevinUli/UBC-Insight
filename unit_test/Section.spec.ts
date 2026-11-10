import { expect } from "chai";
import { Section } from "../src/controller/Section";

describe("Section Class", function () {
	let section: Section;
	const year = 2008;
	const avg = 82.65;
	const pass = 31;

	beforeEach(function () {
		section = new Section(
			"123e4567-e89b-12d3-a456-426614174000", // uuid
			"14075", // id
			"Darwin Medicine", // title
			"Dr. Jane Smith", // instructor
			"ISCI", // dept
			year, // year
			avg, // avg
			pass, // pass
			0, // fail
			0 // audit
		);
	});

	it("toString should format correctly", function () {
		const expectedString =
			`{"uuid":"123e4567-e89b-12d3-a456-426614174000",` +
			`"id":"14075","title":"Darwin Medicine","instructor":"Dr. Jane Smith",` +
			`"dept":"ISCI","year":2008,"avg":82.65,"pass":31,"fail":0,"audit":0}`;
		expect(section.toString()).to.equal(expectedString);
	});
});
