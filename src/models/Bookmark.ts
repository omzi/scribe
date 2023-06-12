import { User } from '@models/User';
import { Post } from '@models/Post';
import { appwrite } from '@utils/appwrite';
import { Query } from 'node-appwrite';
import { uuid } from '@utils/uuid';
import { config } from '@root/config';
import { UserDocument } from '@interfaces/auth.interface';
import { BookmarkDocument } from '@interfaces/bookmark.interface';
import { PostQueryDocument } from '@interfaces/post.interface';

export class Bookmark {
	requestedPostId: string;
	currentUserId: string;
	postId?: string;
	bookmarkId?: string;
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
			this.errors.push('You cannot bookmark a non-existent post!');
		}

		const [doesBookmarkAlreadyExist] = (await appwrite.findDocuments(config.BOOKMARKS_COLLECTION_ID, [Query.equal('postId', this.postId!), Query.equal('userId', this.currentUserId)])) as BookmarkDocument[];
		if (doesBookmarkAlreadyExist) this.bookmarkId = doesBookmarkAlreadyExist.$id;

		if (action === 'create' && doesBookmarkAlreadyExist) this.errors.push('You already bookmarked this post!');
		if (action === 'delete' && !doesBookmarkAlreadyExist) this.errors.push('You have not bookmarked this post!');
	}

	create() {
		return new Promise<string>(async (resolve, reject) => {
			this.sanitizeData();
			await this.validate('create');

			if (!this.errors.length) {
				await appwrite.createDocument(config.BOOKMARKS_COLLECTION_ID, uuid(), {
					postId: this.postId!,
					userId: this.currentUserId
				});

				resolve(this.requestedPostId);
			} else reject(this.errors);
		});
	}

	delete() {
		return new Promise<string>(async (resolve, reject) => {
			this.sanitizeData();
			await this.validate('delete');

			if (!this.errors.length) {
				await appwrite.deleteDocument(config.BOOKMARKS_COLLECTION_ID, this.bookmarkId!);

				resolve(this.requestedPostId);
			} else reject(this.errors);
		});
	}

	static async hasUserBookmarked(postId: string, userId: string) {
		const bookmarkDocument = (await appwrite.findDocuments(config.BOOKMARKS_COLLECTION_ID, [Query.equal('postId', postId), Query.equal('userId', userId)])) as BookmarkDocument[];

		return bookmarkDocument.length > 0 ? true : false;
	}

	static getBookmarksByPostId(id: string) {
		return new Promise<{ username: string; avatar: string }[]>(async (resolve, reject) => {
			try {
				const bookmarks = (await appwrite.findDocuments(config.FOLLOWS_COLLECTION_ID, [Query.equal('postId', id)])) as BookmarkDocument[];
				if (bookmarks.length === 0) return resolve([]);

				const arrayOfBookmarkersUserIds = bookmarks.map(bookmark => bookmark.userId);
				const bookmarkersUserData = (await appwrite.findDocuments(config.USERS_COLLECTION_ID, [Query.equal('$id', arrayOfBookmarkersUserIds)])) as UserDocument[];

				const bookmarksData = bookmarks.map((_follower, idx) => {
					return {
						username: bookmarkersUserData[idx].username,
						avatar: User.getAvatar(bookmarkersUserData[idx].email)
					};
				});

				resolve(bookmarksData);
			} catch (error) {
				reject();
			}
		});
	}

	static getPostsBookmarkedByUser(id: string) {
		return new Promise<PostQueryDocument[]>(async (resolve, reject) => {
			try {
				const bookmarks = (await appwrite.findDocuments(config.FOLLOWS_COLLECTION_ID, [Query.equal('userId', id)])) as BookmarkDocument[];
				if (bookmarks.length === 0) return resolve([]);

				const arrayOfBookmarksPostIds = bookmarks.map(bookmark => bookmark.postId);
				const postsData = (await Post.postsQuery([Query.equal('postId', arrayOfBookmarksPostIds)], id)) as PostQueryDocument[];

				resolve(postsData);
			} catch (error) {
				reject();
			}
		});
	}

	static async updateBookmarksCount(postId: string) {
		const bookmarks = (await appwrite.findDocuments(config.BOOKMARKS_COLLECTION_ID, [Query.equal('postId', postId)])) as BookmarkDocument[];
		const bookmarksCount = bookmarks.length;

		// Update the bookmarksCount attribute of the post in the Posts collection
		const response = await appwrite.updateDocument(config.POSTS_COLLECTION_ID, postId, { bookmarksCount });

		return response;
	}
}
