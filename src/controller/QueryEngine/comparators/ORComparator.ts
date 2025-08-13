import { IComparator } from "./IComparator";
import { LogicComparator } from "./LogicComparator";
import { InsightError } from "../../IInsightFacade";
import { Data } from "../../Data";

export class ORComparator extends LogicComparator implements IComparator {
	constructor() {
		super();
	}

	public sectionIsValid(data: Data): boolean {
		let validSection = false;
		this.filterList.forEach((filter: IComparator) => {
			if (filter === this) {
				throw new InsightError();
			}
			validSection = validSection || filter.sectionIsValid(data);
		});
		return validSection;
	}
}
