import { expect } from "chai";
import request, { Response } from "supertest";
import { StatusCodes } from "http-status-codes";
import Log from "@ubccpsc310/folder-test/build/Log";
import Server from "../../src/rest/Server";
import { clearDisk, getContentFromArchives } from "../TestUtil";

describe("Facade C3", function () {
	let server: Server;
	const port = 4321;
	const URL = `http://localhost:${port}`;
	let oneSection: string;
	let wrongFormat: string;
	let rooms: string;

	function base64ToBuffer(base64String: string): Buffer {
		return Buffer.from(base64String, "base64");
	}

	before(async function () {
		server = new Server(port);
		try {
			await server.start();
		} catch {
			Log.error("Failed to start server");
			throw new Error("Failed to start server");
		}
		oneSection = await getContentFromArchives("one.zip"); //one row result test zip
		wrongFormat = await getContentFromArchives("wrongFormat.zip"); //wrong file format test zip
		rooms = await getContentFromArchives("campus.zip");
	});
	after(async function () {
		try {
			await server.stop();
		} catch {
			Log.error("Failed to stop server");
		}
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	afterEach(async function () {
		// might want to add some process logging here to keep track of what is going on
		// Clear all datasets
		const datasets = await request(URL).get("/datasets").send();
		datasets.body.result.forEach(async (ds: any) => {
			await request(URL).delete(`/dataset/${ds.id}`).send();
		});
		await clearDisk();
	});

	describe("PUT /dataset/:id/:kind", function () {
		it("should successfully add a valid courses dataset", async function () {
			const datasetId = "courses";
			const datasetKind = "sections";
			const zipData = base64ToBuffer(oneSection);

			const res: Response = await request(URL)
				.put(`/dataset/${datasetId}/${datasetKind}`)
				.send(zipData)
				.set("Content-Type", "application/x-zip-compressed");

			expect(res.status).to.equal(StatusCodes.OK);
			expect(res.body).to.have.property("result").that.is.an("array").that.includes(datasetId);
		});
		it("should successfully add a valid rooms dataset", async function () {
			const datasetId = "rooms";
			const datasetKind = "rooms";
			const zipData = base64ToBuffer(rooms);

			const res: Response = await request(URL)
				.put(`/dataset/${datasetId}/${datasetKind}`)
				.send(zipData)
				.set("Content-Type", "application/x-zip-compressed");
			expect(res.status).to.equal(StatusCodes.OK);
			expect(res.body).to.have.property("result").that.is.an("array").that.includes(datasetId);
		});
		it("should reject with invalid id", async function () {
			const datasetId = "u_bc";
			const datasetKind = "rooms";
			const zipData = base64ToBuffer(rooms);

			const res: Response = await request(URL)
				.put(`/dataset/${datasetId}/${datasetKind}`)
				.send(zipData)
				.set("Content-Type", "application/x-zip-compressed");
			expect(res.status).to.equal(StatusCodes.BAD_REQUEST);
			expect(res.body).to.have.property("error").that.is.a("string");
		});
		it("should reject with invalid data", async function () {
			const datasetId = "ubc";
			const datasetKind = "sections";
			const zipData = base64ToBuffer(wrongFormat);

			const res: Response = await request(URL)
				.put(`/dataset/${datasetId}/${datasetKind}`)
				.send(zipData)
				.set("Content-Type", "application/x-zip-compressed");
			expect(res.status).to.equal(StatusCodes.BAD_REQUEST);
			expect(res.body).to.have.property("error").that.is.a("string");
		});
	});

	describe("DELETE /dataset/:id", function () {
		it("should successfully delete an existing courses dataset", async function () {
			const datasetId = "sections";
			const datasetKind = "sections";
			const zipData = base64ToBuffer(oneSection);

			// Add the dataset first
			const addRes: Response = await request(URL)
				.put(`/dataset/${datasetId}/${datasetKind}`)
				.send(zipData)
				.set("Content-Type", "application/x-zip-compressed");

			expect(addRes.status).to.equal(StatusCodes.OK);

			// Now delete the dataset
			const delRes: Response = await request(URL).delete(`/dataset/${datasetId}`).send();

			expect(delRes.status).to.equal(StatusCodes.OK);
			expect(delRes.body).to.have.property("result").that.equals(datasetId);
		});
		it("should successfully delete an existing rooms dataset", async function () {
			const datasetId = "rooms";
			const datasetKind = "rooms";
			const zipData = base64ToBuffer(rooms);

			// Add the dataset first
			const addRes: Response = await request(URL)
				.put(`/dataset/${datasetId}/${datasetKind}`)
				.send(zipData)
				.set("Content-Type", "application/x-zip-compressed");

			expect(addRes.status).to.equal(StatusCodes.OK);

			// Now delete the dataset
			const delRes: Response = await request(URL).delete(`/dataset/${datasetId}`).send();

			expect(delRes.status).to.equal(StatusCodes.OK);
			expect(delRes.body).to.have.property("result").that.equals(datasetId);
		});
		it("should reject not found", async function () {
			const datasetId = "rooms";
			const delRes: Response = await request(URL).delete(`/dataset/${datasetId}`).send();

			expect(delRes.status).to.equal(StatusCodes.NOT_FOUND);
			expect(delRes.body).to.have.property("error").that.is.a("string");
		});
		it("should reject insight error id", async function () {
			const datasetId = "u_bc";
			const delRes: Response = await request(URL).delete(`/dataset/${datasetId}`).send();

			expect(delRes.status).to.equal(StatusCodes.BAD_REQUEST);
			expect(delRes.body).to.have.property("error").that.is.a("string");
		});
	});
	describe("POST /query", function () {
		it("should successfully perform a valid query", async function () {
			const datasetId = "courses";
			const datasetKind = "sections";
			const zipData = base64ToBuffer(oneSection);

			// Add the dataset first
			const addRes: Response = await request(URL)
				.put(`/dataset/${datasetId}/${datasetKind}`)
				.send(zipData)
				.set("Content-Type", "application/x-zip-compressed");

			expect(addRes.status).to.equal(StatusCodes.OK);

			// Define a valid query
			const query = {
				WHERE: {
					GT: {
						courses_avg: 90,
					},
				},
				OPTIONS: {
					COLUMNS: ["courses_dept", "courses_avg"],
					ORDER: "courses_avg",
				},
			};

			const res: Response = await request(URL).post("/query").send(query).set("Content-Type", "application/json");

			expect(res.status).to.equal(StatusCodes.OK);
			expect(res.body).to.have.property("result").that.is.an("array");
			// Further assertions can be made based on expected query results
		});
		it("should fail to perform a query with invalid syntax", async function () {
			// Define an invalid query (missing WHERE)
			const invalidQuery = {
				OPTIONS: {
					COLUMNS: ["courses_dept", "courses_avg"],
					ORDER: "courses_avg",
				},
			};

			const res: Response = await request(URL)
				.post("/query")
				.send(invalidQuery)
				.set("Content-Type", "application/json");

			expect(res.status).to.equal(StatusCodes.BAD_REQUEST);
			expect(res.body).to.have.property("error").that.is.a("string");
		});
	});

	describe("GET /datasets", function () {
		it("should return an empty array when no datasets are added", async function () {
			// Ensure all datasets are removed
			const datasets = await request(URL).get("/datasets").send();
			datasets.body.result.forEach(async (ds: any) => {
				await request(URL).delete(`/dataset/${ds.id}`).send();
			});

			const res: Response = await request(URL).get("/datasets").send();

			expect(res.status).to.equal(StatusCodes.OK);
			void expect(res.body).to.have.property("result").that.is.an("array").that.is.empty;
		});
		it("two deep list", async function () {
			let datasetId = "rooms";
			let datasetKind = "rooms";
			let zipData = base64ToBuffer(rooms);

			// Add the dataset first
			const addRes: Response = await request(URL)
				.put(`/dataset/${datasetId}/${datasetKind}`)
				.send(zipData)
				.set("Content-Type", "application/x-zip-compressed");

			expect(addRes.status).to.equal(StatusCodes.OK);

			datasetId = "courses";
			datasetKind = "sections";
			zipData = base64ToBuffer(oneSection);

			let res: Response = await request(URL)
				.put(`/dataset/${datasetId}/${datasetKind}`)
				.send(zipData)
				.set("Content-Type", "application/x-zip-compressed");

			expect(res.status).to.equal(StatusCodes.OK);

			res = await request(URL).get("/datasets").send();

			expect(res.status).to.equal(StatusCodes.OK);
			expect(res.body).to.have.property("result").that.is.an("array");

			const datasetIds = res.body.result.map((ds: any) => ds.id);
			expect(datasetIds).to.include.members(["rooms", "courses"]);
		});
	});
	// The other endpoints work similarly. You should be able to find all instructions in the supertest documentation
});
