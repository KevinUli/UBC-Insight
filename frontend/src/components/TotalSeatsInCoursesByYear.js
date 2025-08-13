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

function TotalSeatsInCoursesByYear(props) {
	const url = "http://localhost:4321/query";
	const [seats, setSeats] = useState([]);
	const [year, setYear] = useState([]);

	useEffect(() => {
		const filterFieldDept = props.datasetId + "_dept"
		const filterFieldId = props.datasetId + "_id"
		const filterFieldYear = props.datasetId + "_year"
		const [dept, id, extra] = props.courseCode.split(" ")

		if (!dept || !id || extra) return;
		if (dept.length !== 4 || id.length !== 3) return;

		const query = {
			WHERE: {
				AND: [{
					IS: {}
				}, {
					IS: {}
				}, {
					NOT: {
						EQ: {}
					}
				}]
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
							SUM: props.datasetId + "_pass"
						}
					}, {
						fail: {
							SUM: props.datasetId + "_fail"
						}
					}
				]
			}
		}
		query.WHERE.AND[0].IS[filterFieldDept] = String(dept).toLowerCase();
		query.WHERE.AND[1].IS[filterFieldId] = String(id).toLowerCase();
		query.WHERE.AND[2].NOT.EQ[filterFieldYear] = 1900;

		axios.post(url, query)
			.then((res) => {
				if (res.status === 400) {
					throw new Error(`HTTP error: ${res.status}`);
				}
				let retArray = res.data.result;
				setYear(retArray.map((d) => d[props.datasetId + "_year"]));
				setSeats(retArray.map((d) => d["pass"] + d["fail"]));
			})
	}, [props.courseCode, props.datasetId]);

	const data = {
		labels: year,
		datasets: [
			{
				label: props.datasetId,
				backgroundColor: 'rgba(75, 192, 192, 0.6)',
				borderColor: 'rgba(75, 192, 192, 1)',
				borderWidth: 1,
				data: seats,
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
				min: Math.min(...seats) - Math.min(...seats)/10
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

export default TotalSeatsInCoursesByYear;
