import { IComparator } from "./IComparator";
import { MComparator } from "./MComparator";
import { Data } from "../../Data";

export class GTComparator extends MComparator implements IComparator {
	constructor() {
		super();
	}

	public sectionIsValid(data: Data): boolean {
		const [, column] = this.key.split("_");
		const columnData = Number(data.getData(column));
		return columnData > this.value;
	}
}
