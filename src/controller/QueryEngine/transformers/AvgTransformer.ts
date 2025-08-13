import { Transformers } from "./Transformers";
import { InsightError, InsightResult } from "../../IInsightFacade";
import Decimal from "decimal.js";

export class AvgTransformer extends Transformers {
	constructor() {
		super();
	}

	public transform(data: InsightResult[]): number {
		const precision = 2;
		let total = new Decimal(0);
		let numRows = 0;
		data.forEach((item: InsightResult) => {
			if (!(this.transformColumn in item)) {
				throw new InsightError();
			}

			total = total.add(new Decimal(item[this.transformColumn]));
			numRows++;
		});

		const avg = total.toNumber() / numRows;
		return Number(avg.toFixed(precision));
	}
}
