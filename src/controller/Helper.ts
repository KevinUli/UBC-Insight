import http from "http";
import { InsightDataset, InsightDatasetKind, InsightError } from "./IInsightFacade";
import path from "path";
import { Validation } from "./Validation";
import fs from "fs-extra";
import JSZip from "jszip";
import { Parse } from "./Parse";
import { restoreFilename } from "./Sanitizer";
import { Dataset } from "./Dataset";
interface GeoResponse {
	lat?: number;
	lon?: number;
	error?: string;
}

export class Helper {
	private static statusOkCode = 200;
	public static extractLink(node: any): string {
		if (node?.childNodes) {
			for (const child of node.childNodes) {
				if (child.tagName === "a") {
					const hrefAttr = child.attrs.find((attr: any) => attr.name === "href");
					if (hrefAttr) {
						return hrefAttr.value;
					}
				}
			}
		}
		return "";
	}
	public static async httpGet(url: string): Promise<GeoResponse> {
		return new Promise((resolve, reject) => {
			http
				.get(url, (res) => {
					const { statusCode } = res;
					const contentType = res.headers["content-type"] || "";

					// Combine status code and content type checks
					if (statusCode !== this.statusOkCode || !/^application\/json/.test(contentType)) {
						res.resume(); // Consume response data to free up memory
						return reject(
							new Error(`Request Failed. Status Code: ${statusCode},
						Content-Type: ${contentType}`)
						);
					}

					let rawData = "";
					res.setEncoding("utf8");
					res
						.on("data", (chunk) => (rawData += chunk))
						.on("end", () => {
							try {
								resolve(JSON.parse(rawData));
							} catch {
								reject(new Error("Failed to parse JSON response"));
							}
						});
				})
				.on("error", reject); // Directly pass the error to reject
		});
	}

	public static checkTD(td: any, targetClass: string): boolean {
		if (!td.attrs || !Array.isArray(td.attrs)) {
			return false;
		}

		const classAttr = td.attrs.find((attr: any) => attr.name === "class");
		if (!classAttr) {
			return false;
		}

		const classes = classAttr.value.split(/\s+/);
		return classes.includes(targetClass);
	}

	public static extractText(node: any): string {
		let text = "";
		if (node?.childNodes) {
			node.childNodes.forEach((child: any) => {
				if (child.nodeName === "#text") {
					text += child.value.trim() + " ";
				} else {
					text += this.extractText(child);
				}
			});
		}
		return text.trim();
	}

	public static extractRef(node: any): string {
		if (!node) {
			return "";
		}

		// Find the <a> tag within the node
		const aTag = node.childNodes.find((child: any) => child.nodeName === "a");
		if (aTag?.attrs) {
			const hrefAttr = aTag.attrs.find((attr: any) => attr.name === "href");
			if (hrefAttr) {
				return hrefAttr.value;
			}
		}

		return "";
	}

	public static async processZipFile(file: string): Promise<InsightDataset> {
		try {
			const id = restoreFilename(path.basename(file, ".zip"));
			if (!Validation.isValidStringRemove(id)) {
				throw new InsightError("Invalid id");
			}

			const filePath = path.resolve(Validation.dataFolder, file);
			const buffer = await fs.readFile(filePath);
			const zipFile = await JSZip.loadAsync(buffer);
			const hasCourses = zipFile.folder(/courses/).length > 0;
			const hasRooms = zipFile.folder(/rooms/).length > 0;

			if (!hasCourses && !hasRooms) {
				throw new InsightError("Invalid zip file");
			}

			const [kind, numRows] = hasCourses
				? [InsightDatasetKind.Sections, (await Parse.parseContentSection(buffer.toString("base64"))).length]
				: [InsightDatasetKind.Rooms, (await Parse.parseDiskRoom(buffer.toString("base64"))).length];

			return { id, kind, numRows };
		} catch {
			throw new InsightError("Error processing zip file");
		}
	}

	public static async processZipFileDataset(file: string): Promise<Dataset> {
		try {
			const id = restoreFilename(path.basename(file, ".zip"));

			const filePath = path.resolve(Validation.dataFolder, file);
			const buffer = await fs.readFile(filePath);
			const zip = await JSZip.loadAsync(buffer);
			const hasCourses = zip.folder(/courses/).length > 0;

			const kind = hasCourses ? InsightDatasetKind.Sections : InsightDatasetKind.Rooms;
			const parsedData = hasCourses
				? await Parse.parseContentSection(buffer.toString("base64"))
				: await Parse.parseDiskRoom(buffer.toString("base64"));

			const numRows = parsedData.length;

			return new Dataset(id, kind, numRows, parsedData);
		} catch {
			throw new InsightError("Error processing zip file");
		}
	}
}
