import { InsightResult } from "../../IInsightFacade";
import { Data } from "../../Data";

export interface IComparator {
	/**
	 * Validates all fields within the comparator
	 *
	 * @return void
	 *
	 * Throws InsightError if field is not valid
	 */
	validateFields(): void;

	/**
	 * Runs comparator on dataset determined in the class field
	 * Assumes validateFields has been called and no errors are thrown
	 *
	 *
	 * @return InsightResult[]
	 *
	 * Returns array of InsightResult of rows in dataset fulfilling comparator condition(s)
	 */
	filterDataset(): InsightResult[];

	/**
	 * Checks if section is valid
	 *
	 *
	 * @return boolean
	 *
	 * Returns true if section is a valid section depending on comparator
	 */
	sectionIsValid(data: Data): boolean;
}
