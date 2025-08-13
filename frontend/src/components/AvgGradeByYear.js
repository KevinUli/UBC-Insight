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

function AvgGradeByYear(props) {
	const url = "http://localhost:4321/query";
	const [avgGrade, setAvgGrade] = useState([]);
	const [year, setYear] = useState([]);

	const datasetId = "sections";



	useEffect(() => {
		const filterField = props.datasetId + "_year"

		const query = {
			WHERE: {
				NOT: {
					EQ: {}
				}
			},
			OPTIONS: {
				COLUMNS: [
					props.datasetId + "_year",
					"pass",
					"fail"
				],
				ORDER: {
					dir: "UP",
					keys: [props.datasetId + "_year"]
				}
			},
			TRANSFORMATIONS: {
				GROUP: [props.datasetId + "_year"],
				APPLY: [
					{
						pass: {
							AVG: props.datasetId + "_avg"
						}
					},
					{
						fail: {
							SUM: props.datasetId + "_fail"
						}
					}

				]
			}
		}
		query.WHERE.NOT.EQ[filterField] = 1900;

		axios.post(url, query)
			.then((res) => {
				if (res.status === 400) {
					throw new Error(`HTTP error: ${res.status}`);
				}
				let retArray = res.data.result;
				setYear(retArray.map((d) => d[props.datasetId + "_year"]));
				setAvgGrade(retArray.map((d) => {
					return d["pass"]
				}));
			})
	}, [datasetId, props.datasetId]);

	const data = {
		labels: year,
		datasets: [
			{
				label: props.datasetId,
				backgroundColor: 'rgba(75, 192, 192, 0.6)',
				borderColor: 'rgba(75, 192, 192, 1)',
				borderWidth: 1,
				data: avgGrade,
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
				min: Math.min(...avgGrade) - Math.min(...avgGrade)/10
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

export default AvgGradeByYear;
