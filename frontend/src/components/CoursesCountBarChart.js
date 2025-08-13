import { Bar } from "react-chartjs-2";
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

function CoursesCountBarChart(props) {
	const url = "http://localhost:4321/query";
	const [counts, setCounts] = useState([]);
	const [depts, setDepts] = useState([]);

	const datasetId = "sections";


	useEffect(() => {

		const query = {
			WHERE: {},
			OPTIONS: {
				COLUMNS: [
					props.datasetId + "_dept",
					"counts"
				],
				ORDER: {
					dir: "DOWN",
					keys: ["counts"]
				}
			},
			TRANSFORMATIONS: {
				GROUP: [props.datasetId + "_dept"],
				APPLY: [
					{
						counts: {
							COUNT: props.datasetId + "_id"
						}
					}
				]
			}
		}
		axios.post(url, query)
			.then((res) => {
				if (res.status === 400) {
					throw new Error(`HTTP error: ${res.status}`);
				}
				setDepts(res.data.result.map((d) => d[props.datasetId + "_dept"]));
				setCounts(res.data.result.map((d) => d["counts"]));
			})
	}, [datasetId, props.datasetId]);

	const data = {
		labels: depts,
		datasets: [
			{
				label: props.datasetId,
				backgroundColor: 'rgba(75, 192, 192, 0.6)',
				borderColor: 'rgba(75, 192, 192, 1)',
				borderWidth: 1,
				data: counts,
			},
		],
	};

	const options = {
		scales: {
			y: {
				ticks: {
					font: {
						size: 30
					}
				},
				min: Math.min(...counts) - Math.min(...counts)/10
			},
			x: {
				ticks: {
					font: {
						size: 30
					}
				}
			},
		},
	};

	return (
		<div className = "charts">
			<Bar data={data} options={options}/>
		</div>
	);
}

export default CoursesCountBarChart;
