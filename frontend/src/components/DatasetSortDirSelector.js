import {useState} from "react";
import "./DatasetSortDirSelector.css";

export function DatasetSortDirSelector(props) {

	const [selectedValue, setSelectedValue] = useState([]);

	return (
		<select
			value={selectedValue}
			onChange={(e) => {
				setSelectedValue(e.target.value);
				props.onChangeSort(e.target.value);
			}}
			className="sort-dir-selector"
		>
			<option disabled selected value="">-- select sort direction --</option>
			<option value="UP">Ascending</option>
			<option value="DOWN">Descending</option>


		</select>
	);
}
