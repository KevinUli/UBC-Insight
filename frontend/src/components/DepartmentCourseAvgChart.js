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

function DepartmentCourseAvgChart(props) {
	const url = "http://localhost:4321/query";
	const [avg, setAvg] = useState([]);
	const [profs, setProfs] = useState([]);

	useEffect(() => {

		const query = {
			WHERE: {},
			OPTIONS: {
				COLUMNS: [
					props.datasetId + "_dept",
					"avg"
				],
				ORDER: {
					dir: "DOWN",
					keys: ["avg"]
				}
			},
			TRANSFORMATIONS: {
				GROUP: [props.datasetId + "_dept"],
				APPLY: [
					{
						avg: {
							AVG: props.datasetId + "_avg"
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
				let retArray = res.data.result;
				setProfs(retArray.map((d) => d[props.datasetId + "_dept"]));
				setAvg(retArray.map((d) => d["avg"]));
			})
	}, [props.datasetId]);

	const data = {
		labels: profs,
		datasets: [
			{
				label: props.datasetId,
				backgroundColor: 'rgba(75, 192, 192, 0.6)',
				borderColor: 'rgba(75, 192, 192, 1)',
				borderWidth: 1,
				data: avg,
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
				min: Math.min(...avg) - Math.min(...avg)/10
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

export default DepartmentCourseAvgChart;
