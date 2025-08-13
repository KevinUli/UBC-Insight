import JSZip from "jszip";
import { Validation } from "./Validation";
import { Section } from "./Section";
import { Room } from "./Room";
import * as parse5 from "parse5";
import { Building } from "./Building";
import { InsightError } from "./IInsightFacade";

export class Parse {
	public static parseSection(section: any): Section {
		let year;
		const val = 1900;
		if (section.Section === "overall") {
			year = val;
		} else {
			year = section.Year;
		}

		return new Section(
			section.id,
			section.Course,
			section.Title,
			section.Professor,
			section.Subject,
			year,
			section.Avg,
			section.Pass,
			section.Fail,
			section.Audit
		);
	}

	public static async parseContentSection(content: string): Promise<Section[]> {
		const sections: Section[] = [];
		const buff = Buffer.from(content, "base64");
		const zip = await JSZip.loadAsync(buff);
		const coursesFiles = Object.keys(zip.files).filter((fileName) => {
			return fileName.startsWith("courses/");
		});
		const promises = coursesFiles.map(async (fileName) => {
			const file = zip.file(fileName);
			return file?.async("string");
		});
		const fileContents = await Promise.all(promises);
		for (const section of fileContents) {
			if (section !== undefined) {
				try {
					const jsonData = JSON.parse(section);
					const result = jsonData.result;
					if (Array.isArray(result)) {
						for (const item of result) {
							if (Validation.checkItemSections(item)) {
								sections.push(Parse.parseSection(item));
							}
						}
					}
				} catch {
					// skip invalid section
				}
			}
		}
		return sections;
	}

	public static async parseDiskRoom(content: string): Promise<Room[]> {
		const buff = Buffer.from(content, "base64");
		const zip = await JSZip.loadAsync(buff);
		const roomsFolder = zip.folder("rooms");
		if (!roomsFolder) {
			throw new InsightError("No rooms folder found");
		}
		const results = roomsFolder.file("results.json");
		if (!results) {
			throw new InsightError("No results.json found");
		}
		const jsonContent = await results.async("string");
		const parsed = JSON.parse(jsonContent);
		if (!parsed.result || !Array.isArray(parsed.result)) {
			throw new InsightError("Invalid JSON structure in results.json.");
		}
		return parsed.result.map((roomData: any) => {
			try {
				return new Room(
					roomData.fullname,
					roomData.shortname,
					roomData.number,
					roomData.address,
					roomData.lat,
					roomData.lon,
					roomData.seats,
					roomData.type,
					roomData.furniture,
					roomData.href
				);
			} catch {
				// skip invalid room
			}
		});
	}

	public static async parseContentRoom(content: string): Promise<Room[]> {
		try {
			const buff = Buffer.from(content, "base64");
			const zip = await JSZip.loadAsync(buff);
			const index = zip.file("index.htm");
			if (index === null) {
				throw new InsightError("No index.htm found");
			}
			const html = parse5.parse(await index?.async("text"));
			const buildingTable = Validation.findTableWithSpecificTD(html, "views-field-title");
			if (buildingTable === null) {
				throw new InsightError("No building table found");
			}
			const buildings = await Validation.parseBuildingTable(buildingTable);
			const promises = buildings.map(async (building) => {
				return Parse.parseRoomsForBuilding(zip, building);
			});
			const roomsForBuildings = await Promise.all(promises);
			return roomsForBuildings.flat();
		} catch {
			throw new InsightError("Error parsing HTML");
		}
	}

	private static async parseRoomsForBuilding(zip: JSZip, building: Building): Promise<Room[]> {
		const rooms: Room[] = [];
		const buildingFile = zip.file(building.getLink());
		if (!buildingFile) {
			return rooms;
		}

		const buildingContent = await buildingFile.async("string");
		const buildingHTML = parse5.parse(buildingContent);
		const roomTable = Validation.findTableWithSpecificTD(buildingHTML, "views-field-field-room-number");
		if (!roomTable) {
			return rooms;
		}

		const roomRows = await Validation.parseRoomTable(roomTable, building);
		rooms.push(...roomRows);
		return rooms;
	}
}
