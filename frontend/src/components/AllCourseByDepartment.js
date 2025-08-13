import {useEffect, useState} from "react";
import axios from "axios";

import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarController,
	BarElement,
	Title,
	Tooltip,
	Legend
} from "chart.js";

ChartJS.register(
	Title,
	Tooltip,
	Legend,
	CategoryScale,
	LinearScale,
	BarElement,
	BarController
);

function AllCourseByDepartment(props) {
	const url = "http://localhost:4321/query";
	const [id, setId] = useState([]);
	const [dept, setDept] = useState([]);
	const [title, setTitle] = useState([]);

	useEffect(() => {
		const filterFieldDept = props.datasetId + "_dept"

		if (!props.deptCode || props.deptCode.length !== 4) return;

		const query = {
			WHERE: {
				IS: {}
			},
			OPTIONS: {
				COLUMNS: [
					props.datasetId + "_dept",
					props.datasetId + "_id",
					props.datasetId + "_title"
				],
				ORDER: {
					dir: "UP",
					keys: [props.datasetId + "_id"]
				}
			},
			TRANSFORMATIONS: {
				GROUP: [
					props.datasetId + "_dept",
					props.datasetId + "_id",
					props.datasetId + "_title"
				],
				APPLY: []
			}
		}
		query.WHERE.IS[filterFieldDept] = String(props.deptCode).toLowerCase();

		axios.post(url, query)
			.then((res) => {
				if (res.status === 400) {
					throw new Error(`HTTP error: ${res.status}`);
				}
				let retArray = res.data.result;
				setDept(retArray.map((d) => d[props.datasetId + "_dept"]));
				setId(retArray.map((d) => d[props.datasetId + "_id"]));
				setTitle(retArray.map((d) => d[props.datasetId + "_title"]));

			})
	}, [props.datasetId, props.deptCode.length, props.deptCode]);

	return (
		<table className="table">
			<thead>
				<tr>
					<th>Course Code</th>
					<th>Course Title</th>
				</tr>
			</thead>
			<tbody>
				{id.map((val, key) => {
					return (
						<tr key={key}>
							<td>{String(dept[key]) + "_" + String(val)}</td>
							<td>{String(title[key])}</td>
						</tr>
					)})}
			</tbody>
		</table>
	);
}

export default AllCourseByDepartment;
