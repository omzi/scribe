import { Request, Response } from 'express';
import { Like } from '@models/Like';

export const addLike = (req: Request, res: Response) => {
	const like = new Like(req.params.postId, req.currentUserId!);
	like
		.create()
		.then(() => {
			return res.json({ status: 'success', data: {}, message: 'Post liked successfully ❤️!' });
		})
		.catch((errors: string[]) => {
			return res.status(400).json({ status: 'failure', data: {}, errors });
		});
};

export const removeLike = (req: Request, res: Response) => {
	const like = new Like(req.params.postId, req.currentUserId!);
	like
		.delete()
		.then(() => {
			return res.json({ status: 'success', data: {}, message: 'Post unliked successfully ⚡.' });
		})
		.catch((errors: string[]) => {
			return res.status(400).json({ status: 'failure', data: {}, errors });
		});
};
