const connectToTerminalInterface = document.getElementById(
	"connectToTerminalInterface",
);
const terminalAddress = document.getElementById("terminalAddress");
const terminalPort = document.getElementById("terminalPort");

const terminalInterface = document.getElementById("terminalInterface");

const accountInterface = document.getElementById("accountInterface");

const accountKey = document.getElementById("accountKey");
const transferValue = document.getElementById("transferValue");

const terminalScreen = document.getElementById("terminalScreen");
const terminalTitle = document.getElementById("terminalTitle");
const terminalMsg = document.getElementById("terminalMsg");

const init = () => {
	console.log(connectToTerminalInterface);
	switchInterface("menu");
};

const connectToTerminal = async () => {
	const address = terminalAddress.value;
	const port = terminalPort.value;

	const request = buildReq("", {
		"hostname": address,
		"port": parseInt(port),
	});

	try {
		const response = await fetch(request);
		if (!response.ok) {
			throw new Error(`Response status: ${response.status}`);
		}

		switchInterface("terminal");
	} catch (error) {
		alert(`Failed to connect to ${address}:${port}`);
		console.error(error.message);
	}
};

const createAccount = async () => {
	const address = terminalAddress.value;
	const port = terminalPort.value;

	const request = buildReq("new", {
		"hostname": address,
		"port": parseInt(port),
		"type": "counter",
	});

	try {
		const response = await fetch(request);
		if (!response.ok) {
			throw new Error(`Response status: ${response.status}`);
		}

		json = await response.json();

		writeToScreen(`Account created: ${json.key}`);
	} catch (error) {
		writeToScreen(`Failed to create account`);
		console.error(error.message);
	}
};

const checkAccountBalance = async () => {
	const address = terminalAddress.value;
	const port = terminalPort.value;

	const key = accountKey.value;

	const request = buildReq("get", {
		"hostname": address,
		"port": parseInt(port),
		"key": key,
	});

	try {
		const response = await fetch(request);
		if (!response.ok) {
			throw new Error(`Response status: ${response.status}`);
		}

		json = await response.json();

		writeToScreen(`Account balance: ${json.value}`);
	} catch (error) {
		writeToScreen(`Failed to retrieve account balance`);
		console.error(error.message);
	}
};

const depositToAccount = async () => {
	const address = terminalAddress.value;
	const port = terminalPort.value;

	const key = accountKey.value;
	const value = parseInt(transferValue.value);

	const request = buildReq("inc", {
		"hostname": address,
		"port": parseInt(port),
		"key": key,
		"value": value,
	});

	try {
		const response = await fetch(request);
		if (!response.ok) {
			throw new Error(`Response status: ${response.status}`);
		}

		writeToScreen(`Deposited ${value}`);
	} catch (error) {
		writeToScreen(`Failed to deposit ${value}`);
		console.error(error.message);
	}
};

const withdrawFromAccount = async () => {
	const address = terminalAddress.value;
	const port = terminalPort.value;

	const key = accountKey.value;
	const value = parseInt(transferValue.value);

	const request = buildReq("dec", {
		"hostname": address,
		"port": parseInt(port),
		"key": key,
		"value": value,
	});

	try {
		const response = await fetch(request);
		if (!response.ok) {
			throw new Error(`Response status: ${response.status}`);
		}

		writeToScreen(`Withdrew ${value}`);
	} catch (error) {
		writeToScreen(`Failed to withdraw ${value}`);
		console.error(error.message);
	}
};

const openAccountInterface = () => {
	switchInterface("account");
};

const exitTerminal = () => {
	switchInterface("menu");
};

const switchInterface = (inter) => {
	connectToTerminalInterface.hidden = true;
	terminalInterface.hidden = true;
	accountInterface.hidden = true;
	accountKey.value = "";
	transferValue.value = 0;
	toggleTerminalScreen(false);
	switch (inter) {
		case "account":
			toggleTerminalScreen(true, "Account Interface");
			accountInterface.hidden = false;
			break;
		case "terminal":
			toggleTerminalScreen(true, "Create an account today! It's easy!");
			terminalInterface.hidden = false;
			break;
		case "menu":
		default:
			connectToTerminalInterface.hidden = false;
	}
};

const toggleTerminalScreen = (hide, title = "") => {
	terminalScreen.hidden = !hide;
	clearScreen();
	terminalTitle.textContent = title;
};

const writeToScreen = (msg) => {
	terminalMsg.textContent = msg;
};

const clearScreen = () => {
	terminalMsg.textContent = "";
};

const buildReq = (endpoint, body) => {
	return new Request("http://localhost:8001/" + endpoint, {
		method: "POST",
		body: JSON.stringify(body),
		headers: {
			"Content-Type": "application/json",
		},
	});
};

init();
