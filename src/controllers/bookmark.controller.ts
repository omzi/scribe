import { Request, Response } from 'express';
import { Bookmark } from '@models/Bookmark';

export const addBookmark = (req: Request, res: Response) => {
	const like = new Bookmark(req.params.postId, req.currentUserId!);
	like
		.create()
		.then(() => {
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
		.then(() => {
			return res.json({ status: 'success', data: {}, message: 'Post unbookmarked successfully ⚡.' });
		})
		.catch((errors: string[]) => {
			return res.status(400).json({ status: 'failure', data: {}, errors });
		});
};
