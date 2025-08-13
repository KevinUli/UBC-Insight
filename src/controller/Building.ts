export class Building {
	private readonly fullname: string;
	private readonly shortname: string;
	private readonly address: string;
	private readonly lat: number;
	private readonly lon: number;
	private readonly link: string;
	private readonly sliceNum: number = 2;

	constructor(fullname: string, shortname: string, address: string, lat: number, lon: number, link: string) {
		this.fullname = fullname;
		this.shortname = shortname;
		this.address = address;
		this.lat = lat;
		this.lon = lon;
		this.link = link.slice(this.sliceNum);
	}

	public getFullname(): string {
		return this.fullname;
	}

	public getShortname(): string {
		return this.shortname;
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

	public getLink(): string {
		return this.link;
	}
}
