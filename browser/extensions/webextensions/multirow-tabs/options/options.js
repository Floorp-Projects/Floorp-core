/* global browser */
import {
	getOptions,
	setOptions,
	applyOptions,
	defaultOptions,
} from "../background.js";

async function showOptions() {
	const options = await getOptions();
	for (const key in options) {
		const element = document.getElementById(key);
		if (!element) {
			continue;
		}
		if (element.type === "checkbox") {
			element.checked = options[key];
		} else {
			element.value = options[key];
		}
	}
}

function saveOptions() {
	const newOptions = {};
	for (const key in defaultOptions) {
		const element = document.getElementById(key);
		const value = element.type === "checkbox" ? element.checked : element.value;
		newOptions[key] = value;
	}
	setOptions(newOptions).then(applyOptions);
}

function resetOptions() {
	setOptions(defaultOptions).then(applyOptions).then(showOptions);
}

function importOptions(e) {
	const reader = new FileReader();
	let newOptions = {};
	reader.onload = (e) => {
		try {
			newOptions = JSON.parse(e.target.result);
		} catch (error) {
			window.alert(error);
			return;
		}
		setOptions(newOptions).then(applyOptions).then(showOptions);
	};
	reader.readAsText(e.target.files[0]);
}

async function exportOptions() {
	const options = await getOptions();
	const file = new Blob([JSON.stringify(options, null, 4)], {
		type: "application/json",
	});
	const a = document.createElement("a");
	const url = URL.createObjectURL(file);
	const timestamp = new Date().toISOString().replaceAll(":", "-");
	a.href = url;
	a.download = `paxmod-settings-${timestamp}.json`;
	document.body.appendChild(a);
	a.click();
	setTimeout(() => {
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	}, 0);
}

document.addEventListener("DOMContentLoaded", showOptions);

document
	.querySelectorAll(".saveOptionsButton")
	.forEach((x) => x.addEventListener("click", saveOptions));
document
	.querySelectorAll(".resetOptionsButton")
	.forEach((x) => x.addEventListener("click", resetOptions));

document.querySelector("#importFile").addEventListener("change", importOptions);
document
	.querySelector("#exportButton")
	.addEventListener("click", exportOptions);
