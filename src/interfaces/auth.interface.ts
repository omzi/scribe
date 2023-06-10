import { Models } from 'node-appwrite';

// To add the 'currentUser' property to the request object
declare global {
	namespace Express {
		interface Request {
			currentUser?: string;
			currentUserId?: string;
			profileUser?: SessionUser | boolean;
			isUserOnOwnProfile: boolean;
			isFollowing: boolean;
			postCount: number;
			followersCount: number;
			followingCount: number;
		}
	}
}

declare module 'express-session' {
	interface SessionData {
		user?: SessionUser;
	}
}

export type SessionUser = {
	username: string;
	avatar: string;
	id: string;
};

export type AuthData = {
	mobileLoginUsername?: string;
	desktopLoginUsername?: string;
	mobileLoginPassword?: string;
	desktopLoginPassword?: string;
	username?: string;
	email?: string;
	password: string;
};

export interface UserDocument extends Models.Document, AuthData {
	username: string;
	email: string;
}
