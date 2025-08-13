import { Transformers } from "./Transformers";
import { InsightError, InsightResult } from "../../IInsightFacade";

export class SumTransformer extends Transformers {
	constructor() {
		super();
	}

	public transform(data: InsightResult[]): number {
		const precision = 2;
		let total = 0;
		data.forEach((item: InsightResult) => {
			if (!(this.transformColumn in item)) {
				throw new InsightError();
			}
			total = total + Number(item[this.transformColumn]);
			// add(new Decimal(item[this.transformColumn]))
		});

		return Number(total.toFixed(precision));
	}
}
