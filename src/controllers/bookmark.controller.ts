import { Request, Response } from 'express';
import { Bookmark } from '@models/Bookmark';
import { eventEmitter } from '@utils/eventBus';

export const addBookmark = (req: Request, res: Response) => {
	const like = new Bookmark(req.params.postId, req.currentUserId!);
	like
		.create()
		.then(postId => {
			eventEmitter.emit('updateBookmarksCount', postId);

			return res.json({ status: 'success', data: {}, message: 'Post bookmarked successfully 📌!' });
		})
		.catch((errors: string[]) => {
			return res.status(400).json({ status: 'failure', data: {}, errors });
		});
};

export const removeBookmark = (req: Request, res: Response) => {
	const like = new Bookmark(req.params.postId, req.currentUserId!);
	like
		.delete()
		.then(postId => {
			eventEmitter.emit('updateBookmarksCount', postId);

			return res.json({ status: 'success', data: {}, message: 'Post unbookmarked successfully ⚡.' });
		})
		.catch((errors: string[]) => {
			return res.status(400).json({ status: 'failure', data: {}, errors });
		});
};
