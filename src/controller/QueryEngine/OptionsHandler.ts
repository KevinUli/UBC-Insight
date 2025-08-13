import { InsightError, InsightResult } from "../IInsightFacade";
import assert from "node:assert";
import { QueryData, roomMField, roomSField, sectionMField, sectionSField } from "./QueryData";

export class OptionsHandler {
	private columns: string[];
	private order: string | Object | undefined;
	private isAggregateOrder: boolean;
	private queryData: QueryData;

	constructor(queryData: QueryData) {
		this.columns = [];
		this.isAggregateOrder = false;
		this.queryData = queryData;
	}

	public addColumn(column: string): void {
		this.columns.push(column);
	}

	public addOrder(order: string | Object): void {
		this.order = order;
		if (typeof order === "object") {
			this.isAggregateOrder = true;
		}
	}

	public validateFields(datasetId: string | undefined): void {
		if (!datasetId) {
			datasetId = this.getColumnId();
		}
		if (!this.order) {
			this.columns.forEach((column: string) => {
				if (!datasetId) {
					throw new InsightError();
				}
				this.validateColumn(column, datasetId);
			});
		} else if (this.isAggregateOrder) {
			this.validateOrderObject(datasetId);
		} else {
			this.validateOrderString(datasetId);
		}
	}

	public validateFieldsWTransform(resultColumns: string[]): void {
		this.columns.forEach((item: string) => {
			if (!resultColumns.includes(item)) {
				throw new InsightError();
			}
		});
	}

	// Assume field is valid
	public orderRows(data: InsightResult[]): InsightResult[] {
		if (!this.order) {
			return data;
		}

		if (this.isAggregateOrder) {
			return this.orderRowsAggregate(data);
		} else {
			return this.orderRowsSingle(data);
		}
	}

	public selectColumn(data: InsightResult[]): InsightResult[] {
		const ret: InsightResult[] = [];

		data.forEach((item: InsightResult) => {
			const newItem: InsightResult = {};
			this.columns.forEach((idColumnPair: string) => {
				if (!(idColumnPair in item)) {
					throw new InsightError();
				}
				newItem[idColumnPair] = item[idColumnPair];
			});
			ret.push(newItem);
		});

		return ret;
	}

	public getColumnId(depth = 0): string {
		if (depth + 1 >= this.columns.length) {
			return this.queryData.getTransformationId();
		}
		if (!this.columns[depth].includes("_")) {
			return this.getColumnId(depth + 1);
		}
		const [id] = this.columns[0].split("_");
		const reg = /^[^_]+$/;
		if (!reg.test(id)) {
			throw new InsightError();
		}
		return id;
	}

	private orderRowsAggregate(data: InsightResult[]): InsightResult[] {
		if (
			!this.order ||
			typeof this.order !== "object" ||
			!("dir" in this.order) ||
			!(typeof this.order.dir === "string")
		) {
			throw new InsightError();
		}

		if (this.order.dir === "UP") {
			this.sortHelperUp(data);
		} else {
			this.sortHelperDown(data);
		}

		return data;
	}

	private sortHelperUp(data: InsightResult[]): void {
		const order = this.order;
		data.sort(function f(item1: InsightResult, item2: InsightResult, depth = 0, order_ = order): number {
			assert(order_);
			assert(typeof order_ !== "string");
			assert("keys" in order_);
			assert(order_.keys instanceof Array);
			const key = order_.keys[depth];

			if (!(key in item1) || !(key in item2)) {
				throw new InsightError();
			}
			if (item1[key] > item2[key]) {
				return 1;
			}
			if (item1[key] < item2[key]) {
				return -1;
			}
			if (depth + 1 >= order_.keys.length) {
				return 0;
			}
			return f(item1, item2, depth + 1, order_);
		});
	}

	private sortHelperDown(data: InsightResult[]): void {
		const order = this.order;
		data.sort(function f(item1: InsightResult, item2: InsightResult, depth = 0, order_ = order): number {
			assert(order_);
			assert(typeof order_ !== "string");
			assert("keys" in order_);
			assert(order_.keys instanceof Array);
			const key = order_.keys[depth];

			if (!(key in item1) || !(key in item2)) {
				throw new InsightError();
			}
			if (item1[key] > item2[key]) {
				return -1;
			}
			if (item1[key] < item2[key]) {
				return 1;
			}
			if (depth + 1 >= order_.keys.length) {
				return 0;
			}
			return f(item1, item2, depth + 1, order_);
		});
	}

	private orderRowsSingle(data: InsightResult[]): InsightResult[] {
		if (typeof this.order !== "string") {
			throw new InsightError();
		}

		data.sort((item1: InsightResult, item2: InsightResult) => {
			assert(typeof this.order === "string");
			if (!(this.order in item1) || !(this.order in item2)) {
				throw new InsightError();
			}
			if (item1[this.order] > item2[this.order]) {
				return 1;
			}
			if (item1[this.order] < item2[this.order]) {
				return -1;
			}
			return 0;
		});

		return data;
	}

	private validateOrderObject(datasetId: string | undefined): void {
		if (typeof this.order !== "object") {
			throw new InsightError();
		}

		this.columns.forEach((key: string) => {
			assert(datasetId);
			this.validateColumn(key, datasetId);
		});

		assert(datasetId);
		this.orderObjectValidationHelper(datasetId);
	}

	private orderObjectValidationHelper(datasetId: string): void {
		const numKeys = 2;
		if (
			typeof this.order !== "object" ||
			Object.keys(this.order).length !== numKeys ||
			!("dir" in this.order) ||
			!("keys" in this.order) ||
			typeof this.order.dir !== "string" ||
			!(this.order.keys instanceof Array) ||
			this.order.keys.length === 0
		) {
			throw new InsightError();
		}

		const directions = ["UP", "DOWN"];
		if (!directions.includes(this.order.dir)) {
			throw new InsightError();
		}

		this.order.keys.forEach((column: string) => {
			this.validateColumn(column, datasetId);
			if (!this.columns.includes(column)) {
				throw new InsightError();
			}
		});
	}

	private validateOrderString(datasetId: string | undefined): void {
		if (typeof this.order !== "string") {
			throw new InsightError();
		}

		this.columns.forEach((column: string) => {
			assert(datasetId);
			this.validateColumn(column, datasetId);
		});

		if (this.order && !this.columns.includes(this.order)) {
			throw new InsightError();
		}
	}

	private validateColumn(key: string, datasetId: string): void {
		if (!key.includes("_")) {
			return;
		}
		const [id, column, extra] = key.split("_");

		if (
			extra !== undefined ||
			!(id === datasetId) ||
			!(
				sectionSField.includes(column) ||
				sectionMField.includes(column) ||
				roomSField.includes(column) ||
				roomMField.includes(column)
			)
		) {
			throw new InsightError();
		}
	}
}
