import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import { clearDisk, getContentFromArchives, loadTestQuery } from "../TestUtil";

import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import fs from "fs-extra";
import path from "path";

use(chaiAsPromised);

export interface ITestQuery {
	title?: string;
	input: unknown;
	errorExpected: boolean;
	expected: any;
}
//
describe("InsightFacade", function () {
	let facade: IInsightFacade;
	//
	// 	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;
	let sections2: string;
	let oneSection: string;
	let wrongFormat: string;
	let oneSectionWithInvalid: string;
	let missingField: string;
	let twoSections: string;
	let counterIntuitive: string;
	let noSectionsKey: string;
	let twoDeep: string;
	let courseAndCourses: string;
	let simple: string;
	let wrongStruct: string;
	let dataset1: string;
	let rooms: string;
	//
	before(async function () {
		// This block runs once and loads the datasets.
		sections = await getContentFromArchives("pair.zip");
		sections2 = await getContentFromArchives("use.zip"); //default test zip to use(faster loading)
		oneSection = await getContentFromArchives("one.zip"); //one row result test zip
		wrongFormat = await getContentFromArchives("wrongFormat.zip"); //wrong file format test zip
		oneSectionWithInvalid = await getContentFromArchives("oneWithInvalid.zip"); //one section with invalid sections
		missingField = await getContentFromArchives("missingField.zip"); //missing field test zip
		twoSections = await getContentFromArchives("twoSections.zip"); //two rows result test zip
		counterIntuitive = await getContentFromArchives("counter.zip"); //counter intuitive test zip
		noSectionsKey = await getContentFromArchives("noSectionsKey.zip"); //no sections key in json
		twoDeep = await getContentFromArchives("twoDeep.zip"); //courses files are two deep(invalid)//courses folder is named wrong
		courseAndCourses = await getContentFromArchives("courseAndCourses.zip"); //both course and courses folder
		simple = await getContentFromArchives("simple.zip"); //simplest dataset for logic tests
		wrongStruct = await getContentFromArchives("wrongStruct.zip"); //wrong struct test zip
		dataset1 = await getContentFromArchives("validDataset_larger.zip");
		rooms = await getContentFromArchives("campus.zip");

		// Just in case there is anything hanging around from a previous run of the test suite
		await clearDisk();
	});

	describe("AddDataset", function () {
		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		it("should reject add with an empty dataset id", async function () {
			try {
				await facade.addDataset("", sections2, InsightDatasetKind.Sections);
				expect.fail("Should have rejected.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject add with a sections zip passed into rooms", async function () {
			try {
				await facade.addDataset("ubc", sections2, InsightDatasetKind.Rooms);
				expect.fail("Should have rejected.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		// it("should reject add with duplicate dataset id", async function () {
		// 	try {
		// 		await facade.addDataset("ubc", sections2, InsightDatasetKind.Sections);
		// 		await facade.addDataset("ubc", sections2, InsightDatasetKind.Sections);
		// 		expect.fail("Should have rejected.");
		// 	} catch (err) {
		// 		expect(err).to.be.instanceOf(InsightError);
		// 	}
		// });

		it("should reject add with an underscore in dataset id", async function () {
			try {
				await facade.addDataset("u_bc", sections2, InsightDatasetKind.Sections);
				expect.fail("Should have rejected.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject add with only whitespaces in dataset id", async function () {
			try {
				await facade.addDataset("      ", sections2, InsightDatasetKind.Sections);
				expect.fail("Should have rejected.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject add with invalid content(non-base64 string)", async function () {
			const invalid = "invalid_content";
			try {
				await facade.addDataset("ubc", invalid, InsightDatasetKind.Sections);
				expect.fail("Should have rejected.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject add with invalid content(no valid sections)", async function () {
			const empty: string = await getContentFromArchives("empty.zip");
			try {
				await facade.addDataset("ubc", empty, InsightDatasetKind.Sections);
				expect.fail("Should have rejected.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject add with invalid json format(has courses folder)", async function () {
			try {
				await facade.addDataset("ubc", wrongFormat, InsightDatasetKind.Sections);
				expect.fail("Should have rejected.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject add with invalid dataset kind(for now)", async function () {
			try {
				await facade.addDataset("ubc", sections2, InsightDatasetKind.Rooms);
				expect.fail("Should have rejected.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject add with valid json but missing fields", async function () {
			try {
				await facade.addDataset("ubc", missingField, InsightDatasetKind.Sections);
				expect.fail("Should have rejected.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject add with everything else right but no sections key", async function () {
			try {
				await facade.addDataset("ubc", noSectionsKey, InsightDatasetKind.Sections);
				expect.fail("Should have rejected.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject add with invalid attempts in a row", async function () {
			try {
				await facade.addDataset("ubc", noSectionsKey, InsightDatasetKind.Sections);
				expect.fail("Should have rejected.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
			try {
				await facade.addDataset("u_bc", sections2, InsightDatasetKind.Sections);
				expect.fail("Should have rejected.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
			try {
				await facade.addDataset("ubc", wrongStruct, InsightDatasetKind.Sections);
				expect.fail("Should have rejected.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
			const ret = await facade.addDataset("ubc", sections2, InsightDatasetKind.Sections);
			expect(ret).to.deep.equal(["ubc"]);
		});

		it("should successfully add default case", async function () {
			const ret = await facade.addDataset("ubc", simple, InsightDatasetKind.Sections);
			expect(ret).to.deep.equal(["ubc"]);
		});

		it("should successfully add default case rooms", async function () {
			const ret = await facade.addDataset("ubc", rooms, InsightDatasetKind.Rooms);
			expect(ret).to.deep.equal(["ubc"]);
		});

		it("should add with courses folder two deep(not under root)?", async function () {
			const ret = await facade.addDataset("ubc", twoDeep, InsightDatasetKind.Sections);
			expect(ret).to.deep.equal(["ubc"]);
		});

		it("should successfully add with trailing and leading whitespace", async function () {
			const ret = await facade.addDataset("  ubc  ", sections2, InsightDatasetKind.Sections);
			expect(ret).to.deep.equal(["  ubc  "]);
		});

		it("should successfully add two in a row", async function () {
			await facade.addDataset("ubc", sections2, InsightDatasetKind.Sections);
			const ret = await facade.addDataset("ubc2", oneSection, InsightDatasetKind.Sections);
			expect(ret).to.deep.equal(["ubc", "ubc2"]);
		});

		it("should successfully add previously removed ones", async function () {
			await facade.addDataset("ubc", oneSection, InsightDatasetKind.Sections);
			await facade.addDataset("ubc2", sections2, InsightDatasetKind.Sections);
			await facade.removeDataset("ubc2");
			const ret = await facade.addDataset("ubc2", sections2, InsightDatasetKind.Sections);
			expect(ret).to.deep.equal(["ubc", "ubc2"]);
		});

		it("should successfully add only valid sections", async function () {
			const ret = await facade.addDataset("ubc", oneSectionWithInvalid, InsightDatasetKind.Sections);
			expect(ret).to.deep.equal(["ubc"]);
			const ret2 = await facade.listDatasets();
			expect(ret2).to.deep.equal([{ id: "ubc", kind: InsightDatasetKind.Sections, numRows: 1 }]);
		});

		// it("should successfully add same uppercase", async function () {
		// 	const ret = await facade.addDataset("ubc", oneSection, InsightDatasetKind.Sections);
		// 	expect(ret).to.deep.equal(["ubc"]);
		// 	const ret2 = await facade.addDataset("UBC", sections2, InsightDatasetKind.Sections);
		// 	expect(ret2).to.deep.equal(["ubc", "UBC"]);
		// });

		it("should successfully add two sections", async function () {
			const ret = await facade.addDataset("ubc", twoSections, InsightDatasetKind.Sections);
			expect(ret).to.deep.equal(["ubc"]);
		});

		it("should successfully add with one char id", async function () {
			const ret = await facade.addDataset("u", counterIntuitive, InsightDatasetKind.Sections);
			expect(ret).to.deep.equal(["u"]);
		});

		it("should successfully add with spec chars besides _", async function () {
			const ret = await facade.addDataset("u-b!", counterIntuitive, InsightDatasetKind.Sections);
			expect(ret).to.deep.equal(["u-b!"]);
		});

		it("should successfully add two in a row with differing white space", async function () {
			await facade.addDataset("ubc", counterIntuitive, InsightDatasetKind.Sections);
			const ret2 = await facade.addDataset("ubc ", counterIntuitive, InsightDatasetKind.Sections);
			expect(ret2).to.deep.equal(["ubc", "ubc "]);
		});

		it("should successfully add two in a row with differing kind", async function () {
			await facade.addDataset("ubc", counterIntuitive, InsightDatasetKind.Sections);
			const ret2 = await facade.addDataset("ubc2", rooms, InsightDatasetKind.Rooms);
			expect(ret2).to.deep.equal(["ubc", "ubc2"]);
		});

		it("should successfully add when original was rejected", async function () {
			try {
				await facade.addDataset("ubc", wrongStruct, InsightDatasetKind.Sections);
				expect.fail("Should have rejected.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
			const ret = await facade.addDataset("ubc", sections2, InsightDatasetKind.Sections);
			expect(ret).to.deep.equal(["ubc"]);
		});

		it("should successfully add only valid folder struct sections", async function () {
			const ret = await facade.addDataset("ubc", courseAndCourses, InsightDatasetKind.Sections);
			expect(ret).to.deep.equal(["ubc"]);
			const ret2 = await facade.listDatasets();
			expect(ret2).to.deep.equal([{ id: "ubc", kind: InsightDatasetKind.Sections, numRows: 1 }]);
		});

		it("should reject add with a whitespace-only dataset id", async function () {
			try {
				await facade.addDataset("   ", sections2, InsightDatasetKind.Sections);
				expect.fail("Should have rejected");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject add with a valid dataset id already added", async function () {
			try {
				await facade.addDataset("validid", sections2, InsightDatasetKind.Sections);
				await facade.addDataset("validid", sections2, InsightDatasetKind.Sections);
				expect.fail("Should have rejected");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject add with an invalid dataset with course not in JSON", async function () {
			try {
				const dataset: string = await getContentFromArchives("invalidDataset_notJSON.zip");
				await facade.addDataset("validid", dataset, InsightDatasetKind.Sections);
				expect.fail("Should have rejected");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should succeed add with smaller valid dataset", async function () {
			try {
				const dataset: string = await getContentFromArchives("validDataset.zip");
				const res = await facade.addDataset("valid-id", dataset, InsightDatasetKind.Sections);
				expect(res).to.have.same.members(["valid-id"]);
			} catch (err) {
				expect.fail("Should not have rejected with ", err);
			}
		});

		it("should reject add with invalid dataset given", async function () {
			try {
				await facade.addDataset("valid-id", "", InsightDatasetKind.Sections);
				expect.fail("Should have rejected");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject add with two datasets with same id", async function () {
			try {
				const res = await facade.addDataset("valid-id", sections2, InsightDatasetKind.Sections);
				expect(res).to.deep.equal(["valid-id"]);
				const dataset: string = await getContentFromArchives("validDataset.zip");

				await facade.addDataset("valid-id", dataset, InsightDatasetKind.Sections);
				expect.fail("Should have rejected");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should succeed add with two datasets with same dataset but different id", async function () {
			try {
				let res = await facade.addDataset("valid-id", simple, InsightDatasetKind.Sections);
				expect(res).to.deep.equal(["valid-id"]);

				res = await facade.addDataset("randomid", simple, InsightDatasetKind.Sections);
				expect(res).to.have.same.members(["valid-id", "randomid"]);
			} catch (err) {
				expect.fail("Should not have rejected with ", err);
			}
		});

		it("should reject add with course not in folder", async function () {
			try {
				const dataset: string = await getContentFromArchives("invalidDataset_courseNotInFolder.zip");

				await facade.addDataset("valid-id", dataset, InsightDatasetKind.Sections);
				expect.fail("Should have rejected");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject add with typo on courses folder", async function () {
			try {
				const dataset: string = await getContentFromArchives("invalidDataset_typoOnCourses.zip");

				await facade.addDataset("valid-id", dataset, InsightDatasetKind.Sections);
				expect.fail("Should have rejected");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject add with missing column", async function () {
			try {
				const dataset: string = await getContentFromArchives("invalidDataset_missingColumn.zip");

				await facade.addDataset("valid-id", dataset, InsightDatasetKind.Sections);
				expect.fail("Should have rejected");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
	});

	describe("RemoveDataset", function () {
		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		it("should reject remove with an empty dataset id", async function () {
			try {
				await facade.removeDataset("");
				expect.fail("Should have rejected.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject remove with an underscore in dataset id", async function () {
			try {
				await facade.removeDataset("u_bc");
				expect.fail("Should have rejected.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject remove with only whitespaces in dataset id", async function () {
			try {
				await facade.removeDataset("      ");
				expect.fail("Should have rejected.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject remove when dataset is not found", async function () {
			try {
				await facade.removeDataset("ubc");
				expect.fail("Should have rejected.");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		it("should successfully remove default case", async function () {
			await facade.addDataset("ubc", sections2, InsightDatasetKind.Sections);
			const ret = await facade.removeDataset("ubc");
			expect(ret).to.equal("ubc");
		});

		it("should successfully remove only specific one when multiple", async function () {
			await facade.addDataset("ubc", oneSection, InsightDatasetKind.Sections);
			await facade.addDataset("ubc2", sections2, InsightDatasetKind.Sections);
			const ret = await facade.removeDataset("ubc2");
			expect(ret).to.equal("ubc2");
		});

		it("should reject remove with an underscore dataset id", async function () {
			try {
				await facade.removeDataset("_");
				expect.fail("Should have rejected");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject remove with a dataset id that has not been added", async function () {
			try {
				await facade.removeDataset("validid");
				expect.fail("Should have rejected");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		it("should succeed remove with a dataset id that has been added", async function () {
			try {
				await facade.addDataset("validid", sections2, InsightDatasetKind.Sections);
				const res = await facade.removeDataset("validid");
				expect(res).to.equal("validid");
			} catch (err) {
				expect.fail("Should not have rejected with ", err);
			}
		});

		it("should reject remove with a dataset id that has been removed", async function () {
			try {
				await facade.addDataset("validid", sections2, InsightDatasetKind.Sections);
				await facade.removeDataset("validid");
				await facade.removeDataset("validid");
				expect.fail("Should have been rejected");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		it("should succeed remove with a dataset id that has been added but data folder directly removed", async function () {
			try {
				await facade.addDataset("validid", sections2, InsightDatasetKind.Sections);
				await clearDisk();
				const ret = await facade.removeDataset("validid");
				expect(ret).to.equal("validid");
			} catch (err) {
				expect.fail("Should not have rejected with" + err);
			}
		});

		it("should succeed remove with a dataset id that has whitespace in between", async function () {
			try {
				await facade.addDataset(" white space ", sections2, InsightDatasetKind.Sections);
				await clearDisk();
				const ret = await facade.removeDataset(" white space ");
				expect(ret).to.equal(" white space ");
			} catch (err) {
				expect.fail("Should not have rejected with" + err);
			}
		});

		it("should succeed remove with a dataset id that has been added with special characters", async function () {
			try {
				await facade.addDataset("spe@cial   !@%#&", sections2, InsightDatasetKind.Sections);
				await clearDisk();
				const ret = await facade.removeDataset("spe@cial   !@%#&");
				expect(ret).to.equal("spe@cial   !@%#&");
			} catch (err) {
				expect.fail("Should not have rejected with" + err);
			}
		});

		it("should succeed remove with a dataset id that has been added with tab", async function () {
			try {
				await facade.addDataset("spe@cial   \t   cha()ract*&ers !@%#&", sections2, InsightDatasetKind.Sections);
				await clearDisk();
				const ret = await facade.removeDataset("spe@cial   \t   cha()ract*&ers !@%#&");
				expect(ret).to.equal("spe@cial   \t   cha()ract*&ers !@%#&");
			} catch (err) {
				expect.fail("Should not have rejected with" + err);
			}
		});

		it("should succeed remove with a dataset id with a random backslash", async function () {
			try {
				await facade.addDataset('spe@cial   ) ? \\ "   cha()ract*&ers !@%#&', sections2, InsightDatasetKind.Sections);
				await clearDisk();
				const ret = await facade.removeDataset('spe@cial   ) ? \\ "   cha()ract*&ers !@%#&');
				expect(ret).to.equal('spe@cial   ) ? \\ "   cha()ract*&ers !@%#&');
			} catch (err) {
				expect.fail("Should not have rejected with" + err);
			}
		});

		it("should succeed remove with a dataset id that has been added with new line", async function () {
			try {
				await facade.addDataset("spe@cial   \n   cha()ract*&ers !@%#&", sections2, InsightDatasetKind.Sections);
				await clearDisk();
				const ret = await facade.removeDataset("spe@cial   \n   cha()ract*&ers !@%#&");
				expect(ret).to.equal("spe@cial   \n   cha()ract*&ers !@%#&");
			} catch (err) {
				expect.fail("Should not have rejected with" + err);
			}
		});

		it("should succeed remove with a dataset id that has been added by different instance of InsightFacade", async function () {
			try {
				await facade.addDataset("validid", sections2, InsightDatasetKind.Sections);
				const i1 = new InsightFacade();
				await facade.addDataset("randomid", sections2, InsightDatasetKind.Sections);
				const ret = await i1.removeDataset("validid");
				expect(ret).to.equal("validid");
			} catch (err) {
				expect.fail("Should not have rejected with" + err);
			}
		});

		it("should fail remove with a dataset id that has been removed by different instance of InsightFacade", async function () {
			try {
				await facade.addDataset("validid", sections2, InsightDatasetKind.Sections);
				const i1 = new InsightFacade();
				await i1.addDataset("randomid", sections2, InsightDatasetKind.Sections);
				await i1.removeDataset("validid");

				const i2 = new InsightFacade();
				await i2.removeDataset("randomid");
				await i2.removeDataset("validid");
				expect.fail("Should have rejected");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		it("should fail query with a dataset removed", async function () {
			const queryData = {
				WHERE: {
					IS: {
						validid_dept: "cpsc",
					},
				},
				OPTIONS: {
					COLUMNS: ["validid_dept"],
				},
			};
			try {
				await facade.addDataset("validid", sections2, InsightDatasetKind.Sections);
				const i1 = new InsightFacade();
				await i1.addDataset("randomid", sections2, InsightDatasetKind.Sections);
				await i1.removeDataset("validid");
				await i1.performQuery(queryData);

				expect.fail("Should have rejected");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		// it("should succeed query on dataset removed the then added back", async function () {
		// 	const queryData = {
		// 		WHERE: {
		// 			// IS: {
		// 			// 	validid_dept: "cpsc",
		// 			// },
		// 		},
		// 		OPTIONS: {
		// 			COLUMNS: ["validid_furniture", "validKey"],
		// 		},
		// 		TRANSFORMATIONS: {
		// 			GROUP: ["validid_furniture"],
		// 			APPLY: [
		// 				{
		// 					validKey: {
		// 						AVG: "validid_lon",
		// 					},
		// 				},
		// 			],
		// 		},
		// 	};
		// 	const expected = [{ validid_dept: "cpsc" }, { validid_dept: "cpsc" }];
		// 	try {
		// 		await facade.addDataset("validid", sections2, InsightDatasetKind.Sections);
		// 		const i1 = new InsightFacade();
		// 		await i1.removeDataset("validid");
		// 		await i1.addDataset("validid", rooms, InsightDatasetKind.Rooms);
		// 		const ret = await i1.performQuery(queryData);
		//
		// 		expect(ret).to.deep.equal(expected);
		// 	} catch (err) {
		// 		expect.fail("Should not reject with" + err);
		// 	}
		// });
	});

	describe("ListDatasets", function () {
		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		it("List should never reject", async function () {
			try {
				await facade.listDatasets();
			} catch (err) {
				expect.fail("Should not have rejected with ", err);
			}
		});

		it("List default check", async function () {
			await facade.addDataset("ubc", dataset1, InsightDatasetKind.Sections);
			const ret = await facade.listDatasets();
			expect(ret).to.deep.equal([{ id: "ubc", kind: InsightDatasetKind.Sections, numRows: 7 }]);
		});

		it("List default both check", async function () {
			await facade.addDataset("ubc", dataset1, InsightDatasetKind.Sections);
			await facade.addDataset("ubc2", rooms, InsightDatasetKind.Rooms);
			const ret = await facade.listDatasets();
			expect(ret).to.deep.equal([
				{
					id: "ubc",
					kind: "sections",
					numRows: 7,
				},
				{
					id: "ubc2",
					kind: "rooms",
					numRows: 364,
				},
			]);
		});

		it("should succeed list with an empty array", async function () {
			try {
				const res = await facade.listDatasets();
				if (!Array.isArray(res)) {
					expect.fail("Result should have been an array!");
				}
				if (res.length !== 0) {
					expect.fail("Result should be an empty array!");
				}
			} catch (err) {
				expect.fail("Should not have rejected with ", err);
			}
		});

		it("should succeed list with a 1-element array", async function () {
			try {
				const dataset = await getContentFromArchives("validDataset.zip");
				await facade.addDataset("valid-id", dataset, InsightDatasetKind.Sections);
				const res = await facade.listDatasets();
				if (!Array.isArray(res) || res.length !== 1) {
					expect.fail("Result should be a 1-element array!");
				}
				const objToCheck = res[0];
				expect(objToCheck).to.have.property("id", "valid-id");
				expect(objToCheck).to.have.property("kind", InsightDatasetKind.Sections);
				expect(objToCheck).to.have.property("numRows", 1);
			} catch (err) {
				expect.fail("Should not have rejected with ", err);
			}
		});

		it("should succeed list with a 2-element array", async function () {
			try {
				let dataset = await getContentFromArchives("validDataset.zip");
				await facade.addDataset("validid", dataset, InsightDatasetKind.Sections);
				dataset = await getContentFromArchives("validDataset_larger.zip");
				await facade.addDataset("randomid", dataset, InsightDatasetKind.Sections);
				const res = await facade.listDatasets();
				const expected = [
					{ id: "validid", kind: InsightDatasetKind.Sections, numRows: 1 },
					{ id: "randomid", kind: InsightDatasetKind.Sections, numRows: 7 },
				];
				expect(res).to.deep.equal(expected);
			} catch (err) {
				expect.fail("Should not have rejected with " + err);
			}
		});

		it("should succeed list with 2-element array with 1 invalid dataset in data folder", async function () {
			try {
				let dataset = await getContentFromArchives("validDataset.zip");
				await facade.addDataset("validid", dataset, InsightDatasetKind.Sections);
				dataset = await getContentFromArchives("validDataset_larger.zip");
				await facade.addDataset("randomid", dataset, InsightDatasetKind.Sections);

				const outputDir = path.resolve(__dirname, "../../data");
				const zipPath = path.resolve(outputDir, `invalid_id.zip`);
				await fs.writeFile(zipPath, "");
				const res = await facade.listDatasets();
				const expected = [
					{ id: "validid", kind: InsightDatasetKind.Sections, numRows: 1 },
					{ id: "randomid", kind: InsightDatasetKind.Sections, numRows: 7 },
				];
				expect(res).to.deep.equal(expected);
			} catch (err) {
				expect.fail("Should not have rejected with ", err);
			}
		});

		it("should succeed list with 2-element array with valid dataset added but data folder removed", async function () {
			try {
				let dataset = await getContentFromArchives("validDataset.zip");
				await facade.addDataset("validid", dataset, InsightDatasetKind.Sections);
				dataset = await getContentFromArchives("validDataset_larger.zip");
				await facade.addDataset("randomid", dataset, InsightDatasetKind.Sections);

				await clearDisk();
				const res = await facade.listDatasets();
				const expected = [
					{ id: "validid", kind: InsightDatasetKind.Sections, numRows: 1 },
					{ id: "randomid", kind: InsightDatasetKind.Sections, numRows: 7 },
				];
				expect(res).to.deep.equal(expected);
			} catch (err) {
				expect.fail("Should not have rejected with ", err);
			}
		});

		it("should succeed list with 2-element array with valid dataset added but data folder replaced with empty", async function () {
			try {
				let dataset = await getContentFromArchives("validDataset.zip");
				await facade.addDataset("validid", dataset, InsightDatasetKind.Sections);
				dataset = await getContentFromArchives("validDataset_larger.zip");
				await facade.addDataset("randomid", dataset, InsightDatasetKind.Sections);

				const outputDir = path.resolve(__dirname, "../../data");
				await fs.mkdir(outputDir, { recursive: true });
				const res = await facade.listDatasets();
				const expected = [
					{ id: "validid", kind: InsightDatasetKind.Sections, numRows: 1 },
					{ id: "randomid", kind: InsightDatasetKind.Sections, numRows: 7 },
				];
				expect(res).to.deep.equal(expected);
			} catch (err) {
				expect.fail("Should not have rejected with ", err);
			}
		});

		it("should succeed list with 2-element array with valid dataset added by different instance of InsightFacade", async function () {
			try {
				const i1 = new InsightFacade();
				let dataset = await getContentFromArchives("validDataset.zip");
				await i1.addDataset("validid", dataset, InsightDatasetKind.Sections);
				const i2 = new InsightFacade();
				dataset = await getContentFromArchives("validDataset_larger.zip");
				await i2.addDataset("randomid", dataset, InsightDatasetKind.Sections);
				const expected = [
					{ id: "randomid", kind: InsightDatasetKind.Sections, numRows: 7 },
					{ id: "validid", kind: InsightDatasetKind.Sections, numRows: 1 },
				];
				const ret = await i2.listDatasets();
				expect(ret).to.have.deep.members(expected);
			} catch (err) {
				expect.fail("Should not have thrown error" + err);
			}
		});

		it("should succeed list with 2-element array with valid different kinds of dataset added by different instance of InsightFacade", async function () {
			try {
				const i1 = new InsightFacade();
				const dataset = await getContentFromArchives("validDataset.zip");
				await i1.addDataset("validid", dataset, InsightDatasetKind.Sections);
				const i2 = new InsightFacade();
				await i2.addDataset("randomid", rooms, InsightDatasetKind.Rooms);
				const expected = [
					{ id: "randomid", kind: InsightDatasetKind.Rooms, numRows: 364 },
					{ id: "validid", kind: InsightDatasetKind.Sections, numRows: 1 },
				];

				const ret = await i2.listDatasets();
				expect(ret).to.have.deep.members(expected);
			} catch (err) {
				expect.fail("Should not have thrown error" + err);
			}
		});

		it("should succeed list with 1-element array with valid dataset removed by different instance of InsightFacade", async function () {
			try {
				const i1 = new InsightFacade();
				let dataset = await getContentFromArchives("validDataset.zip");
				await i1.addDataset("validid", dataset, InsightDatasetKind.Sections);
				dataset = await getContentFromArchives("validDataset_larger.zip");
				await i1.addDataset("ubc", rooms, InsightDatasetKind.Rooms);

				const i2 = new InsightFacade();
				await i2.removeDataset("validid");

				const i3 = new InsightFacade();

				const ret = await i3.listDatasets();
				expect(ret).to.deep.equal([{ id: "ubc", kind: InsightDatasetKind.Rooms, numRows: 364 }]);
			} catch (err) {
				expect.fail("Should not have thrown error" + err);
			}
		});

		it("Should succeed list with 1-element array with large dataset", async function () {
			try {
				const i1 = new InsightFacade();
				const dataset = await getContentFromArchives("pair.zip");
				await i1.addDataset("validid", dataset, InsightDatasetKind.Sections);

				const expected = [{ id: "validid", kind: InsightDatasetKind.Sections, numRows: 64612 }];

				const ret = await i1.listDatasets();
				expect(ret).to.deep.equal(expected);
			} catch (err) {
				expect.fail("Should not have thrown error" + err);
			}
		});
	});

	describe("PerformQuery", function () {
		it("PerformQuery with non-object(string)", async function () {
			try {
				await facade.performQuery("not an object");
				expect.fail("Should have rejected.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
		it("PerformQuery with non-object(number)", async function () {
			try {
				const num = 999;
				await facade.performQuery(num);
				expect.fail("Should have rejected.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
		it("PerformQuery with non-object(boolean)", async function () {
			try {
				await facade.performQuery(true);
				expect.fail("Should have rejected.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
		it("PerformQuery with non-object(null)", async function () {
			try {
				await facade.performQuery(null);
				expect.fail("Should have rejected.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
		/**
		 * Loads the TestQuery specified in the test name and asserts the behaviour of performQuery.
		 *
		 * Note: the 'this' parameter is automatically set by Mocha and contains information about the test.
		 */
		async function checkQuery(this: Mocha.Context): Promise<void> {
			if (!this.test) {
				throw new Error(
					"Invalid call to checkQuery." +
						"Usage: 'checkQuery' must be passed as the second parameter of Mocha's it(..) function." +
						"Do not invoke the function directly."
				);
			}
			// Destructuring assignment to reduce property accesses
			const { input, expected, errorExpected } = await loadTestQuery(this.test.title);
			let result: InsightResult[];
			try {
				result = await facade.performQuery(input);
			} catch (err) {
				if (!errorExpected) {
					expect.fail(`performQuery threw unexpected error: ${err}`);
				}
				if (expected === "InsightError") {
					expect(err).to.be.instanceOf(InsightError);
				} else if (expected === "ResultTooLargeError") {
					expect(err).to.be.instanceOf(ResultTooLargeError);
				}
				return;
			}
			if (errorExpected) {
				expect.fail(`performQuery resolved when it should have rejected with ${expected}`);
			}
			expect(result).to.deep.equal(expected);
			// expect(result).to.have.deep.members(expected); // TODO: replace with your assertions
		}

		before(async function () {
			facade = new InsightFacade();

			// Add the datasets to InsightFacade once.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises: Promise<string[]>[] = [
				facade.addDataset("sections", sections, InsightDatasetKind.Sections),
				facade.addDataset("one", oneSection, InsightDatasetKind.Sections),
				facade.addDataset("two", twoSections, InsightDatasetKind.Sections),
				facade.addDataset("counter", counterIntuitive, InsightDatasetKind.Sections),
				facade.addDataset("simple", simple, InsightDatasetKind.Sections),
				facade.addDataset("dataset", dataset1, InsightDatasetKind.Sections),
				facade.addDataset("remove", dataset1, InsightDatasetKind.Sections),
				facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms),
			];

			try {
				await Promise.all(loadDatasetPromises);
				await facade.removeDataset("remove");
			} catch (err) {
				// TODO: check if this runs against reference
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		after(async function () {
			await clearDisk();
		});

		// Examples demonstrating how to test performQuery using the JSON Test Queries.
		// The relative path to the query file must be given in square brackets.

		// Valid query
		it("[valid/simple.json] SELECT dept, avg WHERE avg > 97", checkQuery);
		it("[valid/oneAsterisk.json] SELECT dept, WHERE dept start with c", checkQuery);
		it("[valid/twoAsterisks.json] SELECT dept, WHERE dept contains ps", checkQuery);
		it("[valid/emptySearch.json] Search for a section that doesnt exist in dataset", checkQuery);
		it("[valid/orderRowByAvg.json] Return two sections, order by average", checkQuery);
		it("[valid/validSearchColumnDifferentFromWhere.json] Show a column not used in search", checkQuery);
		it("[valid/validSearchForEmptyString.json] Search for a section with empty string as title", checkQuery);
		it("[valid/complexExampleQuery.json] Complex example query given by course", checkQuery);
		it("[valid/orderByString.json] Queries using order by string", checkQuery);
		it("[valid/orderTieBreakerCheck.json] Queries using order by number checking tie breaker logic", checkQuery);
		it("[valid/queryValidationAcceptableFieldCheck.json] Queries every column acceptable", checkQuery);
		it("[valid/simple3.json] SELECT dept, avg WHERE avg > 97 and dept is *th(wildcard prefix test)", checkQuery);
		it(
			"[valid/simple5.json] SELECT dept, avg WHERE avg > 97 and NOT dept is *ath*(wildcard contains test)",
			checkQuery
		);
		it("[valid/simple7.json] Checking if empty WHERE clause returns all results", checkQuery);
		it("[valid/simple8.json] check boundary case for GT", checkQuery);
		it("[valid/simple9.json] Checking if empty WHERE clause returns all results(now with year order)", checkQuery);
		it(
			"[valid/complex2.json] SELECT dept, id, avg WHERE (avg > 90 AND dept = 'adhe' AND avg<96) OR (avg = 95 AND NOT id = 589)",
			checkQuery
		);
		it(
			"[valid/complex3.json] SELECT dept, id, avg WHERE AND (avg > 90 AND dept = 'adhe') (avg = 95 OR id = 329)",
			checkQuery
		);
		it("[valid/logic.json] SELECT dept, id, avg WHERE LT (avg < 82.65) AND dept = 'isci' LT boundary test", checkQuery);
		it(
			"[valid/logic2.json] SELECT uuid,pass,fail avg WHERE OR (OR (avg > 90 OR dept = 'phys')) OR (pass > 50 OR avg = 88.67)",
			checkQuery
		);
		it("[valid/logic3.json] complex", checkQuery);
		it("[valid/logic4.json] not_query", checkQuery);
		// The following tests are created by GEN AI cited
		it("[valid/gen3.json] Courses with 'history' in Title", checkQuery);
		it("[valid/gen4.json] Courses with Average Exactly 78.34", checkQuery);
		it("[valid/gen5.json] Complex Nested Conditions", checkQuery);
		it("[valid/gen6.json] NOT LT Average Greater or Equal to 80", checkQuery);
		it("[valid/gen7.json] NOT EQ Year Not Equal to 2020", checkQuery);
		it("[valid/gen8.json] NOT GT Failures Less Than or Equal to 5", checkQuery);
		it("[valid/gen9.json] NOT NOT EQ Year Equal to 2018", checkQuery);
		it("[valid/gen10.json] NOT (LT Avg < 80 OR GT Failures > 2)", checkQuery);
		it("[valid/gen11.json] Deeply Nested Conditions with AND and OR", checkQuery);
		it("[valid/gen12.json] Complex NOT with Nested Conditions and Wildcards", checkQuery);
		it("[valid/gen13.json] Complex OR with Mixed Operators", checkQuery);
		it("[valid/gen14.json] Comprehensive Test Query", checkQuery);

		// c2
		it("[valid/countOnMKey.json] Count transformation on M key", checkQuery);
		it("[valid/countOnSKey.json] Count transformation on S key", checkQuery);
		it("[valid/groupBy2Columns.json] group arg has 2 columns", checkQuery);
		it("[valid/maxOnMKey.json] Max transformation on M key", checkQuery);
		it("[valid/transformation3Results.json] transformation resulting in 3 objects", checkQuery);
		it("[valid/transformWithAverage.json] transformation using average transformation", checkQuery);
		it("[valid/transformWithMin.json] transformation using minimum transformation", checkQuery);
		it("[valid/transformWithSum.json] transformation using sum transformation", checkQuery);
		it("[valid/roomValidMCompKey.json] valid MComp Filter for Room", checkQuery);
		it("[valid/roomValidSCompKey.json] valid SComp Filter for Room", checkQuery);
		it("[valid/roomValidNotCompKey.json] valid NotComp Filter for Room", checkQuery);
		it("[valid/roomValidSpecQuery.json] valid query from spec page", checkQuery);
		it("[valid/validOrderWithDirDownMultKey.json] valid order with down dir and multiple keys", checkQuery);
		it("[valid/validOrderWithDirDownOneKey.json] valid order with down dir and one key", checkQuery);
		it("[valid/validOrderWithDirUpOneKey.json] valid order with up dir and one key", checkQuery);
		it("[valid/minWithOrder.json] min transformation with order", checkQuery);
		it("[valid/validMinRooms.json] min transformation with rooms", checkQuery);
		it("[valid/validMinWithComplexOrder.json] min transformation with complex order", checkQuery);
		it("[valid/validMinWithMultipleApplyKey.json] min transformation with duplicate apply key", checkQuery);
		it("[valid/validMinWithManyApplyKey.json] min transformation with many apply key", checkQuery);
		it("[valid/roomAllColumnAllRows.json] rooms all column and rows", checkQuery);
		it("[valid/emptyApply.json] empty dataset for apply", checkQuery);
		it("[valid/transformationsWithComplexOrder.json] transformations with complex order", checkQuery);
		it("[valid/manyTransformationAndOrderWithSections.json] transformation and order with sections", checkQuery);
		it("[valid/hrefTest.json] filter on href", checkQuery);
		it("[valid/hrefTest2.json] wildcard on href", checkQuery);
		it("[valid/transformationWithWhitespace.json] transformations with whitespace", checkQuery);
		it("[valid/transformationsWithKey.json] transformations with no key", checkQuery);

		// Invalid query
		it("[invalid/invalid.json] Query missing WHERE", checkQuery);
		it("[invalid/removedDataset.json] Query removed dataset ", checkQuery);
		it(
			"[invalid/oneAsteriskOnly.json] Query entire database with one asterisk and fails with ResultTooLargeError",
			checkQuery
		);
		it(
			"[invalid/twoAsterisks.json] Query entire database with two asterisk and fails with ResultTooLargeError",
			checkQuery
		);
		it("[invalid/invalidTermInsideLogicComparison.json] Invalid term used in logic comparison", checkQuery);
		it("[invalid/logicComparisonInvalidComparator.json] Invalid comparator used in logic comparison", checkQuery);
		it("[invalid/mComparisonInvalidKey.json] Invalid key used in m comparison", checkQuery);
		it("[invalid/mComparisonInvalidMComparator.json] Invalid comparator used in m comparison", checkQuery);
		it("[invalid/missingOptionArg.json] query without option arg", checkQuery);
		it("[invalid/optionHasNoMember.json] query with option arg that has no members", checkQuery);
		it("[invalid/optionOnlyHasOrder.json] query with option arg that only has member order", checkQuery);
		it("[invalid/sComparisonInvalidInputString.json] Invalid input string used in s comparison", checkQuery);
		it("[invalid/sComparisonInvalidKey.json] Invalid key used in s comparison", checkQuery);
		it("[invalid/sComparisonInvalidSComparator.json] Invalid comparator used in s comparison", checkQuery);
		it("[invalid/invalidNegationArg.json] Invalid use of negation in where", checkQuery);
		it("[invalid/optionWithColumnFromAnotherDataset.json] Option selects column from another dataset", checkQuery);
		it("[invalid/optionWithNonexistingColumn.json] Option selects nonexisting column", checkQuery);
		it("[invalid/invalid2.json] Query wrong wildcard", checkQuery);
		it("[invalid/invalid5.json] Query non-object input", checkQuery);
		it("[invalid/invalid6.json] Query wrong key in WHERE", checkQuery);
		it("[invalid/invalid7.json] Query wrong key in OPTIONS", checkQuery);
		it("[invalid/invalid8.json] Query wrong key in ORDER", checkQuery);
		it("[invalid/invalid10.json] Query with empty AND", checkQuery);
		it("[invalid/invalid11.json] Query with empty OR", checkQuery);
		it("[invalid/invalid13.json] Query ORDER key not in columns", checkQuery);
		it("[invalid/invalid16.json] Query with GT null(reject)", checkQuery);
		it("[invalid/invalid17.json] Query with GT ninety seven(invalid, not a number)", checkQuery);
		it("[invalid/invalid19.json] idstring(mkey) has underscores(invalid)", checkQuery);
		it("[invalid/invalid20.json] idstring(mkey) is empty(invalid)", checkQuery);
		it("[invalid/invalid21.json] idstring(skey) has underscores(invalid)", checkQuery);
		it("[invalid/invalid22.json] idstring(skey) is empty(invalid)", checkQuery);

		//c2
		it("[invalid/invalidApplyKey.json] invalid apply key", checkQuery);
		it("[invalid/invalidApplyToken.json] invalid apply token)", checkQuery);
		it("[invalid/invalidColumnAfterTransformation.json] invalid column after transformation has happened", checkQuery);
		it("[invalid/maxOnSKey.json] Calling max transformation on an SKey", checkQuery);
		it("[invalid/transformationMissingGroup.json] transformation arg doesn't have a group arg", checkQuery);
		it("[invalid/transformationMissingApply.json] transformation arg doesn't have an apply arg", checkQuery);
		it("[invalid/typoOnApply.json] typo on apply arg", checkQuery);
		it("[invalid/typoOnGroup.json] typo on group arg", checkQuery);
		it("[invalid/invalidOrderDirValue.json] Invalid Order Dir Value", checkQuery);
		it("[invalid/invalidOrderKey.json] Invalid Order Key", checkQuery);
		it("[invalid/invalidOrderKeysValueEmptyArray.json] Invalid Order Keys Value Empty Array", checkQuery);
		it("[invalid/invalidOrderKeysValueNotArray.json] Invalid Order Keys Value Not Array", checkQuery);
		it("[invalid/roomInvalidMCompKey.json] Invalid MComp Key for Room", checkQuery);
		it("[invalid/roomInvalidSCompKey.json] Invalid SComp Key for Room", checkQuery);
		it("[invalid/columnsKeyNotInTransformation.json] column not in transformation", checkQuery);
		it("[invalid/invalidMinWrongDataset.json] min with wrong dataset in apply", checkQuery);
		it("[invalid/invalidMinWrongDataset2.json] min with wrong dataset in group", checkQuery);
		it("[invalid/orderKeyNotInColumns.json] order key not in columns", checkQuery);
		it("[invalid/invalidMinWithComplexOrder.json] min with complex order not in columns", checkQuery);
		it("[invalid/invalidMinWithMultipleApplyKey.json] min with duplicate apply key", checkQuery);
		it("[invalid/invalidDoubleDataset.json] invalid call 2 dataset", checkQuery);
		it("[invalid/invalidSCompInMin.json] invalid using SComp in min", checkQuery);
	});
});
