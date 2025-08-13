import './App.css';
import { HashRouter as Router, Routes, Route} from 'react-router-dom'
import {Home} from "./pages/Home";
import {Add} from "./pages/Add";
import {Remove} from "./pages/Remove";
import {Insight} from "./pages/Insight";

export default function App() {
	return (
		<Router>
			<Routes>
				<Route path = "/" element = {<Home/>} />
				<Route path = "/add" element = {<Add/>} />
				<Route path = "/remove" element = {<Remove/>} />
				<Route path = "/insight" element = {<Insight/>} />
			</Routes>
		</Router>
	);
}

