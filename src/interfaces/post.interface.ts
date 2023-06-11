import { Models } from 'node-appwrite';

export type PostData = {
	title: string;
	body: string;
	visibility: 'public' | 'followers' | 'private';
};

export interface PostDocument extends Models.Document, PostData {
	author: string;
	slug: string;
	search: string;
	likesCount: number;
	bookmarksCount: number;
}

export interface PostQueryDocument extends Models.Document, PostData {
	author: {
		username: string;
		avatar: string;
	};
	slug: string;
	search: string;
	likesCount: number;
	bookmarksCount: number;
	hasUserLiked: boolean;
	hasUserBookmarked: boolean;
	isVisitorAuthor: boolean;
	isVisitorFollower: boolean;
}
