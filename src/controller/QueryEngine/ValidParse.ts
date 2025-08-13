import { InsightError } from "../IInsightFacade";
import { ComparatorTransformerProvider } from "./ComparatorTransformerProvider";
import { LogicComparator } from "./comparators/LogicComparator";
import { NOTComparator } from "./comparators/NOTComparator";
import { QueryData } from "./QueryData";
import assert from "node:assert";
import { ISComparator } from "./comparators/ISComparator";
import { MComparator } from "./comparators/MComparator";
import { OptionsHandler } from "./OptionsHandler";
import { TransformationHandler } from "./TransformationHandler";

const maxRecursionDepth = 20;

const SComparatorKey: string[] = ["IS"];

const MComparatorKey: string[] = ["LT", "GT", "EQ"];

const NComparatorKey: string[] = ["NOT"];

const LogicComparatorKey: string[] = ["OR", "AND"];

export class ValidParse {
	private queryData: QueryData;
	private recursionDepth: number;
	private singularRecursionDepth: number;

	constructor(queryData: QueryData) {
		this.queryData = queryData;
		this.recursionDepth = 0;
		this.singularRecursionDepth = 0;
	}

	// Checks whether the Where key is valid and updates comparator field
	public async handleWhere(queryObject: unknown): Promise<void> {
		// Validation and type checks
		if (
			!(queryObject instanceof Object) ||
			!("WHERE" in queryObject) ||
			!(queryObject.WHERE instanceof Object) ||
			Object.keys(queryObject.WHERE).length > 1
		) {
			throw new InsightError();
		}

		if (Object.keys(queryObject.WHERE).length === 0) {
			return;
		}

		const comparatorKey: string = Object.keys(queryObject.WHERE)[0];
		const comparatorObject: unknown = Object.entries(queryObject.WHERE)[0][1];

		try {
			await this.handleComparatorInitial(comparatorKey, comparatorObject);
		} catch (err) {
			throw new InsightError(String(err));
		}
	}

	public handleOptions(queryObject: unknown, optionsHandler: OptionsHandler): void {
		// type checks
		if (
			!(queryObject instanceof Object) ||
			!("OPTIONS" in queryObject) ||
			!(queryObject.OPTIONS instanceof Object) ||
			!("COLUMNS" in queryObject.OPTIONS) ||
			!(queryObject.OPTIONS.COLUMNS instanceof Array)
		) {
			throw new InsightError();
		}

		queryObject.OPTIONS.COLUMNS.forEach((item: unknown) => {
			if (typeof item !== "string") {
				throw new InsightError();
			}
			optionsHandler.addColumn(item);
		});

		let optionLength = 2;
		if (!("ORDER" in queryObject.OPTIONS)) {
			optionLength = 1;
		}
		if (Object.keys(queryObject.OPTIONS).length !== optionLength) {
			throw new InsightError();
		}

		if ("ORDER" in queryObject.OPTIONS) {
			if (typeof queryObject.OPTIONS.ORDER === "string" || queryObject.OPTIONS.ORDER instanceof Object) {
				optionsHandler.addOrder(queryObject.OPTIONS.ORDER);
			} else {
				throw new InsightError();
			}
		}

		optionsHandler.validateFields(this.queryData.getDataset()?.getId());
	}

	public handleTransformation(queryObject: unknown, transformHandler: TransformationHandler, id?: string): void {
		if (
			!(queryObject instanceof Object) ||
			!("TRANSFORMATIONS" in queryObject) ||
			!(queryObject.TRANSFORMATIONS instanceof Object) ||
			!("GROUP" in queryObject.TRANSFORMATIONS) ||
			!(queryObject.TRANSFORMATIONS.GROUP instanceof Array) ||
			!("APPLY" in queryObject.TRANSFORMATIONS) ||
			!(queryObject.TRANSFORMATIONS.APPLY instanceof Array)
		) {
			throw new InsightError();
		}

		this.handleGroups(queryObject.TRANSFORMATIONS.GROUP, transformHandler);

		queryObject.TRANSFORMATIONS.APPLY.forEach((item: unknown) => {
			if (!(item instanceof Object)) {
				throw new InsightError();
			}
			this.handleApply(item, transformHandler);
		});

		if (id) {
			transformHandler.validateFields(id);
		} else {
			transformHandler.validateFields(this.queryData.getDataset()?.getId());
		}
	}

	public handleOptionsWithT(columns: string[], optionHandler: OptionsHandler): void {
		optionHandler.validateFieldsWTransform(columns);
	}

	private handleGroups(groups: any[], transformHandler: TransformationHandler): void {
		let isStringFlag = true;
		groups.forEach((item: unknown) => {
			if (typeof item !== "string") {
				isStringFlag = false;
			}
		});

		if (groups.length === 0 || !isStringFlag) {
			throw new InsightError();
		}
		transformHandler.setGroup(groups);
	}

	private handleApply(applyObj: Object, transformHandler: TransformationHandler): void {
		const objKeys = Object.keys(applyObj);
		if (objKeys.length !== 1) {
			throw new InsightError();
		}

		const resultColumn: string = objKeys[0];

		const transformObject: unknown = Object.entries(applyObj)[0][1];
		if (!(transformObject instanceof Object)) {
			throw new InsightError();
		}

		if (Object.entries(transformObject).length !== 1) {
			throw new InsightError();
		}
		const transformKey: unknown = Object.entries(transformObject)[0][0];
		const transformColumn: unknown = Object.entries(transformObject)[0][1];

		if (typeof transformKey !== "string" || typeof transformColumn !== "string") {
			throw new InsightError();
		}

		transformHandler.addTransformer(resultColumn, transformKey, transformColumn);
	}

	private async handleComparatorInitial(comparatorKey: string, comparatorObject: unknown): Promise<void> {
		this.queryData.setComparator(ComparatorTransformerProvider.getNewComparator(comparatorKey));
		try {
			await this.handleComparatorHelper(comparatorKey, comparatorObject);
		} catch (err) {
			throw new InsightError(String(err));
		}
	}

	private async handleComparatorWithLogic(
		comparatorKey: string,
		comparatorObject: unknown,
		logicComparator: LogicComparator
	): Promise<void> {
		const newComparator = ComparatorTransformerProvider.getNewComparator(comparatorKey);
		this.recursionDepth++;
		this.singularRecursionDepth++;
		try {
			await this.handleComparatorHelper(comparatorKey, comparatorObject, newComparator);
		} catch (err) {
			throw new InsightError(String(err));
		}
		this.recursionDepth -= this.singularRecursionDepth;
		this.singularRecursionDepth = 0;
		logicComparator.addFilter(newComparator);
	}

	private async handleComparatorWithNot(
		comparatorKey: string,
		comparatorObject: unknown,
		notComparator: NOTComparator
	): Promise<void> {
		const newComparator = ComparatorTransformerProvider.getNewComparator(comparatorKey);
		this.recursionDepth++;
		this.singularRecursionDepth++;
		try {
			await this.handleComparatorHelper(comparatorKey, comparatorObject, newComparator);
		} catch (err) {
			throw new InsightError(String(err));
		}
		this.recursionDepth -= this.singularRecursionDepth;
		this.recursionDepth = 0;
		notComparator.addFilter(newComparator);
	}

	private async handleComparatorHelper(
		compK: string,
		compO: unknown,
		comparator = this.queryData.getComparator()
	): Promise<void> {
		try {
			if (LogicComparatorKey.includes(compK)) {
				if (!(compO instanceof Array)) {
					throw new InsightError();
				}
				await this.handleLComparison(compO, comparator);
				return;
			}

			if (!(compO instanceof Object)) {
				throw new InsightError();
			}
			if (SComparatorKey.includes(compK)) {
				await this.handleSComparison(compO, comparator);
			} else if (MComparatorKey.includes(compK)) {
				await this.handleMComparison(compO, comparator);
			} else if (NComparatorKey.includes(compK)) {
				await this.handleNComparison(compO, comparator);
			}
		} catch (err) {
			throw new InsightError(String(err));
		}
	}

	// Validates the given object is an SComparison object and sets the given comparator's
	// key and value to object. defaults to class comparator
	// if comparator arg is not given, requires class comparator to be of type SComparator
	// if comparator arg is given, requires comparator to be of type SComparator
	private async handleSComparison(object: Object, comparator = this.queryData.getComparator()): Promise<void> {
		if (Object.entries(object).length !== 1) {
			throw new InsightError();
		}
		const key: unknown = Object.entries(object)[0][0];
		const value: unknown = Object.entries(object)[0][1];

		if (typeof key !== "string" || typeof value !== "string") {
			throw new InsightError();
		}
		try {
			if (!this.queryData.getDataset()) {
				const [id] = key.split("_");
				await this.queryData.setDataset(id);
			}
		} catch (err) {
			throw new InsightError(String(err));
		}

		assert(comparator instanceof ISComparator);
		comparator.setKey(key);
		comparator.setValue(value);
		comparator.setQueryData(this.queryData);
	}

	// Validates the given object is an MComparison object and sets the given comparator's
	// key and value to object. defaults to class comparator
	// if comparator arg is not given, requires class comparator to be of type MComparator
	// if comparator arg is given, requires comparator to be of type MComparator
	private async handleMComparison(object: Object, comparator = this.queryData.getComparator()): Promise<void> {
		if (Object.entries(object).length !== 1) {
			throw new InsightError();
		}

		const key: unknown = Object.entries(object)[0][0];
		const value: unknown = Object.entries(object)[0][1];

		if (typeof key !== "string" || typeof value !== "number") {
			throw new InsightError();
		}

		try {
			if (!this.queryData.getDataset()) {
				const [id] = key.split("_");
				await this.queryData.setDataset(id);
			}
		} catch (err) {
			throw new InsightError(String(err));
		}

		assert(comparator instanceof MComparator);
		comparator.setKey(key);
		comparator.setValue(value);
		comparator.setQueryData(this.queryData);
	}

	// Validates the given object is an LogicComparison object and sets the given comparator's
	// key and value to object. defaults to class comparator
	// if comparator arg is not given, requires class comparator to be of type LogicComparator
	// if comparator arg is given, requires comparator to be of type LogicComparator
	private async handleLComparison(object: Object[], comparator = this.queryData.getComparator()): Promise<void> {
		if (object.length < 1) {
			throw new InsightError();
		}
		// if (this.recursionDepth > maxRecursionDepth) {
		// 	return;
		// }
		assert(comparator instanceof LogicComparator);
		comparator.setQueryData(this.queryData);

		const promises: Promise<void>[] = [];
		object.forEach((item: Object) => {
			if (Object.keys(item).length !== 1) {
				throw new InsightError();
			}
			const compKey: string = Object.keys(item)[0];
			const compObject: unknown = Object.entries(item)[0][1];
			assert(comparator instanceof LogicComparator);
			try {
				promises.push(this.handleComparatorWithLogic(compKey, compObject, comparator));
			} catch (err) {
				throw new InsightError(String(err));
			}
		});
		await Promise.all(promises);
	}

	// Validates the given object is an NComparison object and sets the given comparator's
	// key and value to object. defaults to class comparator
	// if comparator arg is not given, requires class comparator to be of type NComparator
	// if comparator arg is given, requires comparator to be of type NComparator
	private async handleNComparison(object: Object, comparator = this.queryData.getComparator()): Promise<void> {
		if (Object.entries(object).length !== 1) {
			throw new InsightError();
		}

		if (this.recursionDepth > maxRecursionDepth) {
			return;
		}

		const comparatorKey: string = Object.keys(object)[0];
		const comparatorObject: unknown = Object.entries(object)[0][1];

		assert(comparator instanceof NOTComparator);
		comparator.setQueryData(this.queryData);
		try {
			await this.handleComparatorWithNot(comparatorKey, comparatorObject, comparator);
		} catch (err) {
			throw new InsightError(String(err));
		}
	}
}
