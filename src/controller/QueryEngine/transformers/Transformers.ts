import { InsightError, InsightResult } from "../../IInsightFacade";
import { roomMField, sectionMField } from "../QueryData";

export abstract class Transformers {
	protected transformColumn: string;
	protected resultColumn: string;

	protected constructor() {
		this.transformColumn = "";
		this.resultColumn = "";
	}

	/**
	 * @requires data to have all columns other than the transformColumn to be grouped (the same value)
	 *
	 * @return InsightResult
	 *
	 * Transforms the given data based on the transformer returning one instance of InsightResult with
	 * grouped column values and the transformed value in column named resultColumn
	 */
	public abstract transform(data: InsightResult[]): number;

	/**
	 * Validates all fields within the comparator
	 *
	 * @return void
	 *
	 * Throws InsightError if field is not valid
	 */
	public validateFields(datasetId: string): void {
		const reg = /^[^_]+$/;
		if (!reg.test(this.resultColumn)) {
			throw new InsightError();
		}

		const [id, column, extra] = this.transformColumn.split("_");

		if (
			extra !== undefined ||
			!(id === datasetId) ||
			!(sectionMField.includes(column) || roomMField.includes(column))
		) {
			throw new InsightError();
		}
		return;
	}

	/**
	 * Sets column to transform
	 *
	 * @return void
	 *
	 * Throws InsightError if field is not valid
	 */
	public setTransformColumn(transformColumn: string): void {
		this.transformColumn = transformColumn;
	}

	/**
	 * Sets resulting column after transformation
	 *
	 * @return void
	 */
	public setResultColumn(resultColumn: string): void {
		this.resultColumn = resultColumn;
	}

	public getResultColumn(): string {
		return this.resultColumn;
	}
}
