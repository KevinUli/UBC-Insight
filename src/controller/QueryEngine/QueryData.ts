import { IComparator } from "./comparators/IComparator";
import { InsightError, InsightResult, ResultTooLargeError } from "../IInsightFacade";
import { OptionsHandler } from "./OptionsHandler";
import { Validation } from "../Validation";
import { Dataset } from "../Dataset";
import { ValidParse } from "./ValidParse";
import { TransformationHandler } from "./TransformationHandler";
import { Data } from "../Data";

const queryObjectNumKeysWithTransform = 3;
const queryObjectNumKeysWithoutTransform = 2;
const maxQueryResult = 5000;

export const sectionSField = ["dept", "id", "instructor", "title", "uuid"];
export const sectionMField = ["avg", "pass", "fail", "audit", "year"];
export const roomSField = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
export const roomMField = ["lat", "lon", "seats"];

export class QueryData {
	private readonly queryObject: unknown;
	private comparator: IComparator | undefined;
	private validParseHandler: ValidParse;
	private readonly optionsHandler: OptionsHandler;
	private readonly transformHandler: TransformationHandler;
	private dataset: Dataset | undefined;
	private hasTransform: boolean;

	// Constructor for QueryData
	// Requires: queryObject be of type Object
	constructor(queryObject: unknown) {
		this.queryObject = queryObject;
		this.validParseHandler = new ValidParse(this);
		this.optionsHandler = new OptionsHandler(this);
		this.transformHandler = new TransformationHandler();
		this.hasTransform = false;
	}

	// Validates queryObject stored in this instance of the class and
	// updates isValidFlag based on whether the queryObject is valid
	public async validateQuery(): Promise<void> {
		// Check number of keys in queryObject
		if (!(this.queryObject instanceof Object)) {
			throw new InsightError();
		}
		try {
			await this.validParseHandler.handleWhere(this.queryObject);
		} catch (err) {
			throw new InsightError(String(err));
		}
		this.validParseHandler.handleOptions(this.queryObject, this.optionsHandler);

		if ("TRANSFORMATIONS" in this.queryObject) {
			if (Object.keys(this.queryObject).length !== queryObjectNumKeysWithTransform) {
				throw new InsightError();
			}
			this.hasTransform = true;
			if (!this.comparator) {
				this.validParseHandler.handleTransformation(
					this.queryObject,
					this.transformHandler,
					this.optionsHandler.getColumnId()
				);
			} else {
				this.validParseHandler.handleTransformation(this.queryObject, this.transformHandler);
			}

			this.validParseHandler.handleOptionsWithT(this.transformHandler.getResultColumns(), this.optionsHandler);
		} else if (Object.keys(this.queryObject).length !== queryObjectNumKeysWithoutTransform) {
			throw new InsightError();
		}

		if (this.comparator) {
			this.comparator.validateFields();
		}
	}

	// Queries the dataset in this.comparator and returns InsightResult[] based on this.optionsHandler
	// Assumes validateQuery has been run beforehand and does not throw an error
	// Throws ResultTooLargeError if query result is larger than 5000 results
	public async doQuery(): Promise<InsightResult[]> {
		let ret: InsightResult[];
		if (!this.comparator) {
			ret = await this.getDataFromColumns();
		} else {
			ret = this.comparator.filterDataset();
		}

		if (this.hasTransform) {
			ret = this.transformHandler.groupTransform(ret);
		}

		if (ret.length > maxQueryResult) {
			throw new ResultTooLargeError();
		}

		ret = this.optionsHandler.orderRows(ret);
		ret = this.optionsHandler.selectColumn(ret);
		return ret;
	}

	public async setDataset(id: string): Promise<void> {
		try {
			const validDataset = await Validation.savedDataset(id);
			if (validDataset && Validation.getDataset(id)) {
				this.dataset = Validation.getDataset(id);
			} else {
				throw new InsightError();
			}
		} catch (err) {
			throw new InsightError(String(err));
		}
	}

	public setComparator(comparator: IComparator): void {
		this.comparator = comparator;
	}

	public getDataset(): Dataset | undefined {
		return this.dataset;
	}

	public getComparator(): IComparator | undefined {
		return this.comparator;
	}

	public getTransformationId(): string {
		if (
			!(this.queryObject instanceof Object) ||
			!("TRANSFORMATIONS" in this.queryObject) ||
			!(this.queryObject.TRANSFORMATIONS instanceof Object) ||
			!("GROUP" in this.queryObject.TRANSFORMATIONS) ||
			!(this.queryObject.TRANSFORMATIONS.GROUP instanceof Array)
		) {
			throw new InsightError();
		}

		const [id] = this.queryObject.TRANSFORMATIONS.GROUP[0].split("_");
		const reg = /^[^_]+$/;
		if (!reg.test(id)) {
			throw new InsightError();
		}
		return id;
	}

	private async getDataFromColumns(): Promise<InsightResult[]> {
		const ret: InsightResult[] = [];
		let data: Data[] | undefined;
		const id = this.optionsHandler.getColumnId();
		try {
			const validDataset = await Validation.savedDataset(id);
			// let data: Dataset;
			if (validDataset && Validation.getDataset(id)) {
				data = Validation.getDataset(id)?.getData();
			} else {
				throw new InsightError();
			}
		} catch (err) {
			throw new InsightError(String(err));
		}

		if (!data) {
			throw new InsightError();
		}
		data.forEach((section: Data) => {
			ret.push(section.getDataObject(id));
		});
		return ret;
	}
}
