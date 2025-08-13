import {useState} from "react";
import "./InsightSelector.css";

export function InsightSelector(props) {

	const [selectedValue, setSelectedValue] = useState([]);

	return (
		<select
			value={selectedValue}
			onChange={(e) => {
				setSelectedValue(e.target.value);
				props.onChangeInsight(e.target.value);
			}}
			className="insight-selector"
		>
			<option disabled selected value=""> -- select an option --</option>
			<option value="coursesCountByFaculty">Count of Courses Offered by Each Faculty</option>
			<option value="avgGradeByFaculty">Average Grade by Each Faculty</option>
			<option value="avgGradeByYear">Average Grade by Year</option>
			<option value="avgGradeByCourseCode">Average Grade by Course Code</option>
			<option value="allCourseByDepartment">View All Courses Offered by a Department</option>
			<option value="seatsInCourseByYear">View Total Seats Registered in Courses by Year</option>

		</select>
	);
}
