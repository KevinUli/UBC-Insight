import { QueryData } from "../../src/controller/QueryEngine/QueryData";
import { expect } from "chai";
import { InsightDatasetKind, InsightError } from "../../src/controller/IInsightFacade";
import { Validation } from "../../src/controller/Validation";
import { Dataset } from "../../src/controller/Dataset";

describe("QueryData Class", function () {
	describe("Constructor (Parse & Validation)", function () {
		beforeEach(function () {
			Validation.pushDataset(new Dataset("dataset", InsightDatasetKind.Sections, 0, []));
		});

		afterEach(function () {
			Validation.clearDatasets();
		});

		it("should reject with empty object", function () {
			try {
				const input = {};
				new QueryData(input);
				expect.fail("Should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with missing where", function () {
			try {
				const input = { OPTIONS: { COLUMNS: ["dataset_dept"] } };
				new QueryData(input);
				expect.fail("Should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with missing comparator", function () {
			try {
				const input = { WHERE: {}, OPTIONS: { COLUMNS: ["dataset_dept"] } };
				new QueryData(input);
				expect.fail("Should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with invalid comparator", function () {
			try {
				const input = { WHERE: { NOR: {} }, OPTIONS: { COLUMNS: ["dataset_dept"] } };
				new QueryData(input);
				expect.fail("Should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with dataset not added", function () {
			try {
				const input = { WHERE: { IS: { sections_dept: "something" } }, OPTIONS: { COLUMNS: ["sections_dept"] } };
				new QueryData(input);
				expect.fail("Should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with too may keys", function () {
			try {
				const input = {
					WHERE: { IS: { dataset_dept: "something" } },
					OPTIONS: { COLUMNS: ["dataset_dept"] },
					EXTRAKEY: {},
				};
				new QueryData(input);
				expect.fail("Should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with column value not array", function () {
			try {
				const input = {
					WHERE: { IS: { dataset_dept: "something" } },
					OPTIONS: { COLUMNS: ["dataset_dept"] },
					EXTRAKEY: {},
				};
				new QueryData(input);
				expect.fail("Should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with missing column", function () {
			try {
				const input = { WHERE: { IS: { dataset_dept: "something" } }, OPTIONS: { ORDER: "dataset_dept" } };
				new QueryData(input);
				expect.fail("Should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with invalid order", function () {
			try {
				const input = {
					WHERE: { IS: { dataset_dept: "something" } },
					OPTIONS: { COLUMNS: ["dataset_dept"], ORDER: "dataset_pool" },
				};
				new QueryData(input);
				expect.fail("Should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with LogicComparator value not array", function () {
			try {
				const input = {
					WHERE: { AND: { IS: { dataset_dept: "something" } } },
					OPTIONS: { COLUMNS: ["dataset_dept"] },
				};
				new QueryData(input);
				expect.fail("Should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with invalid value to comparator", function () {
			try {
				const input = {
					WHERE: { IS: "something" },
					OPTIONS: { COLUMNS: ["dataset_dept"] },
				};
				new QueryData(input);
				expect.fail("Should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject SComparator with too many key-value pairs to comparator", function () {
			try {
				const input = {
					WHERE: { IS: { dataset_dept: "something", dataset_id: "8718" } },
					OPTIONS: { COLUMNS: ["dataset_dept"] },
				};
				new QueryData(input);
				expect.fail("Should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject MComparator with too many key-value pairs to comparator", function () {
			try {
				const input = {
					WHERE: { EQ: { dataset_avg: 90, dataset_pass: 20 } },
					OPTIONS: { COLUMNS: ["dataset_dept"] },
				};
				new QueryData(input);
				expect.fail("Should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject LogicComparator with empty array", function () {
			try {
				const input = {
					WHERE: { OR: [] },
					OPTIONS: { COLUMNS: ["dataset_dept"] },
				};
				new QueryData(input);
				expect.fail("Should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject NOTComparator with too many key-value pairs to comparator", function () {
			try {
				const input = {
					WHERE: { NOT: { IS: { dataset_dept: "something" }, EQ: { dataset_avg: 100 } } },
					OPTIONS: { COLUMNS: ["dataset_dept"] },
				};
				new QueryData(input);
				expect.fail("Should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with column containing non-string array", function () {
			try {
				const input = {
					WHERE: { IS: { dataset_dept: "something" } },
					OPTIONS: { COLUMNS: [{ width: "high" }] },
				};
				new QueryData(input);
				expect.fail("Should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with column containing non-string array", function () {
			try {
				const input = {
					WHERE: { IS: { dataset_dept: "something" } },
					OPTIONS: { COLUMNS: [{ width: "high" }] },
				};
				new QueryData(input);
				expect.fail("Should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with option having too many key-value elements", function () {
			try {
				const input = {
					WHERE: { IS: { dataset_dept: "something" } },
					OPTIONS: { COLUMNS: ["dataset_dept"], ORDER: "dataset_dept", random_key: "value" },
				};
				new QueryData(input);
				expect.fail("Should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with order value not string", function () {
			try {
				const input = {
					WHERE: { IS: { dataset_dept: "something" } },
					OPTIONS: { COLUMNS: ["dataset_dept"], ORDER: 9 },
				};
				new QueryData(input);
				expect.fail("Should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject LogicComparator with comparator having too many keys", function () {
			try {
				const input = {
					WHERE: { AND: [{ IS: { dataset_dept: "something" }, EQ: { dataset_avg: 100 } }] },
					OPTIONS: { COLUMNS: ["dataset_dept"] },
				};
				new QueryData(input);
				expect.fail("Should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should succeed with ISComparator without order", function () {
			try {
				const input = { WHERE: { IS: { dataset_dept: "something" } }, OPTIONS: { COLUMNS: ["dataset_dept"] } };
				new QueryData(input);
			} catch (err) {
				expect.fail("should not have thrown Error ", err);
			}
		});

		it("should succeed with ISComparator with order", function () {
			try {
				const input = {
					WHERE: { IS: { dataset_dept: "something" } },
					OPTIONS: { COLUMNS: ["dataset_dept"], ORDER: "dataset_dept" },
				};
				new QueryData(input);
			} catch (err) {
				expect.fail("should not have thrown Error ", err);
			}
		});

		it("should succeed with EQComparator with order", function () {
			try {
				const input = {
					WHERE: { EQ: { dataset_avg: 90 } },
					OPTIONS: { COLUMNS: ["dataset_dept"], ORDER: "dataset_dept" },
				};
				new QueryData(input);
			} catch (err) {
				expect.fail("should not have thrown Error ", err);
			}
		});

		it("should succeed with LogicComparator without order", function () {
			try {
				const input = {
					WHERE: { AND: [{ IS: { dataset_dept: "something" } }] },
					OPTIONS: { COLUMNS: ["dataset_dept"] },
				};
				new QueryData(input);
			} catch (err) {
				expect.fail("should not have thrown Error ", err);
			}
		});

		it("should succeed with NotComparator without order", function () {
			try {
				const input = { WHERE: { NOT: { IS: { dataset_dept: "something" } } }, OPTIONS: { COLUMNS: ["dataset_dept"] } };
				new QueryData(input);
			} catch (err) {
				expect.fail("should not have thrown Error ", err);
			}
		});
	});
});
