import JSZip from "jszip";
import { Dataset } from "./Dataset";
import path from "path";
import fs from "fs-extra";
import { InsightDataset, InsightError } from "./IInsightFacade";
import InsightFacade from "./InsightFacade";
import { Building } from "./Building";
import { Room } from "./Room";
import * as parse5 from "parse5";
import { Helper } from "./Helper";

export class Validation {
	public static readonly dataFolder: string = path.resolve(__dirname, "../../data");
	public static facade: InsightFacade;
	public static datasets: Dataset[] = [];
	private static teamNumber = 104;
	private static statusOkCode = 200;

	public static setFacade(facade: InsightFacade): void {
		Validation.facade = facade;
	}

	public static getDataset(id: string): Dataset | undefined {
		return Validation.datasets.find((dataset) => dataset.getId() === id);
	}

	public static pushDataset(set: Dataset): void {
		if (Validation.datasets.find((dataset) => dataset.getId() === set.getId())) {
			Validation.datasets.filter((dataset) => dataset.getId() !== set.getId());
			Validation.datasets.push(set);
		} else {
			Validation.datasets.push(set);
		}
	}

	public static async isValidStringAdd(str: string): Promise<boolean> {
		const regex = /^(?!.*_)\s*\S[\s\S]*$/;
		const containsDataset = await Validation.savedDataset(str);
		return regex.test(str) && !containsDataset;
	}

	public static isValidStringRemove(str: string): boolean {
		const regex = /^(?!.*_)\s*\S[\s\S]*$/;
		return regex.test(str);
	}

	public static async isValidSection(str: string): Promise<boolean> {
		try {
			const buff = Buffer.from(str, "base64");
			const zip = await JSZip.loadAsync(buff);
			const coursesFiles = Object.keys(zip.files).filter((fileName) => {
				return fileName.startsWith("courses/");
			});
			if (coursesFiles.length <= 1) {
				return false;
			}
			const promises = coursesFiles.map(async (fileName) => {
				const file = zip.file(fileName);
				return file?.async("string");
			});
			const fileContents = await Promise.all(promises);
			return Validation.checkContentsSections(fileContents);
		} catch {
			return false;
		}
	}

	public static async isValidRoom(str: string): Promise<boolean> {
		try {
			const zip = await JSZip.loadAsync(Buffer.from(str, "base64"));
			const file = zip.file("index.htm");
			if (!file) {
				return false;
			}
			const html = parse5.parse(await file.async("string"));
			const table = Validation.findTableWithSpecificTD(html, "views-field-title");
			if (!table) {
				return false;
			}

			const buildings = await Validation.parseBuildingTable(table);
			if (buildings.length === 0) {
				return false;
			}

			// Use the helper method for each building
			const buildingPromises = buildings.map(async (building) => Validation.hasRoomsInBuilding(zip, building));

			await Promise.any(buildingPromises);
			return true;
		} catch {
			return false;
		}
	}

	private static async hasRoomsInBuilding(zip: JSZip, building: Building): Promise<boolean> {
		const buildingFile = zip.file(building.getLink());
		if (!buildingFile) {
			throw new InsightError("File not found");
		}

		const buildingContent = await buildingFile.async("string");
		const buildingHTML = parse5.parse(buildingContent);
		const roomTable = Validation.findTableWithSpecificTD(buildingHTML, "views-field-field-room-number");
		if (!roomTable) {
			throw new InsightError("Room table not found");
		}

		const rooms = await Validation.parseRoomTable(roomTable, building);
		return rooms.length > 0;
	}

	public static async parseRoomTable(table: any, building: Building): Promise<Room[]> {
		const tbody = table.childNodes.find((node: any) => node.nodeName === "tbody");
		if (!tbody) {
			return [];
		}

		const trNodes = tbody.childNodes.filter((node: any) => node.nodeName === "tr");
		const roomPromises = trNodes.map(async (tr: any) => {
			try {
				return await this.parseRoomRow(tr, building);
			} catch {
				// skip invalid room
			}
		});

		const roomResults = await Promise.all(roomPromises);
		return roomResults.filter((room): room is Room => room !== undefined);
	}

	private static async parseRoomRow(tr: any, building: Building): Promise<Room | undefined> {
		const tds = tr.childNodes.filter((node: any) => node.nodeName === "td");

		// Extract the specific <td> elements
		const numTD = tds.find((node: any) => Helper.checkTD(node, "views-field-field-room-number"));
		const capacityTD = tds.find((node: any) => Helper.checkTD(node, "views-field-field-room-capacity"));
		const furnitureTD = tds.find((node: any) => Helper.checkTD(node, "views-field-field-room-furniture"));
		const typeTD = tds.find((node: any) => Helper.checkTD(node, "views-field-field-room-type"));
		const hrefTD = tds.find((node: any) => Helper.checkTD(node, "views-field-nothing"));

		// Ensure that the required <td> cells exist
		if (!numTD || !capacityTD || !furnitureTD || !typeTD || !hrefTD) {
			throw new InsightError("Missing required elements");
		}

		// Extract text and references (allowing empty strings)
		const num = Helper.extractText(numTD);
		const capacity = Helper.extractText(capacityTD);
		const furniture = Helper.extractText(furnitureTD);
		const type = Helper.extractText(typeTD);
		const href = Helper.extractRef(hrefTD);

		return new Room(
			building.getFullname(),
			building.getShortname(),
			num,
			building.getAddress(),
			building.getLat(),
			building.getLon(),
			Number(capacity),
			type,
			furniture,
			href
		);
	}

	public static async parseBuildingTable(table: any): Promise<Building[]> {
		const buildings: Building[] = [];
		const tbody = table.childNodes.find((node: any) => node.nodeName === "tbody");
		if (!tbody) {
			return buildings;
		}
		const trNodes = tbody.childNodes.filter((node: any) => node.nodeName === "tr");
		const buildingPromises = trNodes.map(async (tr: any) => {
			try {
				const tds = tr.childNodes.filter((node: any) => node.nodeName === "td");

				const codeTD = tds.find((node: any) => Helper.checkTD(node, "views-field-field-building-code"));
				const titleTD = tds.find((node: any) => Helper.checkTD(node, "views-field-title"));
				const addressTD = tds.find((node: any) => Helper.checkTD(node, "views-field-field-building-address"));

				if (codeTD === undefined || titleTD === undefined || addressTD === undefined) {
					throw new InsightError("Missing required elements");
				}

				const code = Helper.extractText(codeTD);
				const title = Helper.extractText(titleTD);
				const address = Helper.extractText(addressTD);
				const link = Helper.extractLink(titleTD);

				const encodedAddress = encodeURIComponent(address);
				const url = `http://cs310.students.cs.ubc.ca:11316/api/v1/project_team${this.teamNumber}/${encodedAddress}`;

				const geoResponse = await Helper.httpGet(url);
				if (geoResponse.lat !== undefined && geoResponse.lon !== undefined) {
					const building = new Building(title, code, address, geoResponse.lat, geoResponse.lon, link);
					buildings.push(building);
				}
			} catch {
				// skip invalid building
			}
		});
		await Promise.all(buildingPromises);
		return buildings;
	}

	public static findTableWithSpecificTD(node: any, targetClass: string): any | null {
		if (node.nodeName === "table") {
			if (Validation.tableContainsTDWithClass(node, targetClass)) {
				return node;
			}
		}

		if (node.childNodes && Array.isArray(node.childNodes)) {
			for (const child of node.childNodes) {
				const result = Validation.findTableWithSpecificTD(child, targetClass);
				if (result) {
					return result;
				}
			}
		}

		return null;
	}

	private static tableContainsTDWithClass(table: any, targetClass: string): boolean {
		const stack: any[] = table.childNodes ? [...table.childNodes] : [];

		while (stack.length > 0) {
			const current = stack.pop();
			if (!current) {
				continue;
			}

			if (current.nodeName === "td") {
				if (Helper.checkTD(current, targetClass)) {
					return true;
				}
			}

			if (current.childNodes && Array.isArray(current.childNodes)) {
				stack.push(...current.childNodes);
			}
		}

		return false;
	}

	public static checkItemSections(item: any): boolean {
		const stringProps = ["id", "Course", "Title", "Professor", "Subject"];
		for (const prop of stringProps) {
			if (item[prop] === undefined || item[prop] === null) {
				return false;
			}
		}
		const numberProps = ["Year", "Avg", "Pass", "Fail", "Audit"];
		for (const prop of numberProps) {
			const num = Number(item[prop]);
			if (!Number.isFinite(num)) {
				return false;
			}
		}
		return true;
	}

	public static async savedDataset(id: string): Promise<boolean> {
		if (!this.facade.containsDataset(id)) {
			try {
				const dataset = await Helper.processZipFileDataset(`${id}.zip`);
				if (!dataset) {
					return false;
				}
				Validation.pushDataset(dataset);
				return true;
			} catch {
				return false;
			}
		}
		return true;
	}

	// return 0 for not found, 1 for in list, 2 for in file
	public static async savedDatasetRet(id: string): Promise<number> {
		const inFile = 2;
		if (!this.facade.containsDataset(id)) {
			try {
				const dataset = await Helper.processZipFileDataset(`${id}.zip`);
				if (dataset) {
					return inFile;
				} else {
					return 0;
				}
			} catch {
				return 0;
			}
		}
		return 1;
	}

	public static async removeDataset(id: string, local: boolean): Promise<void> {
		if (local) {
			this.facade.insightDatasets = this.facade.insightDatasets.filter((dataset) => dataset.id !== id);
		}
		Validation.datasets = Validation.datasets.filter((dataset) => dataset.getId() !== id);
		const file = path.resolve(Validation.dataFolder, `${id}.zip`);
		try {
			await fs.unlink(file);
		} catch {
			if (!local) {
				throw new Error("Error deleting file");
			}
		}
	}

	private static checkContentsSections(fileContents: (string | undefined)[]): boolean {
		for (const content of fileContents) {
			let jsonData;
			if (content !== undefined) {
				try {
					jsonData = JSON.parse(content);
				} catch {
					continue;
				}
				const result = jsonData.result;
				if (Array.isArray(result)) {
					for (const item of result) {
						if (Validation.checkItemSections(item)) {
							return true;
						}
					}
				}
			}
		}
		return false;
	}

	public static toInsightDatasetObject(dataset: Dataset): InsightDataset {
		return {
			id: dataset.getId(),
			kind: dataset.getKind(),
			numRows: dataset.getNumRows(),
		};
	}
}
