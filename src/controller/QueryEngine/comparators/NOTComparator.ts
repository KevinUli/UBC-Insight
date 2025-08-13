import { IComparator } from "./IComparator";
import { InsightError, InsightResult } from "../../IInsightFacade";
import assert from "node:assert";
import { QueryData } from "../QueryData";
import { Data } from "../../Data";

export class NOTComparator implements IComparator {
	private filter: IComparator | undefined;
	private queryData: QueryData | undefined;

	public addFilter(comparator: IComparator): void {
		this.filter = comparator;
	}

	public setQueryData(queryData: QueryData): void {
		this.queryData = queryData;
	}

	public validateFields(): void {
		if (this.filter === undefined) {
			throw new InsightError();
		}
		if (this.filter === this) {
			throw new InsightError();
		}
		this.filter.validateFields();
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

	public sectionIsValid(data: Data): boolean {
		if (!this.filter || this.filter === this) {
			throw new InsightError();
		}
		return !this.filter?.sectionIsValid(data);
	}
}
