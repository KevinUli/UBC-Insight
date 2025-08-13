import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import { Validation } from "./Validation";
import { Parse } from "./Parse";
import { Dataset } from "./Dataset";
import { QueryData } from "./QueryEngine/QueryData";
import fs from "fs-extra";
import path from "path";
import { sanitizeFilename } from "./Sanitizer";
import { Helper } from "./Helper";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	public insightDatasets: InsightDataset[] = [];

	public constructor() {
		Validation.setFacade(this);
	}

	public getDatasetIds(): string[] {
		const ids: string[] = [];
		this.insightDatasets.forEach((dataset) => {
			ids.push(dataset.id);
		});
		return ids;
	}

	public getDataset(id: string): InsightDataset | undefined {
		return this.insightDatasets.find((dataset) => dataset.id === id);
	}

	public getDatasets(): InsightDataset[] {
		return this.insightDatasets;
	}
	public containsDataset(id: string): boolean {
		return this.insightDatasets.some((dataset) => dataset.id === id);
	}

	public pushDataset(dataset: InsightDataset): void {
		this.insightDatasets.push(dataset);
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		switch (kind) {
			case InsightDatasetKind.Sections:
				return this.addSection(id, content, kind);
			case InsightDatasetKind.Rooms:
				return this.addRoom(id, content, kind);
			default:
				throw new InsightError("Invalid kind");
		}
	}

	public async addSection(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if ((await Validation.isValidStringAdd(id)) && (await Validation.isValidSection(content))) {
			try {
				const sects = await Parse.parseContentSection(content);
				id = sanitizeFilename(id);
				const dataset = new Dataset(id, kind, sects.length, sects);
				this.pushDataset(Validation.toInsightDatasetObject(dataset));
				Validation.pushDataset(dataset);
				await dataset.writeToDiskSection();
				return this.getDatasetIds();
			} catch {
				throw new InsightError("Error parsing JSON");
			}
		} else {
			throw new InsightError("Invalid input");
		}
	}

	public async addRoom(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if ((await Validation.isValidStringAdd(id)) && (await Validation.isValidRoom(content))) {
			try {
				const rooms = await Parse.parseContentRoom(content);
				id = sanitizeFilename(id);
				const dataset = new Dataset(id, kind, rooms.length, rooms);
				this.pushDataset(Validation.toInsightDatasetObject(dataset));
				Validation.pushDataset(dataset);
				await dataset.writeToDiskRoom();
				return this.getDatasetIds();
			} catch {
				throw new InsightError("Error parsing HTML");
			}
		} else {
			throw new InsightError("Invalid input");
		}
	}

	public async removeDataset(id: string): Promise<string> {
		const notFound = 0;
		const foundLocal = 1;
		const foundDisk = 2;
		try {
			if (Validation.isValidStringRemove(id)) {
				const id2 = sanitizeFilename(id);
				switch (await Validation.savedDatasetRet(id2)) {
					case notFound:
						throw new NotFoundError("Dataset not found");
					case foundLocal:
						await Validation.removeDataset(id2, true);
						return id;
					case foundDisk:
						await Validation.removeDataset(id2, false);
						return id;
					default:
						throw new InsightError("Error in file operations");
				}
			} else {
				throw new InsightError("Invalid input");
			}
		} catch (e) {
			if (e instanceof NotFoundError || e instanceof InsightError) {
				throw e;
			} else {
				throw new InsightError("Error in file operations");
			}
		}
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		const queryData: QueryData = new QueryData(query);
		try {
			await queryData.validateQuery();
			return await queryData.doQuery();
		} catch (err) {
			if (err instanceof InsightError || err instanceof ResultTooLargeError) {
				throw err;
			} else {
				throw new InsightError();
			}
		}
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		const insightDatasets: InsightDataset[] = [...this.insightDatasets];
		let files: string[];
		try {
			files = await fs.readdir(Validation.dataFolder);
		} catch {
			return insightDatasets;
		}
		const zipFiles = files.filter((file) => path.extname(file).toLowerCase() === ".zip");
		const datasetPromises = zipFiles.map(async (file) => {
			try {
				const dataset = await Helper.processZipFile(file);
				if (dataset && !insightDatasets.some((ds) => ds.id === dataset.id)) {
					insightDatasets.push(dataset);
				}
			} catch {
				// skip file
			}
		});

		await Promise.all(datasetPromises);
		return insightDatasets;
	}
}
