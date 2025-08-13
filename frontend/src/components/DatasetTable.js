import {useEffect, useState} from "react";
import "./DatasetTable.css";
import {DatasetSortBySelector} from "./DatasetSortBySelector";
import {DatasetSortDirSelector} from "./DatasetSortDirSelector";

export function DatasetTable() {
	const url = "http://localhost:4321/datasets";
	const [data, setData] = useState([]);
	const [sortBy, setSortBy] = useState("");
	const [sortDir, setSortDir] = useState("");

	const onChangeSortBy = (newSortBy) => {
		setSortBy(newSortBy)
	}

	const onChangeSortDir = (newSortDir) => {
		setSortDir(newSortDir)
	}

	const sortedTable = () => {
		if (sortDir === "UP") {
			if (sortBy === "byAddDate") {
				data.sort((i1, i2) => {
					if (localStorage.getItem(i1.id) > localStorage.getItem(i2.id)) return 1;
					else if (localStorage.getItem(i1.id) < localStorage.getItem(i2.id)) return -1;
					return 0;
				})
			} else {
				data.sort((i1, i2) => {
					if (i1[sortBy] > i2[sortBy]) return 1;
					else if (i1[sortBy] < i2[sortBy]) return -1;
					return 0;
				})
			}
		} else {
			if (sortBy === "byAddDate") {
				data.sort((i1, i2) => {
					if (localStorage.getItem(i1.id) > localStorage.getItem(i2.id)) return -1;
					else if (localStorage.getItem(i1.id) < localStorage.getItem(i2.id)) return 1;
					return 0;
				})
			} else {
				data.sort((i1, i2) => {
					if (i1[sortBy] > i2[sortBy]) return -1;
					else if (i1[sortBy] < i2[sortBy]) return 1;
					return 0;
				})
			}
		}

		return (data.map((val, key) => {
				return (
					<tr key={key}>
						<td>{val.id}</td>
						<td>{val.numRows}</td>
						<td>{localStorage.getItem(val.id)}</td>
					</tr>
				)
			}))
	}

	const fetchInfo = () => {
		return fetch(url, {method: "GET"})
			.then((res) => res.json())
			.then((d) => {
				setData(d.result)
			})
			.catch((err) => {})
	}

	useEffect(() => {
		fetchInfo();
	}, []);

	return (
			<div className="DatasetTable">
				<h1>Existing Datasets</h1>
				<DatasetSortBySelector onChangeSort = {onChangeSortBy}/>
				<DatasetSortDirSelector onChangeSort = {onChangeSortDir}/>

				<table className = "table">
					<tr>
						<th>ID</th>
						<th>Number of Rows</th>
						<th>Dataset Add Date</th>
					</tr>
					{sortedTable()}
				</table>
			</div>
		);
}
