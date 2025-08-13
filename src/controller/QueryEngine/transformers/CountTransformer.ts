import { Transformers } from "./Transformers";
import { InsightError, InsightResult } from "../../IInsightFacade";
import { roomMField, roomSField, sectionMField, sectionSField } from "../QueryData";

export class CountTransformer extends Transformers {
	constructor() {
		super();
	}

	public transform(data: InsightResult[]): number {
		const resultSeen: (string | number)[] = [];
		let numRows = 0;
		data.forEach((item: InsightResult) => {
			if (!(this.transformColumn in item)) {
				throw new InsightError();
			}
			const newObs = item[this.transformColumn];
			if (!resultSeen.includes(newObs)) {
				numRows++;
				resultSeen.push(newObs);
			}
		});

		return numRows;
	}

	public validateFields(datasetId: string): void {
		const reg = /^[^_]+$/;
		if (!reg.test(this.resultColumn)) {
			throw new InsightError();
		}

		const [id, column, extra] = this.transformColumn.split("_");

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
		return;
	}
}
