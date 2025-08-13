import { Transformers } from "./Transformers";
import { InsightError, InsightResult } from "../../IInsightFacade";

export class MaxTransformer extends Transformers {
	constructor() {
		super();
	}

	public transform(data: InsightResult[]): number {
		if (!(this.transformColumn in data[0])) {
			throw new InsightError();
		}
		let maxSoFar = Number(data[0][this.transformColumn]);
		data.forEach((item: InsightResult) => {
			if (!(this.transformColumn in item)) {
				throw new InsightError();
			}
			if (maxSoFar < Number(item[this.transformColumn])) {
				maxSoFar = Number(item[this.transformColumn]);
			}
		});

		return maxSoFar;
	}
}
