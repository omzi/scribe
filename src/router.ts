import { Router } from 'express';
import {
	home,
	register,
	login,
	logout,
	doesUsernameExist,
	doesEmailExist,
	authRequired,
	requestAuthRequired,
	ifUserExists,
	userProfile,
	sharedProfileData,
	userProfileFollowers,
	userProfileFollowing
} from '@controllers/auth.controller';
import { viewCreatePost, createPost, viewPost, viewUpdatePost, updatePost, deletePost, search } from '@controllers/post.controller';
import { addFollower, removeFollower } from '@controllers/follow.controller';
import { addLike, removeLike } from '@controllers/like.controller';
import { addBookmark, removeBookmark } from '@controllers/bookmark.controller';
import { realtime } from '@controllers/realtime.controller';

class RootRouter {
	public router: Router;

	constructor() {
		this.router = Router();
		this.setupRoutes();
	}

	private setupRoutes(): void {
		// User Auth Routes
		this.router.get('/', home);
		this.router.post('/register', register);
		this.router.post('/login', login);
		this.router.post('/logout', logout);
		this.router.post('/doesUsernameExist', doesUsernameExist);
		this.router.post('/doesEmailExist', doesEmailExist);

		// User Profile Route
		this.router.get('/@:username([a-z0-9]{3,30})', ifUserExists, sharedProfileData, userProfile);
		this.router.get('/@:username([a-z0-9]{3,30})/followers', ifUserExists, sharedProfileData, userProfileFollowers);
		this.router.get('/@:username([a-z0-9]{3,30})/following', ifUserExists, sharedProfileData, userProfileFollowing);

		// Post Routes
		this.router.get('/create-post', authRequired, viewCreatePost);
		this.router.post('/createPost', authRequired, createPost);
		this.router.get('/@:username([a-z0-9]{3,30})/post/:slug', ifUserExists, viewPost);
		this.router.route('/@:username([a-z0-9]{3,30})/posts/edit/:slug').get(authRequired, ifUserExists, viewUpdatePost).post(authRequired, ifUserExists, updatePost);
		this.router.post('/@:username([a-z0-9]{3,30})/posts/delete/:slug', authRequired, ifUserExists, deletePost);

		// Search Route
		this.router.post('/search', search);

		// Follow Routes
		this.router.post('/addFollowerTo/:username([a-z0-9]{3,30})', authRequired, addFollower);
		this.router.post('/removeFollowerFrom/:username([a-z0-9]{3,30})', authRequired, removeFollower);

		// Like Routes
		this.router.post('/addLikeTo/:postId', requestAuthRequired, addLike);
		this.router.post('/removeLikeFrom/:postId', requestAuthRequired, removeLike);

		// Bookmark Routes
		this.router.post('/addBookmarkTo/:postId', requestAuthRequired, addBookmark);
		this.router.post('/removeBookmarkFrom/:postId', requestAuthRequired, removeBookmark);

		// Realtime Route (SSE)
		this.router.get('/realtime', realtime.init);
	}
}

export const router: Router = new RootRouter().router;
