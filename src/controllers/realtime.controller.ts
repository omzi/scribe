/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { eventEmitter } from '@utils/eventBus';
import { EventEmitter } from 'events';
import { SessionUser } from '@interfaces/auth.interface';
import { PostDocument } from '@interfaces/post.interface';
import { Like } from '@models/Like';
import { Bookmark } from '@models/Bookmark';

export let connectedClients: {
	id: string;
	isAuthenticated: boolean;
	userData: SessionUser | Record<string, never>;
}[] = [];

type EventSourceData = {
	id?: string | number;
	event: string;
	data: any;
};

class Realtime extends EventEmitter {
	initial: EventSourceData[];
	options: { isSerialized: boolean; isCompressed: boolean };
	id: number;

	constructor(initial?: any, options?: { isSerialized: boolean; isCompressed: boolean }) {
		super();

		if (initial) {
			this.initial = Array.isArray(initial) ? initial : [initial];
		} else {
			this.initial = [];
		}

		if (options) {
			this.options = options;
		} else {
			this.options = { isSerialized: true, isCompressed: false };
		}

		this.id = 0;
		this.init = this.init.bind(this);
	}

	init(req: Request, res: Response) {
		req.socket.setTimeout(0);
		req.socket.setNoDelay(true);
		req.socket.setKeepAlive(true);
		res.statusCode = 200;
		res.setHeader('Content-Type', 'text/event-stream');
		res.setHeader('Cache-Control', 'no-cache');
		res.setHeader('X-Accel-Buffering', 'no');
		if (req.httpVersion !== '2.0') {
			res.setHeader('Connection', 'keep-alive');
		}
		if (this.options.isCompressed) {
			res.setHeader('Content-Encoding', 'deflate');
		}

		// Increase number of event listeners on init
		this.setMaxListeners(this.getMaxListeners() + 2);

		const clientFingerprint = req.query.clientFingerprint;
		console.log('clientFingerprint :>>', clientFingerprint);

		const existingClient = connectedClients.find(client => client.id === clientFingerprint);

		if (!existingClient) {
			const newClient = {
				id: clientFingerprint as string,
				isAuthenticated: req.session.user ? true : false,
				userData: req.session.user ?? {}
			};

			connectedClients.push(newClient);
		} else {
			existingClient.isAuthenticated = req.session.user ? true : false;
			existingClient.userData = req.session.user ?? {};
		}

		console.log('Connected Clients :>>', connectedClients);
		eventEmitter.emit('liveUsers', connectedClients);

		const dataListener = (data: EventSourceData) => {
			const id = data.id ? data.id : this.id++;
			const event = data.event ? `event: ${data.event}\n` : '';
			const serializedData = JSON.stringify(data.data);

			res.write(`id: ${id}\n${event}data: ${serializedData}\n\n`);
			res.flush();
		};

		const serializeListener = (data: any[]) => {
			const serializedData = data.map((message, idx) => `id: ${this.id + idx}\ndata: ${JSON.stringify(message)}\n`).join('');

			res.write(serializedData);
		};

		this.on('data', dataListener);
		this.on('serialize', serializeListener);

		if (this.initial.length > 0) {
			if (this.options.isSerialized) {
				this.serialize(this.initial);
			} else {
				this.send(this.initial as unknown as EventSourceData);
			}
		}

		req.on('close', () => {
			this.removeListener('data', dataListener);
			this.removeListener('serialize', serializeListener);
			this.setMaxListeners(this.getMaxListeners() - 2);
			connectedClients = connectedClients.filter(client => client.id !== clientFingerprint);
		});
	}

	updateInitialData(data: any[]) {
		this.initial = Array.isArray(data) ? data : [data];
	}

	dropInitialData() {
		this.initial = [];
	}

	send({ data, event, id }: EventSourceData) {
		this.emit('data', { data, event, id });
	}

	serialize(data: EventSourceData[]) {
		if (Array.isArray(data)) {
			this.emit('serialize', data);
		} else {
			this.send(data);
		}
	}
}

export const realtime: Realtime = new Realtime();

// Listen for server events
eventEmitter.on('liveUsers', data => {
	realtime.send({ data, event: 'liveUsers' });
});

eventEmitter.on('updateLikesCount', async postId => {
	const updateResponse = (await Like.updateLikesCount(postId)) as PostDocument;
	const responseData = {
		postId,
		likesCount: updateResponse.likesCount
	};

	realtime.send({ data: responseData, event: 'updateLikesCount' });
});

eventEmitter.on('updateBookmarksCount', async postId => {
	const updateResponse = (await Bookmark.updateBookmarksCount(postId)) as PostDocument;
	const responseData = {
		postId,
		bookmarksCount: updateResponse.bookmarksCount
	};

	realtime.send({ data: responseData, event: 'updateBookmarksCount' });
});
