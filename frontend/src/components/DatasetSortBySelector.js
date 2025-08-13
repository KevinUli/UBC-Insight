import {useState} from "react";
import "./DatasetSortBySelector.css";


export function DatasetSortBySelector(props) {

	const [selectedValue, setSelectedValue] = useState([]);

	return (
		<select
			value={selectedValue}
			onChange={(e) => {
				setSelectedValue(e.target.value);
				props.onChangeSort(e.target.value);
			}}
			className="sort-by-selector"
		>
			<option disabled selected value=""> -- select sort by --</option>
			<option value="id">ID</option>
			<option value="numRows">Number of Rows</option>
			<option value="byAddDate">Dataset Add Date</option>


		</select>
	);
}
