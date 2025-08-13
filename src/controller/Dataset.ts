import { InsightDatasetKind, InsightError } from "./IInsightFacade";
import { Section } from "./Section";
import JSZip from "jszip";
import path from "path";
import fs from "fs-extra";
import { Data } from "./Data";
import { Room } from "./Room";

export class Dataset {
	private readonly id: string;
	private readonly kind: InsightDatasetKind;
	private readonly numRows: number;
	private readonly data: Data[];
	private readonly outputDir: string = path.resolve(__dirname, "../../data");
	constructor(id: string, kind: InsightDatasetKind, numRows: number, data: Data[]) {
		this.id = id;
		this.kind = kind;
		this.numRows = numRows;
		this.data = data;
	}

	public getId(): string {
		return this.id;
	}
	public getKind(): InsightDatasetKind {
		return this.kind;
	}
	public getNumRows(): number {
		return this.numRows;
	}
	public getData(): Data[] {
		return this.data;
	}

	public toString(): string {
		let dataString = "";
		this.data.forEach((section) => {
			dataString += section.toString() + ",";
		});
		dataString = dataString.slice(0, -1);
		return `{section:[${dataString}]}`;
	}

	public async writeToDiskSection(): Promise<void> {
		const indent = 2;
		try {
			await fs.mkdir(this.outputDir, { recursive: true });
			const zip = new JSZip();
			const courses = zip.folder("courses");
			if (!courses) {
				throw new InsightError("Error creating folder");
			}
			const results = this.data.map((section) => (section instanceof Section ? section.toJSON() : {}));
			let jsonContent = JSON.stringify({ result: results }, null, indent);
			jsonContent = jsonContent.replace(/\n/g, "\r\n");
			courses.file("results.json", jsonContent);
			const zipContent = await zip.generateAsync({ type: "nodebuffer" });
			const zipPath = path.resolve(this.outputDir, `${this.id}.zip`);
			await fs.writeFile(zipPath, zipContent);
		} catch (error) {
			throw new InsightError("Error writing to disk" + error);
		}
	}

	public async writeToDiskRoom(): Promise<void> {
		const indent = 2;
		try {
			await fs.mkdir(this.outputDir, { recursive: true });
			const zip = new JSZip();
			const rooms = zip.folder("rooms");
			if (!rooms) {
				throw new InsightError("Error creating folder");
			}
			const results = this.data.map((room) => (room instanceof Room ? room.toJSON() : {}));
			let jsonContent = JSON.stringify({ result: results }, null, indent);
			jsonContent = jsonContent.replace(/\n/g, "\r\n");
			rooms.file("results.json", jsonContent);
			const zipContent = await zip.generateAsync({ type: "nodebuffer" });
			const zipPath = path.resolve(this.outputDir, `${this.id}.zip`);
			await fs.writeFile(zipPath, zipContent);
		} catch (error) {
			throw new InsightError("Error writing to disk" + error);
		}
	}
}
