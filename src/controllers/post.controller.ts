import { Request, Response } from 'express';
import { Post } from '@models/Post';
const context: {
	[key: string]: string | boolean | null | NonNullable<unknown> | [];
} = {};

export const viewCreatePost = (req: Request, res: Response) => {
	context.title = 'Create Post';

	res.render('create-post', context);
};

export const createPost = (req: Request, res: Response) => {
	const post = new Post(req.body, req.session.user!.id);
	post
		.create()
		.then(post => {
			req.flash('successMessages', 'Post created successfully ✨!');
			req.session.save(() => res.redirect(`/@${req.session.user!.username}/post/${post.slug}`));
		})
		.catch((errors: string[]) => {
			errors.forEach(error => req.flash('errorMessages', error));
			req.session.save(() => res.redirect('/create-post'));
		});
};

export const viewPost = async (req: Request, res: Response) => {
	try {
		const post = await Post.findPostBySlug(req.params.username, req.params.slug, req.currentUserId!);
		context.post = post;
		context.title = `${post.title} ~ @${post.author.username}`;

		res.render('view-post', context);
	} catch (error) {
		context.title = 'Post Not Found :(';

		res.render('404-post', context);
	}
};

export const viewUpdatePost = async (req: Request, res: Response) => {
	try {
		const post = await Post.findPostBySlug(req.params.username, req.params.slug, req.currentUserId!);

		if (post.isVisitorAuthor) {
			context.post = post;
			context.title = `Edit Post ~ @${post.author.username}`;
			context.updatedUrl = req.flash('updatedUrl').pop() || null;

			res.render('edit-post', context);
		} else {
			req.flash('errorMessages', 'Unauthorised to access this route');
			req.session.save(() => res.redirect('/'));
		}
	} catch (error) {
		res.render('404');
		// res.redirect(`/@${username}/posts`);
	}
};

export const updatePost = (req: Request, res: Response) => {
	const post = new Post(req.body, req.currentUserId!, req.params.slug);
	post
		.update(req.params.username)
		.then(status => {
			// Post was successfully updated to the database
			// Or user with permission had validation errors
			if (status === 'success') {
				// Post was updated to db
				req.flash('successMessages', 'Post successfully updated 🦄!');
				req.flash('updatedUrl', `/@${req.params.username}/post/${post.data.slug}`);
				req.session.save(() => res.redirect(`/@${req.params.username}/posts/edit/${post.data.slug}`));
			} else {
				post.errors.forEach(error => req.flash('errorMessages', error));
				req.session.save(() => res.redirect(`/@${req.params.username}/posts/edit/${req.params.slug}`));
			}
		})
		.catch(() => {
			// Post with requested id does not exist
			// Or if current visitor is not the owner of the requested post
			req.flash('errorMessages', 'Unauthorised to perform that action!');
			req.session.save(() => res.redirect('/'));
		});
};

export const deletePost = (req: Request, res: Response) => {
	Post.delete(req.params.username, req.params.slug, req.currentUserId!)
		.then(() => {
			req.flash('infoMessages', 'Post successfully deleted 🚮!');
			req.session.save(() => res.redirect(`/@${req.params.username}`));
		})
		.catch(() => {
			req.flash('errorMessages', 'Unauthorised to perform that action!');
			req.session.save(() => res.redirect('/'));
		});
};

export const search = (req: Request, res: Response) => {
	Post.search(req.body.searchQuery, req.currentUserId)
		.then(posts => {
			res.json(posts);
		})
		.catch(() => {
			res.json([]);
		});
};
