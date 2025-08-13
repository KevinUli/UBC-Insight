import Sidebar from "../components/Sidebar";
import {Component} from "react";
import {DatasetSelector} from "../components/DatasetSelector";
import {InsightSelector} from "../components/InsightSelector";
import "./Insight.css"
import CoursesCountBarChart from "../components/CoursesCountBarChart";
import DepartmentCourseAvgChart from "../components/DepartmentCourseAvgChart";
import AvgGradeByYear from "../components/AvgGradeByYear";
import AvgGradeByCourseCode from "../components/AvgGradeByCourseCode";
import AllCourseByDepartment from "../components/AllCourseByDepartment";
import TotalSeatsInCoursesByYear from "../components/TotalSeatsInCoursesByYear";


export class Insight extends Component {

	constructor(props) {
		super(props);
		this.onChangeDataset = this.onChangeDataset.bind(this);
		this.onChangeInsight = this.onChangeInsight.bind(this);

	}

	state = {
		datasetId: null,
		insight: null,
		updatedKey: 0,
		courseCode: null,
		deptCode: null
	}

	onChangeDataset(newDatasetId) {
		this.setState({
			datasetId: newDatasetId
		})
		this.setState({
			updatedKey: this.state.updatedKey + 1
		})
	}

	onChangeInsight(newInsight) {
		this.setState({
			insight: newInsight
		})
		this.setState({
			updatedKey: this.state.updatedKey + 1
		})
	}

	onChangeCourseCode = (event) => {
		this.setState({
			courseCode: event.target.value
		})
		this.setState({
			updatedKey: this.state.updatedKey + 1
		})
	}

	onChangeDeptCode = (event) => {
		this.setState({
			deptCode: event.target.value
		})
		this.setState({
			updatedKey: this.state.updatedKey + 1
		})
	}

	showInsights() {
		if (!this.state.datasetId) return;

		if (this.state.insight === "coursesCountByFaculty") {
			return (<CoursesCountBarChart datasetId = {this.state.datasetId} key = {this.state.updatedKey}/>);
		} else if (this.state.insight === "avgGradeByFaculty") {
			return (<DepartmentCourseAvgChart datasetId = {this.state.datasetId} key = {this.state.updatedKey}/>);
		} else if (this.state.insight === "avgGradeByYear") {
			return (<AvgGradeByYear datasetId = {this.state.datasetId} key = {this.state.updatedKey}/>)
		} else if (this.state.insight === "avgGradeByCourseCode" || this.state.insight === "seatsInCourseByYear") {
			return (<input className="course-code-entry" type={"text"} value={this.state.courseCode} onChange={this.onChangeCourseCode} placeholder="enter course code to view"/>)
		} else if (this.state.insight === "allCourseByDepartment") {
			return (<input className="department-code-entry" type = "text" value={this.state.deptCode} onChange={this.onChangeDeptCode} placeholder="enter dept code to view"/>)
		}
	}

	showSubInsights() {
		if (!this.state.datasetId) return;

		if (this.state.insight === "avgGradeByCourseCode" && this.state.courseCode) {
			return (<AvgGradeByCourseCode datasetId = {this.state.datasetId} courseCode = {this.state.courseCode} key = {this.state.updatedKey}/>)
		} else if (this.state.insight === "allCourseByDepartment" && this.state.deptCode) {
			return (<AllCourseByDepartment datasetId = {this.state.datasetId} deptCode = {this.state.deptCode} key = {this.state.updatedKey}/>)
		} else if (this.state.insight === "seatsInCourseByYear" && this.state.courseCode) {
			return (<TotalSeatsInCoursesByYear datasetId = {this.state.datasetId} courseCode = {this.state.courseCode} key = {this.state.updatedKey}/>)
		}
	}


	render() {
		return (
			<>
				<Sidebar pageWrapId={'page-wrap'} outerContainerId={'outer-container'}/>
				<div className="selector-field">
					<h1 className="dataset-selector-head">Select the dataset to find insights from!</h1>
					<DatasetSelector onChangeDataset={this.onChangeDataset}/>
					<h1 className="insight-selector-head">Select the insight to show!</h1>
					<InsightSelector onChangeInsight={this.onChangeInsight}/>

					{this.showInsights()}
					{this.showSubInsights()}
				</div>
			</>
		)
	}
}
