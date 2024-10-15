export enum CRDT_TYPE {
	CRDT_COUNTER = "counter",
	CRDT_GSET = "gset",
	CRDT_2PSET = "2pset",
}

export class BFTKVStore {
	#hostname: string = "";
	#port: number = 8089;
	encoder: TextEncoder = new TextEncoder();

	constructor(
		hostname: string,
		port: number,
	) {
		this.#hostname = hostname;
		this.#port = port;
	}

	changeServer = async (
		hostname: string,
		port: number,
	): Promise<boolean> => {
		this.#hostname = hostname;
		this.#port = port;

		const res: string | boolean = await this.#sendTCP("PING", "");

		if (typeof res != "boolean") {
			return (res.length >= 4 && res.slice(0, 4) == "PONG");
		}
		return false;
	};

	newCrdt = async (
		type: CRDT_TYPE,
	): Promise<{ res: object | null; ok: boolean }> => {
		const res: string | boolean = await this.#sendTCP(
			"/new",
			JSON.stringify({ "type": type }),
		);

		if (typeof res != "boolean") {
			if (res.length > 4 && res.slice(0, 4) == "R_OK") {
				const obj: { key: string } = JSON.parse(res.slice(4));
				return { res: obj, ok: true };
			}
		}
		return { res: null, ok: false };
	};

	getCrdt = async (
		key: string,
	): Promise<{ res: object | null; ok: boolean }> => {
		const res: string | boolean = await this.#sendTCP(
			"/get",
			JSON.stringify({ "key": key }),
		);

		if (typeof res != "boolean") {
			if (res.length > 4 && res.slice(0, 4) == "R_OK") {
				const obj: { key: string; value: any; type: CRDT_TYPE } = JSON
					.parse(res.slice(4));
				return { res: obj, ok: true };
			}
		}
		return { res: null, ok: false };
	};

	incCrdt = async (
		key: string,
		value: number,
	): Promise<boolean> => {
		const res: string | boolean = await this.#sendTCP(
			"/inc",
			JSON.stringify({ "key": key, "value": value }),
		);

		if (typeof res != "boolean") {
			return (res.length >= 4 && res.slice(0, 4) == "R_OK");
		}
		return false;
	};

	decCrdt = async (
		key: string,
		value: number,
	): Promise<boolean> => {
		const res: string | boolean = await this.#sendTCP(
			"/dec",
			JSON.stringify({ "key": key, "value": value }),
		);

		if (typeof res != "boolean") {
			return (res.length >= 4 && res.slice(0, 4) == "R_OK");
		}
		return false;
	};

	addCrdt = async (
		key: string,
		value: string | number,
	): Promise<boolean> => {
		const res: string | boolean = await this.#sendTCP(
			"/add",
			JSON.stringify({ "key": key, "value": value }),
		);

		if (typeof res != "boolean") {
			return (res.length >= 4 && res.slice(0, 4) == "R_OK");
		}
		return false;
	};

	rmvCrdt = async (
		key: string,
		value: string | number,
	): Promise<boolean> => {
		const res: string | boolean = await this.#sendTCP(
			"/rmv",
			JSON.stringify({ "key": key, "value": value }),
		);

		if (typeof res != "boolean") {
			return (res.length >= 4 && res.slice(0, 4) == "R_OK");
		}
		return false;
	};

	#sendTCP = async (
		head: string,
		content: string,
	): Promise<string | boolean> => {
		try {
			const conn = await Deno.connect({
				hostname: this.#hostname,
				port: this.#port,
			});

			const headEncoded = this.encoder.encode(head);
			const contentEncoded = this.encoder.encode(content);

			const toWrite = new Uint8Array(
				4 + 2 + contentEncoded.length,
			);

			for (let i = 0; i < 4; i++) {
				toWrite[i] = headEncoded[i];
			}

			const size = contentEncoded.length;
			toWrite[4] = (size & 0xff00) >> 8;
			toWrite[5] = size & 0x00ff;

			for (let i = 0; i < contentEncoded.length; i++) {
				toWrite[i + 6] = contentEncoded[i];
			}

			await conn.write(
				toWrite,
			);

			let buf = new Uint8Array(1000);
			const n = await conn.read(buf) || 0;
			buf = buf.slice(0, n);

			const res = new Uint8Array(Math.max(buf.length - 2, 0));
			for (let i = 0; i < buf.length; i++) {
				if (i == 4 || i == 5) continue;
				if (i < 4) {
					res[i] = buf[i];
				} else if (i > 5) {
					res[i - 2] = buf[i];
				}
			}

			const response = new TextDecoder().decode(res);
			conn.close();
			return response;
		} catch (e) {
			console.log("Error sending TCP", e);
			return false;
		}
	};
}
