import { NextFunction, Request, Response } from 'express';
import { User } from '@models/User';
import { Post } from '@models/Post';
import { Follow } from '@models/Follow';
import { SessionUser } from '@interfaces/auth.interface';
const context: {
	[key: string]: string | boolean | NonNullable<unknown> | [];
} = {};

export const login = (req: Request, res: Response) => {
	const user = new User(req.body);
	user
		.login()
		.then(() => {
			req.session.user = {
				username: user.data.username,
				avatar: user.avatar,
				id: user.id
			} as SessionUser;
			req.flash('successMessages', `Heyyy, <b>${user.data.username}</b>! Welcome back 🙂`);
			req.session.save(() => res.redirect('/'));
		})
		.catch(error => {
			req.flash('errorMessages', error);
			req.session.save(() => {
				req.headers.referer && req.headers.referer.startsWith(req.headers.origin as string) ? res.redirect(req.headers.referer) : res.redirect('/');
			});
		});
};

export const logout = (req: Request, res: Response) => {
	req.session.destroy(() => res.redirect('/'));
};

export const doesUsernameExist = async (req: Request, res: Response) => {
	const usernameExists = await User.findByUsername(req.body.username);
	res.json(usernameExists);
};

export const doesEmailExist = async (req: Request, res: Response) => {
	const emailExists = await User.doesEmailExist(req.body.email);
	res.json(emailExists);
};

export const register = (req: Request, res: Response) => {
	const user = new User(req.body);
	user
		.register()
		.then(() => {
			req.session.user = {
				username: user.data.username,
				avatar: user.avatar,
				id: user.id
			} as SessionUser;
			// Send to FE to show new user onboarding
			req.flash('newUser', true.toString());
			req.session.save(() => res.redirect('/'));
		})
		.catch((errors: string[]) => {
			errors.forEach(error => req.flash('errorMessages', error));
			req.session.save(() => res.redirect('/'));
		});
};

export const home = async (req: Request, res: Response) => {
	if (req.session.user) {
		// Fetch current user's feed
		const feedPosts = await Post.getUserFeed(req.currentUserId!);

		context.title = 'Your Feed';
		context.feedPosts = feedPosts;

		res.render('home-dashboard', context);
	} else {
		context.title = 'Home';

		res.render('home-guest', context);
	}
};

export const authRequired = (req: Request, res: Response, next: NextFunction) => {
	if (req.session.user) {
		next();
	} else {
		req.flash('errorMessages', 'Unauthorised! You must be logged in to proceed.');
		req.session.save(() => res.redirect('/'));
	}
};

export const requestAuthRequired = (req: Request, res: Response, next: NextFunction) => {
	if (req.session.user) {
		next();
	} else {
		res.status(401).json({ status: 'failure', message: 'Unauthorised! You must be logged in to proceed.' });
	}
};

export const ifUserExists = async (req: Request, res: Response, next: NextFunction) => {
	const user = await User.findByUsername(req.params.username);

	if (user) {
		req.profileUser = user;
		next();
	} else res.render('404');
};

export const sharedProfileData = async (req: Request, res: Response, next: NextFunction) => {
	const profileUser = req.profileUser as SessionUser;
	let isUserOnOwnProfile = false;
	let isFollowing = false;

	if (req.session.user) {
		isUserOnOwnProfile = profileUser.id === req.currentUserId;
		isFollowing = await Follow.isUserFollowing(profileUser.id, req.currentUserId!);
	}

	req.isUserOnOwnProfile = isUserOnOwnProfile;
	req.isFollowing = isFollowing;

	// Fetch user data count
	const postCountPromise = Post.userPostsCount(profileUser.id, req.currentUserId!);
	const followersCountPromise = Follow.userFollowersCount(profileUser.id);
	const followingCountPromise = Follow.userFollowingCount(profileUser.id);

	const [postCount, followersCount, followingCount] = await Promise.all([postCountPromise, followersCountPromise, followingCountPromise]);

	req.postCount = postCount;
	req.followersCount = followersCount;
	req.followingCount = followingCount;

	next();
};

export const userProfile = (req: Request, res: Response) => {
	const profileUser = req.profileUser as SessionUser;

	// Fetch user posts
	Post.findPostsByAuthorId(profileUser.id, req.currentUserId)
		.then(posts => {
			context.activeTab = 'profilePosts';
			context.profileUser = profileUser;
			context.title = `${profileUser.username}'s Profile`;
			context.userPosts = posts;
			context.isFollowing = req.isFollowing;
			context.isUserOnOwnProfile = req.isUserOnOwnProfile;

			context.postCount = req.postCount;
			context.followersCount = req.followersCount;
			context.followingCount = req.followingCount;

			console.log('User Posts ::', posts);

			res.render('profile', context);
		})
		.catch(() => {
			res.render('404');
		});
};

export const userProfileFollowers = async (req: Request, res: Response) => {
	const profileUser = req.profileUser as SessionUser;

	try {
		const followers = await Follow.getFollowersByUserId(profileUser.id);

		context.activeTab = 'profileFollowers';
		context.profileUser = profileUser;
		context.title = `${profileUser.username}'s Profile`;
		context.isFollowing = req.isFollowing;
		context.isUserOnOwnProfile = req.isUserOnOwnProfile;
		context.followers = followers;

		context.postCount = req.postCount;
		context.followersCount = req.followersCount;
		context.followingCount = req.followingCount;

		res.render('profile-followers', context);
	} catch (error) {
		res.render('404');
	}
};

export const userProfileFollowing = async (req: Request, res: Response) => {
	const profileUser = req.profileUser as SessionUser;

	try {
		const following = await Follow.getFollowedUsersByUserId(profileUser.id);

		context.activeTab = 'profileFollowing';
		context.profileUser = profileUser;
		context.title = `${profileUser.username}'s Profile`;
		context.isFollowing = req.isFollowing;
		context.isUserOnOwnProfile = req.isUserOnOwnProfile;
		context.following = following;

		context.postCount = req.postCount;
		context.followersCount = req.followersCount;
		context.followingCount = req.followingCount;

		res.render('profile-following', context);
	} catch (error) {
		res.render('404');
	}
};
