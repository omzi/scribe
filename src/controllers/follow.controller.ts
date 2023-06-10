import { Request, Response } from 'express';
import { Follow } from '@models/Follow';

export const addFollower = (req: Request, res: Response) => {
	const follow = new Follow(req.params.username, req.currentUserId!);
	follow
		.create()
		.then(() => {
			req.flash('successMessages', `Successfully followed <b>${req.params.username}</b> ✨!`);
			req.session.save(() => res.redirect(`/@${req.params.username}`));
		})
		.catch((errors: string[]) => {
			errors.forEach(error => req.flash('errorMessages', error));
			req.session.save(() => res.redirect('/'));
		});
};

export const removeFollower = (req: Request, res: Response) => {
	const follow = new Follow(req.params.username, req.currentUserId!);
	follow
		.delete()
		.then(() => {
			req.flash('infoMessages', `Successfully stopped following <b>${req.params.username}</b>.`);
			req.session.save(() => res.redirect(`/@${req.params.username}`));
		})
		.catch((errors: string[]) => {
			errors.forEach(error => req.flash('errorMessages', error));
			req.session.save(() => res.redirect('/'));
		});
};
