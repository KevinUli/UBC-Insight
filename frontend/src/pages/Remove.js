import Sidebar from "../components/Sidebar";
import {Component} from "react";
import {DatasetTable} from "../components/DatasetTable";
import "./Remove.css"

export class Remove extends Component {
	state = {
		selectedId: null,
		updatedKey: 0
	};

	onIdChange = (event) => {
		this.setState({
			selectedId: event.target.value
		})
		this.updateResultField(" ");
	}


	onDelete = () => {
		if (!this.state.selectedId) {
			this.updateResultField("Input an ID!");
			return;
		}

		const url = "http://localhost:4321/dataset/" + String(this.state.selectedId);

		fetch(url, {method: 'DELETE'})
			.then((response) => {
				if (!response.ok) {
					throw new Error(`HTTP error: ${response.status}`);
				}
				this.updateResultField(`
				Successfully removed file id ${this.state.selectedId}!`);
				this.setState( {
					updatedKey: this.state.updatedKey + 1
				});
				localStorage.removeItem(this.state.selectedId);
			})
			.catch((error) => {
				if (error.message === "HTTP error: 400") {
					this.updateResultField(`
					Failed to remove due to invalid ID!
					Make sure the ID does not contain underscore!`)
				} else {
					this.updateResultField(`
					Failed to remove due to non-existing ID!
					Make sure the ID is an existing ID!`)
				}
			})
	};

	updateResultField = (text) => {
		const resField = document.querySelector("#remove-result-field");
		resField.textContent = text;
	}

	render() {
		return (
			<>
				<Sidebar pageWrapId={'page-wrap'} outerContainerId={'outer-container'}/>
				<div className={"remove-input-field"}>
					<button className="delete-button" onClick={this.onDelete}>Delete!</button>
					<h1 className="input-remove-id-head">Input file id</h1>
					<input className="remove-id-area" type={"text"} value={this.state.selectedId} onChange={this.onIdChange}/>
					<h1 className="remove-result-field" id="remove-result-field"> </h1>
					<h1 className="reminder-field"> {`Make sure the id to remove \n is an existing id on the right!`} </h1>
					<DatasetTable key={this.state.updatedKey}/>
				</div>
			</>
		)
	}
}
