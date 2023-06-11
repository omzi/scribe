import { Models } from 'node-appwrite';

export interface BookmarkDocument extends Models.Document {
	postId: string;
	userId: string;
}
