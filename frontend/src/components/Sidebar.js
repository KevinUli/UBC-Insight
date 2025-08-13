import React from 'react';
import { slide as Menu } from 'react-burger-menu';
import './Sidebar.css';

export default props => {
	return (
		<Menu>
			<a className="menu-item" href="/">
				Home
			</a>
			<a className="menu-item" href="/#/add">
				Add Dataset
			</a>
			<a className="menu-item" href="/#/remove">
				Remove Dataset
			</a>
			<a className="menu-item" href="/#/insight">
				Obtain Insights
			</a>
		</Menu>
	);
};
