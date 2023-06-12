import { User } from '@models/User';
import { Post } from '@models/Post';
import { appwrite } from '@utils/appwrite';
import { Query } from 'node-appwrite';
import { uuid } from '@utils/uuid';
import { config } from '@root/config';
import { UserDocument } from '@interfaces/auth.interface';
import { LikeDocument } from '@interfaces/like.interface';
import { PostQueryDocument } from '@interfaces/post.interface';

export class Like {
	requestedPostId: string;
	currentUserId: string;
	postId?: string;
	likeId?: string;
	errors: string[];

	constructor(requestedPostId: string, currentUserId: string) {
		this.requestedPostId = requestedPostId;
		this.currentUserId = currentUserId;
		this.errors = [];
	}

	sanitizeData() {
		if (typeof this.requestedPostId !== 'string') this.requestedPostId = '';
	}

	async validate(action: string) {
		// Check user's existence
		const post = await Post.findPostById(this.requestedPostId, this.currentUserId);

		if (post) {
			this.postId = post.$id;
		} else {
			this.errors.push('You cannot like a non-existent post!');
		}

		const [doesLikeAlreadyExist] = (await appwrite.findDocuments(config.LIKES_COLLECTION_ID, [Query.equal('postId', this.postId!), Query.equal('userId', this.currentUserId)])) as LikeDocument[];
		if (doesLikeAlreadyExist) this.likeId = doesLikeAlreadyExist.$id;

		if (action === 'create' && doesLikeAlreadyExist) this.errors.push('You already liked this post!');
		if (action === 'delete' && !doesLikeAlreadyExist) this.errors.push('You have not liked this post!');
	}

	create() {
		return new Promise<string>(async (resolve, reject) => {
			this.sanitizeData();
			await this.validate('create');

			if (!this.errors.length) {
				(await appwrite.createDocument(config.LIKES_COLLECTION_ID, uuid(), {
					postId: this.postId!,
					userId: this.currentUserId
				})) as LikeDocument;

				resolve(this.requestedPostId);
			} else reject(this.errors);
		});
	}

	delete() {
		return new Promise<string>(async (resolve, reject) => {
			this.sanitizeData();
			await this.validate('delete');

			if (!this.errors.length) {
				await appwrite.deleteDocument(config.LIKES_COLLECTION_ID, this.likeId!);

				resolve(this.requestedPostId);
			} else reject(this.errors);
		});
	}

	static async hasUserLiked(postId: string, userId: string) {
		const likeDocument = (await appwrite.findDocuments(config.LIKES_COLLECTION_ID, [Query.equal('postId', postId), Query.equal('userId', userId)])) as LikeDocument[];

		return likeDocument.length > 0 ? true : false;
	}

	static getLikesByPostId(id: string) {
		return new Promise<{ username: string; avatar: string }[]>(async (resolve, reject) => {
			try {
				const likes = (await appwrite.findDocuments(config.FOLLOWS_COLLECTION_ID, [Query.equal('postId', id)])) as LikeDocument[];
				if (likes.length === 0) return resolve([]);

				const arrayOfLikersUserIds = likes.map(like => like.userId);
				const likersUserData = (await appwrite.findDocuments(config.USERS_COLLECTION_ID, [Query.equal('$id', arrayOfLikersUserIds)])) as UserDocument[];

				const likesData = likes.map((_follower, idx) => {
					return {
						username: likersUserData[idx].username,
						avatar: User.getAvatar(likersUserData[idx].email)
					};
				});

				resolve(likesData);
			} catch (error) {
				reject();
			}
		});
	}

	static getPostsLikedByUser(id: string) {
		return new Promise<PostQueryDocument[]>(async (resolve, reject) => {
			try {
				const likes = (await appwrite.findDocuments(config.FOLLOWS_COLLECTION_ID, [Query.equal('userId', id)])) as LikeDocument[];
				if (likes.length === 0) return resolve([]);

				const arrayOfLikesPostIds = likes.map(like => like.postId);
				const postsData = (await Post.postsQuery([Query.equal('postId', arrayOfLikesPostIds)], id)) as PostQueryDocument[];

				resolve(postsData);
			} catch (error) {
				reject();
			}
		});
	}

	static async updateLikesCount(postId: string) {
		const likes = (await appwrite.findDocuments(config.LIKES_COLLECTION_ID, [Query.equal('postId', postId)])) as LikeDocument[];
		const likesCount = likes.length;

		// Update the likesCount attribute of the post in the Posts collection
		const response = await appwrite.updateDocument(config.POSTS_COLLECTION_ID, postId, { likesCount });

		return response;
	}
}
