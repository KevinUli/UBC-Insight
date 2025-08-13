import Sidebar from "../components/Sidebar";
import './Add.css';
import {Component} from "react";
import {DatasetTable} from "../components/DatasetTable";


export class Add extends Component {
	state = {
		selectedId: null,
		selectedFile: null,
		updatedKey: 0
	};

	onFileChange = (event) => {
		this.setState({
			selectedFile: event.target.files[0]
		});
		this.updateResultField(" ");
	};

	onIdChange = (event) => {
		this.setState({
			selectedId: event.target.value
		})
		this.updateResultField(" ");
	}

	onFileUpload = () => {
		if (!this.state.selectedFile || !this.state.selectedId) {
			this.updateResultField(`
				Select a file and input an ID!`);
			return;
		}

		const url = "http://localhost:4321/dataset/" + String(this.state.selectedId) + "/sections";

		fetch(url, {method: 'PUT', body: this.state.selectedFile})
			.then((response) => {
				if (!response.ok) {
					throw new Error(`HTTP error: ${response.status}`);
				}
			})
			.then(async () => {
				this.updateResultField(`
				Successfully added file id ${this.state.selectedId}!`);
				this.setState({
					updatedKey: this.state.updatedKey + 1
				});

				const date = new Date();
				const currTime = date.getDate()
					+ "/" + (date.getMonth() + 1)
					+ "/" + date.getFullYear()
					+ " " + date.getHours()
					+ ':' + date.getMinutes()
					+ ":" + date.getSeconds()
				localStorage.setItem(this.state.selectedId, currTime);
			})
			.catch((error) => {
				this.updateResultField(`
				Failed to add with
				${error}!
				Make sure the id has no underscore,
				no existing file with same id,
				and file is valid zip file!`)
			})
	};

	updateResultField = (text) => {
		const resField = document.querySelector("#result-field");
		resField.textContent = text;
	}

	fileData = () => {
		if (this.state.selectedFile && this.state.selectedId) {
			return (
				<div className={"file-data"}>
					<h2>File Details:</h2>
					<p>File ID: {this.state.selectedId}</p>

					<p>File Name: {this.state.selectedFile.name}</p>

					<p>File Type: {this.state.selectedFile.type}</p>

				</div>
			);
		} else if (!this.state.selectedFile && this.state.selectedId) {
			return <div className={"file-data"}>
				<br/>
				<h4>Choose file before pressing the upload button</h4>
			</div>
		} else if (!this.state.selectedId && this.state.selectedFile) {
			return <div className={"file-data"}>
				<br/>
				<h4>Input ID before pressing the upload button</h4>
			</div>
		} else {
			return (
				<div className={"file-data"}>
					<br/>
					<h4>Input ID and choose file before Pressing the Upload button</h4>
				</div>
			);
		}
	};

	render() {
		return (
			<div>
				<Sidebar pageWrapId={'page-wrap'} outerContainerId={'outer-container'}/>
				<div className={"input-field"}>
					<button className="upload-button" onClick={this.onFileUpload}>Upload!</button>
					<h1 className="input-id-head">Input file id</h1>
					<input className="id-area" type={"text"} value={this.state.selectedId} onChange={this.onIdChange}/>
					<h1 className="input-file-head">Input file to be added</h1>
					<input className="file-area" type="file" onChange={this.onFileChange}/>
					{this.fileData()}
					<h1 className="result-field" id="result-field"></h1>
					<DatasetTable key={this.state.updatedKey}/>
				</div>
			</div>
		);
	}
}
