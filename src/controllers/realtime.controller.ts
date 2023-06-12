/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { eventEmitter } from '@utils/eventBus';
import { EventEmitter } from 'events';
import { generateRandomId } from '@utils/generateRandomId';
import { SessionUser } from '@interfaces/auth.interface';
import { PostDocument } from '@interfaces/post.interface';
import { Like } from '@models/Like';
import { Bookmark } from '@models/Bookmark';

export let connectedClients: {
	id: string;
	isAuthenticated: boolean;
	userData: SessionUser | Record<string, never>;
}[] = [];

class Realtime extends EventEmitter {
	initial: any[];
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

		const clientId = generateRandomId(24);
		const newClient = {
			id: clientId,
			isAuthenticated: req.session.user ? true : false,
			userData: req.session.user ?? {}
		};

		connectedClients.push(newClient);
		console.log('Connected Clients :>>', connectedClients);
		eventEmitter.emit('liveUsers', connectedClients);

		const dataListener = (data: any) => {
			const id = data.id ? data.id : this.id++;
			const event = data.event ? `event: ${data.event}\n` : '';
			const serializedData = JSON.stringify(data.data);

			res.write(`id: ${id}\n${event}data: ${serializedData}\n\n`);
			res.flush();
		};

		const serializeListener = (data: any[]) => {
			const serializedData = data.map((msg, index) => `id: ${this.id + index}\ndata: ${JSON.stringify(msg)}\n`).join('');

			res.write(serializedData);
		};

		this.on('data', dataListener);
		this.on('serialize', serializeListener);

		if (this.initial.length > 0) {
			if (this.options.isSerialized) {
				this.serialize(this.initial);
			} else {
				this.send(this.initial);
			}
		}

		req.on('close', () => {
			this.removeListener('data', dataListener);
			this.removeListener('serialize', serializeListener);
			this.setMaxListeners(this.getMaxListeners() - 2);
			connectedClients = connectedClients.filter(client => client.id !== clientId);
		});
	}

	updateInit(data: any[]) {
		this.initial = Array.isArray(data) ? data : [data];
	}

	dropInit() {
		this.initial = [];
	}

	send(data: any, event?: string, id?: string | number) {
		this.emit('data', { data, event, id });
	}

	serialize(data: any[]) {
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
	realtime.send(data, 'liveUsers');
});

eventEmitter.on('updateLikesCount', async postId => {
	const updateResponse = (await Like.updateLikesCount(postId)) as PostDocument;
	const responseData = {
		postId,
		likesCount: updateResponse.likesCount
	};

	realtime.send(responseData, 'updateLikesCount');
});

eventEmitter.on('updateBookmarksCount', async postId => {
	const updateResponse = (await Bookmark.updateBookmarksCount(postId)) as PostDocument;
	const responseData = {
		postId,
		bookmarksCount: updateResponse.bookmarksCount
	};

	realtime.send(responseData, 'updateBookmarksCount');
});
