import { Models } from 'node-appwrite';

export interface LikeDocument extends Models.Document {
	postId: string;
	userId: string;
}
