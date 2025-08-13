import { Transformers } from "./transformers/Transformers";
import { ComparatorTransformerProvider } from "./ComparatorTransformerProvider";
import { InsightError, InsightResult } from "../IInsightFacade";
import { roomMField, roomSField, sectionMField, sectionSField } from "./QueryData";

export class TransformationHandler {
	private groups: string[];
	private transformers: Transformers[];
	private seenResultColumn: string[];
	private groupBuckets: Record<string, InsightResult[]>;

	constructor() {
		this.groups = [];
		this.transformers = [];
		this.seenResultColumn = [];
		this.groupBuckets = {};
	}

	public setGroup(groups: string[]): void {
		this.groups = groups;
	}

	public addTransformer(resultColumn: string, transformKey: string, transformColumn: string): void {
		if (this.seenResultColumn.includes(resultColumn)) {
			throw new InsightError();
		}
		const newTransformer: Transformers = ComparatorTransformerProvider.getNewTransformer(transformKey);

		newTransformer.setTransformColumn(transformColumn);
		newTransformer.setResultColumn(resultColumn);
		this.seenResultColumn.push(resultColumn);
		this.transformers.push(newTransformer);
	}

	public validateFields(id: string | undefined): void {
		if (!id) {
			throw new InsightError();
		}
		this.groups.forEach((item: string) => {
			this.validateGroup(item, id);
		});
		this.transformers.forEach((transformer: Transformers) => {
			transformer.validateFields(id);
		});
	}

	public groupTransform(data: InsightResult[]): InsightResult[] {
		this.handleGroupData(data);
		let ret: InsightResult[] = [];
		Object.keys(this.groupBuckets).forEach((key: string) => {
			const newResult: InsightResult = {};
			this.groups.forEach((groupedColumn: string) => {
				newResult[groupedColumn] = this.groupBuckets[key][0][groupedColumn];
			});
			this.transformers.forEach((transformer: Transformers) => {
				newResult[transformer.getResultColumn()] = transformer.transform(this.groupBuckets[key]);
			});
			ret = ret.concat(newResult);
		});
		return ret;
	}

	public getResultColumns(): string[] {
		return this.groups.concat(this.seenResultColumn);
	}

	private handleGroupData(data: InsightResult[]): void {
		data.forEach((item: InsightResult) => {
			let bucketKey = "";
			this.groups.forEach((column: string) => {
				if (!(column in item)) {
					throw new InsightError();
				}
				bucketKey = bucketKey + String(item[column]);
			});
			if (!(bucketKey in this.groupBuckets)) {
				this.groupBuckets[bucketKey] = [item];
			} else {
				this.groupBuckets[bucketKey] = this.groupBuckets[bucketKey].concat(item);
			}
		});
	}

	private validateGroup(key: string, datasetId: string): void {
		const [id, column, extra] = key.split("_");

		if (
			extra !== undefined ||
			!(id === datasetId) ||
			!(
				sectionSField.includes(column) ||
				sectionMField.includes(column) ||
				roomSField.includes(column) ||
				roomMField.includes(column)
			)
		) {
			throw new InsightError();
		}
	}
}
