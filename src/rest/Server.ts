import express, { Application, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Log from "@ubccpsc310/folder-test/build/Log";
import * as http from "http";
import cors from "cors";
import { InsightDatasetKind, InsightError } from "../controller/IInsightFacade";
import InsightFacade from "../controller/InsightFacade";

export default class Server {
	private readonly port: number;
	private express: Application;
	private server: http.Server | undefined;
	private insightFacade: InsightFacade;

	constructor(port: number) {
		Log.info(`Server::<init>( ${port} )`);
		this.port = port;
		this.express = express();
		this.insightFacade = new InsightFacade();

		this.registerMiddleware();
		this.registerRoutes();

		// NOTE: you can serve static frontend files in from your express server
		// by uncommenting the line below. This makes files in ./frontend/public
		// accessible at http://localhost:<port>/
		// this.express.use(express.static("./frontend/public"))
	}

	/**
	 * Starts the server. Returns a promise that resolves if success. Promises are used
	 * here because starting the server takes some time and we want to know when it
	 * is done (and if it worked).
	 *
	 * @returns {Promise<void>}
	 */
	public async start(): Promise<void> {
		return new Promise((resolve, reject) => {
			Log.info("Server::start() - start");
			if (this.server !== undefined) {
				Log.error("Server::start() - server already listening");
				reject();
			} else {
				this.server = this.express
					.listen(this.port, () => {
						Log.info(`Server::start() - server listening on port: ${this.port}`);
						resolve();
					})
					.on("error", (err: Error) => {
						// catches errors in server start
						Log.error(`Server::start() - server ERROR: ${err.message}`);
						reject(err);
					});
			}
		});
	}

	/**
	 * Stops the server. Again returns a promise so we know when the connections have
	 * actually been fully closed and the port has been released.
	 *
	 * @returns {Promise<void>}
	 */
	public async stop(): Promise<void> {
		Log.info("Server::stop()");
		return new Promise((resolve, reject) => {
			if (this.server === undefined) {
				Log.error("Server::stop() - ERROR: server not started");
				reject();
			} else {
				this.server.close(() => {
					Log.info("Server::stop() - server closed");
					resolve();
				});
			}
		});
	}

	// Registers middleware to parse request before passing them to request handlers
	private registerMiddleware(): void {
		// JSON parser must be place before raw parser because of wildcard matching done by raw parser below
		this.express.use(express.json());
		this.express.use(express.raw({ type: "application/*", limit: "10mb" }));

		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());
	}

	// Registers all request handlers to routes
	private registerRoutes(): void {
		// This is an example endpoint this you can invoke by accessing this URL in your browser:
		// http://localhost:4321/echo/hello
		this.express.get("/echo/:msg", Server.echo);
		this.express.put("/dataset/:id/:kind", this.putDataset.bind(this));
		this.express.delete("/dataset/:id", this.deleteDataset.bind(this));
		this.express.post("/query", this.query.bind(this));
		this.express.get("/datasets", this.getDatasets.bind(this));
	}

	// The next two methods handle the echo service.
	// These are almost certainly not the best place to put these, but are here for your reference.
	// By updating the Server.echo function pointer above, these methods can be easily moved.
	private static echo(req: Request, res: Response): void {
		try {
			Log.info(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Server.performEcho(req.params.msg);
			res.status(StatusCodes.OK).json({ result: response });
		} catch (err) {
			res.status(StatusCodes.BAD_REQUEST).json({ error: err });
		}
	}

	private static performEcho(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}

	private async putDataset(req: Request, res: Response): Promise<void> {
		try {
			Log.info(`Server::putDataset(..) - params: ${JSON.stringify(req.params)}`);
			const id = req.params.id;
			const kindParam = req.params.kind.toLowerCase();
			let kind: InsightDatasetKind;
			if (kindParam === "sections") {
				kind = InsightDatasetKind.Sections;
			} else if (kindParam === "rooms") {
				kind = InsightDatasetKind.Rooms;
			} else {
				throw new InsightError("Invalid kind");
			}
			const content = req.body.toString("base64");
			const response = await this.insightFacade.addDataset(id, content, kind);
			res.status(StatusCodes.OK).json({ result: response });
		} catch (err) {
			if (err instanceof Error) {
				res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
			} else {
				res.status(StatusCodes.BAD_REQUEST).json({ error: "Unexpect error occurred" });
			}
		}
	}

	private async deleteDataset(req: Request, res: Response): Promise<void> {
		try {
			Log.info(`Server::deleteDataset(..) - params: ${JSON.stringify(req.params)}`);
			const id = req.params.id;
			const response = await this.insightFacade.removeDataset(id);
			res.status(StatusCodes.OK).json({ result: response });
		} catch (err) {
			if (err instanceof InsightError) {
				res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
			} else if (err instanceof Error) {
				res.status(StatusCodes.NOT_FOUND).json({ error: err.message });
			} else {
				res.status(StatusCodes.BAD_REQUEST).json({ error: "Unexpect error occurred" });
			}
		}
	}

	private async query(req: Request, res: Response): Promise<void> {
		try {
			Log.info(`Server::query(..) - params: ${JSON.stringify(req.params)}`);
			const query = req.body;
			const response = await this.insightFacade.performQuery(query);
			res.status(StatusCodes.OK).json({ result: response });
		} catch (err) {
			if (err instanceof Error) {
				res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
			} else {
				res.status(StatusCodes.BAD_REQUEST).json({ error: "Unexpect error occurred" });
			}
		}
	}

	private async getDatasets(req: Request, res: Response): Promise<void> {
		Log.info(`Server::getDatasets(..) - params: ${JSON.stringify(req.params)}`);
		const response = await this.insightFacade.listDatasets();
		res.status(StatusCodes.OK).json({ result: response });
	}
}
