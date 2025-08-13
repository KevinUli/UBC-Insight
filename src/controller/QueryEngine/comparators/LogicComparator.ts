import { IComparator } from "./IComparator";
import { InsightError, InsightResult } from "../../IInsightFacade";
import assert from "node:assert";
import { QueryData } from "../QueryData";
import { Data } from "../../Data";

export abstract class LogicComparator implements IComparator {
	protected filterList: IComparator[];
	protected queryData: QueryData | undefined;

	protected constructor() {
		this.filterList = [];
	}

	// Assume given comparator is valid
	public addFilter(comparator: IComparator): void {
		this.filterList.push(comparator);
	}

	public validateFields(): void {
		if (this.filterList.length === 0) {
			throw new InsightError();
		}
		this.filterList.forEach((comparator: IComparator) => {
			if (comparator === this) {
				throw new InsightError();
			}
			comparator.validateFields();
		});
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

	public setQueryData(item: QueryData): void {
		this.queryData = item;
	}
}
