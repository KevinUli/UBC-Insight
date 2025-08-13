import { IComparator } from "./IComparator";
import { InsightError, InsightResult } from "../../IInsightFacade";
import { QueryData, roomSField, sectionSField } from "../QueryData";
import assert from "node:assert";
import { Data } from "../../Data";

export class ISComparator implements IComparator {
	private key: string;
	private value: string;
	private hasFirstAsterisk: boolean;
	private hasSecondAsterisk: boolean;
	private queryData: QueryData | undefined;

	constructor() {
		this.key = "";
		this.value = "";
		this.hasFirstAsterisk = false;
		this.hasSecondAsterisk = false;
	}

	public setKey(key: string): void {
		this.key = key;
	}
	public setValue(value: string): void {
		this.value = value;
	}
	public setQueryData(item: QueryData): void {
		this.queryData = item;
	}

	public validateFields(): void {
		this.handleKey();
		this.handleValue();
	}

	// Gets dataset from key and filters it depending on column from key and value
	// Returns InsightResult[] of filtered dataset
	public filterDataset(): InsightResult[] {
		const ret: InsightResult[] = [];
		const id = this.queryData?.getDataset()?.getId();
		const unfilteredData = this.queryData?.getDataset()?.getData();
		if (!unfilteredData) {
			throw new InsightError();
		}
		unfilteredData.forEach((data: Data) => {
			if (this.sectionIsValid(data)) {
				assert(id);
				ret.push(data.getDataObject(id));
			}
		});
		return ret;
	}

	public sectionIsValid(data: Data): boolean {
		const [, column] = this.key.split("_");
		const columnData = String(data.getData(column));
		if (!this.hasFirstAsterisk && !this.hasSecondAsterisk) {
			if (columnData === this.value) {
				return true;
			}
		} else if (this.hasFirstAsterisk && !this.hasSecondAsterisk) {
			if (columnData.endsWith(this.value)) {
				return true;
			}
		} else if (!this.hasFirstAsterisk && this.hasSecondAsterisk) {
			if (columnData.startsWith(this.value)) {
				return true;
			}
		} else {
			if (columnData.includes(this.value)) {
				return true;
			}
		}
		return false;
	}

	private handleKey(): void {
		const [id, column, extra] = this.key.split("_");

		const validId = this.queryData?.getDataset()?.getId() === id;
		if (extra !== undefined || !validId || !(sectionSField.includes(column) || roomSField.includes(column))) {
			throw new InsightError();
		}
	}

	private handleValue(): void {
		const regex = /^\*?[^*]*\*?$/;
		if (!regex.test(this.value)) {
			throw new InsightError();
		}
		if (this.value.startsWith("*")) {
			this.hasFirstAsterisk = true;
			this.value = this.value.substring(1, this.value.length);
		}
		if (this.value.endsWith("*")) {
			this.hasSecondAsterisk = true;
			this.value = this.value.substring(0, this.value.length - 1);
		}
	}
}
