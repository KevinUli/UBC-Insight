import {useEffect, useState} from "react";
import "./DatasetSelector.css"

export function DatasetSelector(props) {
	const url = "http://localhost:4321/datasets";

	const [data, setData] = useState([]);
	const [selectedValue, setSelectedValue] = useState([]);

	const fetchInfo = () => {
		return fetch(url, {method: "GET"})
			.then((res) => res.json())
			.then((d) => setData(d.result))
			.catch((err) => {})
	}

	useEffect(() => {
		fetchInfo();
	}, [])

	return (
		<select
			value={selectedValue}
			onChange={(e) => {
				setSelectedValue(e.target.value);
				props.onChangeDataset(e.target.value);
			}}
			className = "dataset-selector"
		>
			<option disabled selected value=""> -- select an option --</option>
			{data.map((option) => (
				<option key={option.id} value={option.id}>
					{option.id}
				</option>
			))}
		</select>
	);
}
