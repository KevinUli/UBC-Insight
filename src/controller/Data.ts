import { InsightResult } from "./IInsightFacade";

export abstract class Data {
	public abstract getData(column: string): string | number;
	public abstract getDataObject(id: string): InsightResult;
}
