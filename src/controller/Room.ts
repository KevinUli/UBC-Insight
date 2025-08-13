import { Data } from "./Data";
import { InsightError, InsightResult } from "./IInsightFacade";

export class Room extends Data {
	private readonly fullname: string;
	private readonly shortname: string;
	private readonly number: string;
	private readonly name: string;
	private readonly address: string;
	private readonly lat: number;
	private readonly lon: number;
	private readonly seats: number;
	private readonly type: string;
	private readonly furniture: string;
	private readonly href: string;

	constructor(
		fullname: string,
		shortname: string,
		number: string,
		address: string,
		lat: number,
		lon: number,
		seats: number,
		type: string,
		furniture: string,
		href: string
	) {
		super();
		this.fullname = fullname;
		this.shortname = shortname;
		this.number = number;
		this.name = shortname + "_" + number;
		this.address = address;
		this.lat = lat;
		this.lon = lon;
		this.seats = seats;
		this.type = type;
		this.furniture = furniture;
		this.href = href;
	}

	public getFullname(): string {
		return this.fullname;
	}

	public getShortname(): string {
		return this.shortname;
	}

	public getNumber(): string {
		return this.number;
	}

	public getName(): string {
		return this.name;
	}

	public getAddress(): string {
		return this.address;
	}

	public getLat(): number {
		return this.lat;
	}

	public getLon(): number {
		return this.lon;
	}

	public getSeats(): number {
		return this.seats;
	}

	public getType(): string {
		return this.type;
	}

	public getFurniture(): string {
		return this.furniture;
	}

	public getHref(): string {
		return this.href;
	}

	public getData(column: string): string | number {
		switch (column) {
			case "fullname":
				return this.getFullname();
			case "shortname":
				return this.getShortname();
			case "number":
				return this.getNumber();
			case "name":
				return this.getName();
			case "address":
				return this.getAddress();
			case "lat":
				return this.getLat();
			case "lon":
				return this.getLon();
			case "seats":
				return this.getSeats();
			case "type":
				return this.getType();
			case "furniture":
				return this.getFurniture();
			case "href":
				return this.getHref();
			default:
				throw new InsightError();
		}
	}

	public getDataObject(id: string): InsightResult {
		const sField = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
		const mField = ["lat", "lon", "seats"];
		const ret: InsightResult = {};
		sField.forEach((columnName: string) => {
			const keyName = id + "_" + columnName;
			ret[keyName] = String(this.getData(columnName));
		});

		mField.forEach((columnName: string) => {
			const keyName = id + "_" + columnName;
			ret[keyName] = Number(this.getData(columnName));
		});

		return ret;
	}

	public toJSON(): object {
		return {
			fullname: this.getFullname(),
			shortname: this.getShortname(),
			number: this.getNumber(),
			name: this.getName(),
			address: this.getAddress(),
			lat: this.getLat(),
			lon: this.getLon(),
			seats: this.getSeats(),
			type: this.getType(),
			furniture: this.getFurniture(),
			href: this.getHref(),
		};
	}
}
