import { Models } from 'node-appwrite';

export interface FollowDocument extends Models.Document {
	followedId: string;
	userId: string;
}
