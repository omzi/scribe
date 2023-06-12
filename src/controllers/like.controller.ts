import { Request, Response } from 'express';
import { Like } from '@models/Like';
import { eventEmitter } from '@utils/eventBus';

export const addLike = (req: Request, res: Response) => {
	const like = new Like(req.params.postId, req.currentUserId!);
	like
		.create()
		.then(postId => {
			eventEmitter.emit('updateLikesCount', postId);

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
		.then(postId => {
			eventEmitter.emit('updateLikesCount', postId);

			return res.json({ status: 'success', data: {}, message: 'Post unliked successfully ⚡.' });
		})
		.catch((errors: string[]) => {
			return res.status(400).json({ status: 'failure', data: {}, errors });
		});
};
