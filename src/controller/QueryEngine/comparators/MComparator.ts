import { IComparator } from "./IComparator";
import { InsightError, InsightResult } from "../../IInsightFacade";
import { QueryData, roomMField, sectionMField } from "../QueryData";
import assert from "node:assert";
import { Data } from "../../Data";

export abstract class MComparator implements IComparator {
	protected key: string;
	protected value: number;
	protected queryData: QueryData | undefined;

	protected constructor() {
		this.key = "";
		this.value = 0;
	}

	public setKey(key: string): void {
		this.key = key;
	}
	public setValue(value: number): void {
		this.value = value;
	}
	public setQueryData(item: QueryData): void {
		this.queryData = item;
	}

	public validateFields(): void {
		this.handleKey();
	}

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

	public abstract sectionIsValid(data: Data): boolean;

	private handleKey(): void {
		const [id, column, extra] = this.key.split("_");

		const validId = this.queryData?.getDataset()?.getId() === id;
		if (extra !== undefined || !validId || !(sectionMField.includes(column) || roomMField.includes(column))) {
			throw new InsightError();
		}
	}
}
