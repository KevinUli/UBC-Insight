import { InsightError, InsightResult } from "./IInsightFacade";
import { Data } from "./Data";

export class Section extends Data {
	private readonly uuid: string;
	private readonly id: string;
	private readonly title: string;
	private readonly instructor: string;
	private readonly dept: string;
	private readonly year: number;
	private readonly avg: number;
	private readonly pass: number;
	private readonly fail: number;
	private readonly audit: number;

	constructor(
		uuid: string,
		id: string,
		title: string,
		instructor: string,
		dept: string,
		year: number,
		avg: number,
		pass: number,
		fail: number,
		audit: number
	) {
		super();
		this.uuid = uuid;
		this.id = id;
		this.title = title;
		this.instructor = instructor;
		this.dept = dept;
		this.year = year;
		this.avg = avg;
		this.pass = pass;
		this.fail = fail;
		this.audit = audit;
	}

	public getUUID(): string {
		return this.uuid;
	}

	public getID(): string {
		return this.id;
	}

	public getTitle(): string {
		return this.title;
	}

	public getInstructor(): string {
		return this.instructor;
	}

	public getDept(): string {
		return this.dept;
	}

	public getYear(): number {
		return this.year;
	}

	public getAvg(): number {
		return this.avg;
	}

	public getPass(): number {
		return this.pass;
	}

	public getFail(): number {
		return this.fail;
	}

	public getAudit(): number {
		return this.audit;
	}

	public getData(column: string): string | number {
		switch (column) {
			case "uuid":
				return this.getUUID();
			case "id":
				return this.getID();
			case "title":
				return this.getTitle();
			case "instructor":
				return this.getInstructor();
			case "dept":
				return this.getDept();
			case "year":
				return this.getYear();
			case "avg":
				return this.getAvg();
			case "pass":
				return this.getPass();
			case "fail":
				return this.getFail();
			case "audit":
				return this.getAudit();
			default:
				throw new InsightError();
		}
	}

	public getDataObject(id: string): InsightResult {
		const sField = ["uuid", "id", "title", "instructor", "dept"];
		const mField = ["year", "avg", "pass", "fail", "audit"];
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

	// Checks if section is equal to given InsightResult
	public isEqual(otherObject: InsightResult, id: string): boolean {
		let isEqualFlag = true;
		const thisObject = this.getDataObject(id);
		const allField = ["uuid", "id", "title", "instructor", "dept", "year", "avg", "pass", "fail", "audit"];
		allField.forEach((columnName: string) => {
			const keyName = id + "_" + columnName;
			isEqualFlag = isEqualFlag && thisObject[keyName] === otherObject[keyName];
		});

		return isEqualFlag;
	}

	public toJSON(): object {
		return {
			id: this.uuid,
			Course: this.id,
			Title: this.title,
			Professor: this.instructor,
			Subject: this.dept,
			Year: this.year,
			Avg: this.avg,
			Pass: this.pass,
			Fail: this.fail,
			Audit: this.audit,
		};
	}
}
