import { expect } from "chai";
import { Validation } from "../src/controller/Validation";
import { clearDisk, getContentFromArchives } from "../test/TestUtil";

describe("Validation Class", function () {
	describe("isValidString", function () {
		it("reject white space", function () {
			const bool = Validation.isValidStringAdd(" ");
			expect(bool).to.equal(false);
		});
		it("accept not only white space", function () {
			const bool = Validation.isValidStringAdd("  HelloWorld  ");
			expect(bool).to.equal(true);
		});
		it("reject underscore", function () {
			const bool = Validation.isValidStringAdd("Hello_World");
			expect(bool).to.equal(false);
		});
	});
	describe("isValidContent", function () {
		let empty: string;
		let simple: string;
		let wrongStructure: string;
		before(async function () {
			// This block runs once and loads the datasets.
			empty = await getContentFromArchives("empty.zip");
			simple = await getContentFromArchives("simple.zip");
			wrongStructure = await getContentFromArchives("wrongStruct.zip");

			// Just in case there is anything hanging around from a previous run of the test suite
			await clearDisk();
		});
		it("reject empty courses", async function () {
			const bool = await Validation.isValidSection(empty);
			expect(bool).to.equal(false);
		});
		it("simple pass", async function () {
			const bool = await Validation.isValidSection(simple);
			expect(bool).to.equal(true);
		});
		it("wrong struct(no courses folder) should reject", async function () {
			const bool = await Validation.isValidSection(wrongStructure);
			expect(bool).to.equal(false);
		});
	});
});
