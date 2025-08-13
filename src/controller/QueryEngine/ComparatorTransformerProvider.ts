import { IComparator } from "./comparators/IComparator";
import { ISComparator } from "./comparators/ISComparator";
import { LTComparator } from "./comparators/LTComparator";
import { GTComparator } from "./comparators/GTComparator";
import { EQComparator } from "./comparators/EQComparator";
import { NOTComparator } from "./comparators/NOTComparator";
import { ORComparator } from "./comparators/ORComparator";
import { ANDComparator } from "./comparators/ANDComparator";
import { InsightError } from "../IInsightFacade";
import { Transformers } from "./transformers/Transformers";
import { MaxTransformer } from "./transformers/MaxTransformer";
import { MinTransformer } from "./transformers/MinTransformer";
import { SumTransformer } from "./transformers/SumTransformer";
import { CountTransformer } from "./transformers/CountTransformer";
import { AvgTransformer } from "./transformers/AvgTransformer";

export class ComparatorTransformerProvider {
	public static getNewComparator(key: string): IComparator {
		switch (key) {
			case "IS":
				return new ISComparator();
			case "LT":
				return new LTComparator();
			case "GT":
				return new GTComparator();
			case "EQ":
				return new EQComparator();
			case "NOT":
				return new NOTComparator();
			case "OR":
				return new ORComparator();
			case "AND":
				return new ANDComparator();

			default:
				throw new InsightError();
		}
	}

	public static getNewTransformer(key: string): Transformers {
		switch (key) {
			case "MAX":
				return new MaxTransformer();
			case "MIN":
				return new MinTransformer();
			case "AVG":
				return new AvgTransformer();
			case "SUM":
				return new SumTransformer();
			case "COUNT":
				return new CountTransformer();

			default:
				throw new InsightError();
		}
	}
}
