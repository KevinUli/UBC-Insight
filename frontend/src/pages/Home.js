import Sidebar from "../components/Sidebar";
import logo from "../ubc_logo.png";


export function Home() {
	return (
		<>
			<Sidebar pageWrapId={'page-wrap'} outerContainerId={'outer-container'}/>
			<header className="App-header">
				<img src={logo} alt="Logo"/>
				Insight UBC
			</header>
		</>
	)
}
