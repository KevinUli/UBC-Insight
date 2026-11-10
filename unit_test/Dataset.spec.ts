import { expect } from "chai";
import { Section } from "../src/controller/Section";
import { Dataset } from "../src/controller/Dataset";
import { InsightDatasetKind } from "../src/controller/IInsightFacade";
import { Validation } from "../src/controller/Validation";
import InsightFacade from "../src/controller/InsightFacade";
import { clearDisk } from "../test/TestUtil";

describe("Dataset Class", function () {
	let section: Section, dataset: Dataset, facade: InsightFacade;
	const year = 2008;
	const avg = 82.65;
	const pass = 31;

	beforeEach(function () {
		facade = new InsightFacade();
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
		dataset = new Dataset("14075", InsightDatasetKind.Sections, 1, [section]);
	});

	afterEach(async function () {
		await clearDisk();
	});

	it("toString should format correctly", function () {
		const expectedString =
			`{section:[` +
			`{"uuid":"123e4567-e89b-12d3-a456-426614174000",` +
			`"id":"14075",` +
			`"title":"Darwin Medicine",` +
			`"instructor":"Dr. Jane Smith",` +
			`"dept":"ISCI",` +
			`"year":2008,` +
			`"avg":82.65,` +
			`"pass":31,` +
			`"fail":0,` +
			`"audit":0}` +
			`]}`;
		expect(dataset.toString()).to.equal(expectedString);
	});

	it("test write to disk", async function () {
		try {
			await dataset.writeToDiskSection();
			const bool = await Validation.savedDataset("14075");
			const bool2 = await Validation.savedDataset("14076");
			expect(bool).to.equal(true);
			expect(bool2).to.equal(false);
		} catch {
			expect.fail();
		}
		const list = await facade.listDatasets();
		expect(list).to.deep.equal([{ id: "14075", kind: InsightDatasetKind.Sections, numRows: 1 }]);
	});
});
