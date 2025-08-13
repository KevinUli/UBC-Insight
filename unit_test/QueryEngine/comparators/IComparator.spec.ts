import { ISComparator } from "../../../src/controller/QueryEngine/comparators/ISComparator";
import { MComparator } from "../../../src/controller/QueryEngine/comparators/MComparator";
import { expect } from "chai";
import { IInsightFacade, InsightDatasetKind, InsightError } from "../../../src/controller/IInsightFacade";
import { Validation } from "../../../src/controller/Validation";
import { LogicComparator } from "../../../src/controller/QueryEngine/comparators/LogicComparator";
import { NOTComparator } from "../../../src/controller/QueryEngine/comparators/NOTComparator";
import { ORComparator } from "../../../src/controller/QueryEngine/comparators/ORComparator";
import { clearDisk, getContentFromArchives } from "../../../test/TestUtil";
import InsightFacade from "../../../src/controller/InsightFacade";
import { EQComparator } from "../../../src/controller/QueryEngine/comparators/EQComparator";

describe("IComparator interface", async function () {
	let dataset: string;
	let datasetSmall: string;

	before(async function () {
		dataset = await getContentFromArchives("validDataset_larger.zip");
		datasetSmall = await getContentFromArchives("validDataset.zip");
	});
	describe("Validation", function () {
		describe("ISComparator", function () {
			let facade: IInsightFacade;
			let comparator: ISComparator;
			beforeEach(async function () {
				comparator = new ISComparator();
				facade = new InsightFacade();
				await facade.addDataset("dataset", dataset, InsightDatasetKind.Sections);
			});

			afterEach(async function () {
				await clearDisk();
				Validation.clearDatasets();
			});

			it("should reject with dataset not added", async function () {
				try {
					comparator.setKey("sections_dept");
					comparator.setValue("something");
					await comparator.validateFields();
					expect.fail("Should have thrown InsightError");
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("should reject with invalid column", async function () {
				try {
					comparator.setKey("dataset_avg");
					comparator.setValue("something");
					await comparator.validateFields();
					expect.fail("Should have thrown InsightError");
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("should reject with too many underscore in key", async function () {
				try {
					comparator.setKey("dataset_dept_hello");
					comparator.setValue("something");
					await comparator.validateFields();
					expect.fail("Should have thrown InsightError");
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("should reject with invalid regex with three asterisk", async function () {
				try {
					comparator.setKey("dataset_dept");
					comparator.setValue("***");
					await comparator.validateFields();
					expect.fail("Should have thrown InsightError");
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("should fail with asterisk in middle of string", async function () {
				try {
					comparator.setKey("dataset_dept");
					comparator.setValue("he*llo");
					await comparator.validateFields();
					expect.fail("Should have thrown InsightError");
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("should succeed with one asterisk", async function () {
				try {
					comparator.setKey("dataset_dept");
					comparator.setValue("*");
					await comparator.validateFields();
				} catch (err) {
					expect.fail("Should not have thrown error", err);
				}
			});

			it("should succeed with two asterisk", async function () {
				try {
					comparator.setKey("dataset_dept");
					comparator.setValue("**");
					await comparator.validateFields();
				} catch (err) {
					expect.fail("Should not have thrown error", err);
				}
			});

			it("should succeed with preceding asterisk", async function () {
				try {
					comparator.setKey("dataset_dept");
					comparator.setValue("*hi");
					await comparator.validateFields();
				} catch (err) {
					expect.fail("Should not have thrown error", err);
				}
			});
			it("should succeed with ending with asterisk", async function () {
				try {
					comparator.setKey("dataset_dept");
					comparator.setValue("hi*");
					await comparator.validateFields();
				} catch (err) {
					expect.fail("Should not have thrown error", err);
				}
			});

			it("should succeed with between two asterisk", async function () {
				try {
					comparator.setKey("dataset_dept");
					comparator.setValue("*hi*");
					await comparator.validateFields();
				} catch (err) {
					expect.fail("Should not have thrown error", err);
				}
			});

			it("should succeed with no asterisk", async function () {
				try {
					comparator.setKey("dataset_dept");
					comparator.setValue("hello!8279@#");
					await comparator.validateFields();
				} catch (err) {
					expect.fail("Should not have thrown error", err);
				}
			});
		});

		describe("MComparator", function () {
			let facade: IInsightFacade;
			let comparator: MComparator;
			beforeEach(async function () {
				comparator = new EQComparator();
				facade = new InsightFacade();
				await facade.addDataset("dataset", dataset, InsightDatasetKind.Sections);
			});

			afterEach(async function () {
				await clearDisk();
				Validation.clearDatasets();
			});

			it("should fail with dataset not added", async function () {
				try {
					comparator.setKey("sections_avg");
					comparator.setValue(1);
					await comparator.validateFields();
					expect.fail("Should have thrown InsightError");
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("should fail with invalid column", async function () {
				try {
					comparator.setKey("dataset_dept");
					comparator.setValue(1);
					await comparator.validateFields();
					expect.fail("Should have thrown InsightError");
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("should fail with too many underscores in key", async function () {
				try {
					comparator.setKey("dataset_avg_hello");
					comparator.setValue(1);
					await comparator.validateFields();
					expect.fail("Should have thrown InsightError");
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("should succeed with valid dataset and column", async function () {
				try {
					comparator.setKey("dataset_avg");
					comparator.setValue(1);
					await comparator.validateFields();
				} catch (err) {
					expect.fail("Should not have thrown error", err);
				}
			});
		});

		describe("LogicComparator", function () {
			let facade: IInsightFacade;
			let comparator: LogicComparator;
			beforeEach(async function () {
				comparator = new ORComparator();
				facade = new InsightFacade();
				await facade.addDataset("dataset", dataset, InsightDatasetKind.Sections);
			});

			afterEach(async function () {
				await clearDisk();
				Validation.clearDatasets();
			});

			it("should reject with empty comparator", async function () {
				try {
					await comparator.validateFields();
					expect.fail("Should have rejected with InsightError");
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("should reject with invalid comparator in first element out of one", async function () {
				try {
					const comp1 = new EQComparator();
					comp1.setKey("dataset_dept");
					comp1.setValue(1);
					comparator.addFilter(comp1);
					await comparator.validateFields();
					expect.fail("Should have rejected with InsightError");
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("should reject with invalid comparator in first element out of multiple", async function () {
				try {
					const comp1 = new EQComparator();
					comp1.setKey("dataset_dept");
					comp1.setValue(1);

					const comp2 = new ISComparator();
					comp2.setKey("dataset_dept");
					comp2.setValue("something");

					comparator.addFilter(comp1);
					comparator.addFilter(comp2);
					await comparator.validateFields();
					expect.fail("Should have rejected with InsightError");
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("should reject with invalid comparator in second element out of multiple", async function () {
				try {
					const comp1 = new EQComparator();
					comp1.setKey("dataset_avg");
					comp1.setValue(1);

					const comp2 = new ISComparator();
					comp2.setKey("dataset_avg");
					comp2.setValue("something");

					comparator.addFilter(comp1);
					comparator.addFilter(comp2);
					await comparator.validateFields();
					expect.fail("Should have rejected with InsightError");
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("should reject with invalid comparator in multiple element", async function () {
				try {
					const comp1 = new EQComparator();
					comp1.setKey("dataset_dept");
					comp1.setValue(1);

					const comp2 = new ISComparator();
					comp2.setKey("dataset_avg");
					comp2.setValue("something");

					comparator.addFilter(comp1);
					comparator.addFilter(comp2);
					await comparator.validateFields();
					expect.fail("Should have rejected with InsightError");
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("should succeed with one valid comparator", async function () {
				try {
					const comp1 = new EQComparator();
					comp1.setKey("dataset_avg");
					comp1.setValue(1);

					comparator.addFilter(comp1);
					await comparator.validateFields();
				} catch (err) {
					expect.fail("Should not have thrown error", err);
				}
			});

			it("should succeed with multiple valid comparator", async function () {
				try {
					const comp1 = new EQComparator();
					comp1.setKey("dataset_avg");
					comp1.setValue(1);

					const comp2 = new ISComparator();
					comp2.setKey("dataset_dept");
					comp2.setValue("something");

					comparator.addFilter(comp1);
					comparator.addFilter(comp2);
					await comparator.validateFields();
				} catch (err) {
					expect.fail("Should not have thrown error", err);
				}
			});
		});

		describe("NOTComparator", function () {
			let facade: IInsightFacade;
			let comparator: NOTComparator;
			beforeEach(async function () {
				comparator = new NOTComparator();
				facade = new InsightFacade();
				await facade.addDataset("dataset", dataset, InsightDatasetKind.Sections);
			});

			afterEach(async function () {
				await clearDisk();
				Validation.clearDatasets();
			});

			it("should reject with no comparator in field", async function () {
				try {
					await comparator.validateFields();
					expect.fail("Should have rejected with InsightError");
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("should reject with an invalid comparator", async function () {
				try {
					const comp1 = new EQComparator();
					comp1.setKey("dataset_dept");
					comp1.setValue(1);

					comparator.addFilter(comp1);
					await comparator.validateFields();
					expect.fail("Should have rejected with InsightError");
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("should succeed with a valid comparator", async function () {
				try {
					const comp1 = new ISComparator();
					comp1.setKey("dataset_avg");
					comp1.setValue("something");

					comparator.addFilter(comp1);
					await comparator.validateFields();
					expect.fail("Should have rejected with InsightError");
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});
		});
	});

	describe("Comparison", function () {
		describe("ISComparator", function () {
			let facade: IInsightFacade;
			let comparator: ISComparator;
			beforeEach(async function () {
				facade = new InsightFacade();
				comparator = new ISComparator();
				await facade.addDataset("datasetSmall", datasetSmall, InsightDatasetKind.Sections);
			});

			afterEach(async function () {
				await clearDisk();
				Validation.clearDatasets();
			});

			it("Should succeed with dept = cpsc", async function () {
				comparator.setKey("datasetSmall_dept");
				comparator.setValue("cpsc");
				await comparator.validateFields();

				const expected = [
					{
						datasetSmall_uuid: "17894",
						datasetSmall_id: "310",
						datasetSmall_title: "Software Engineering",
						datasetSmall_instructor: "Nick Bradley",
						datasetSmall_dept: "cpsc",
						datasetSmall_year: "2024",
						datasetSmall_avg: "87",
						datasetSmall_pass: "142",
						datasetSmall_fail: "12",
						datasetSmall_audit: "20",
					},
				];

				try {
					const ret = comparator.filterDataset();
					expect(ret).to.be.deep.equal(expected);
				} catch (err) {
					expect.fail("Should not have thrown error", err);
				}
			});

			it("Should succeed with dept = *sc", async function () {
				comparator.setKey("datasetSmall_dept");
				comparator.setValue("*sc");
				await comparator.validateFields();

				const expected = [
					{
						datasetSmall_uuid: "17894",
						datasetSmall_id: "310",
						datasetSmall_title: "Software Engineering",
						datasetSmall_instructor: "Nick Bradley",
						datasetSmall_dept: "cpsc",
						datasetSmall_year: "2024",
						datasetSmall_avg: "87",
						datasetSmall_pass: "142",
						datasetSmall_fail: "12",
						datasetSmall_audit: "20",
					},
				];

				try {
					const ret = comparator.filterDataset();
					expect(ret).to.be.deep.equal(expected);
				} catch (err) {
					expect.fail("Should not have thrown error", err);
				}
			});

			it("Should succeed with dept = cp*", async function () {
				comparator.setKey("datasetSmall_dept");
				comparator.setValue("cp*");
				await comparator.validateFields();

				const expected = [
					{
						datasetSmall_uuid: "17894",
						datasetSmall_id: "310",
						datasetSmall_title: "Software Engineering",
						datasetSmall_instructor: "Nick Bradley",
						datasetSmall_dept: "cpsc",
						datasetSmall_year: "2024",
						datasetSmall_avg: "87",
						datasetSmall_pass: "142",
						datasetSmall_fail: "12",
						datasetSmall_audit: "20",
					},
				];

				try {
					const ret = comparator.filterDataset();
					expect(ret).to.be.deep.equal(expected);
				} catch (err) {
					expect.fail("Should not have thrown error", err);
				}
			});
		});
	});
});
