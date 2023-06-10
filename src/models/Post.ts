import { User } from '@models/User';
import { Follow } from '@models/Follow';
import slugify from 'slugify';
import sanitizeHTML from 'sanitize-html';
import { uuid } from '@utils/uuid';
import { generateRandomId } from '@utils/generateRandomId';
import { appwrite } from '@utils/appwrite';
import { Query } from 'node-appwrite';
import { config } from '@root/config';
import { PostDocument, PostQueryDocument } from '@interfaces/post.interface';
import { UserDocument } from '@interfaces/auth.interface';
import { FollowDocument } from '@interfaces/follow.interface';
const visibilityStates = ['public', 'followers', 'private'];

export class Post {
	errors: string[];
	data: Partial<PostDocument>;
	author: string;
	requestedPostSlug?: string;

	constructor(data: Pick<PostDocument, 'title' | 'body' | 'visibility'>, author: string, requestedPostSlug?: string) {
		this.errors = [];
		this.data = data;
		this.author = author;
		this.requestedPostSlug = requestedPostSlug;
	}

	validate() {
		if (this.data.title == '') this.errors.push('You must provide a title.');
		if (this.data.body == '') this.errors.push('Post content cannot be empty.');
		if (this.data.visibility && !visibilityStates.includes(this.data.visibility)) this.errors.push('Invalid post visibility state.');
	}

	sanitizeData(postRandomId?: string) {
		if (typeof this.data.title != 'string') this.data.title = '';
		if (typeof this.data.body != 'string') this.data.body = '';

		// Get rid of bogus properties
		this.data = {
			title: this.data.title.trim(),
			body: sanitizeHTML(this.data.body.trim(), {
				allowedTags: [],
				allowedAttributes: {}
			}),
			author: this.author,
			slug: slugify(`${this.data.title} ${postRandomId ? postRandomId : generateRandomId()}`, { lower: true, strict: true }),
			visibility: this.data.visibility,
			search: `${this.data.title} ${this.data.body}`
		};
	}

	create() {
		return new Promise<PostDocument>(async (resolve, reject) => {
			// Step #1: Sanitize & validate post data
			this.sanitizeData();
			this.validate();

			if (!this.errors.length) {
				try {
					// Save post into database
					const post = (await appwrite.createDocument(config.POSTS_COLLECTION_ID, uuid(), this.data)) as PostDocument;
					resolve(post);
				} catch (error) {
					this.errors.push('Please try again later :(');
					reject(this.errors);
				}
			} else reject(this.errors);
		});
	}

	update(author: string) {
		return new Promise(async (resolve, reject) => {
			try {
				const post = await Post.findPostBySlug(author, this.requestedPostSlug!, this.author);

				if (post.isVisitorAuthor) {
					// Actually update the database
					const status = await this.updatePost(post.$id);
					resolve(status);
				} else reject();
			} catch (error) {
				reject();
			}
		});
	}

	updatePost(postId: string) {
		return new Promise<string>(async resolve => {
			// Update post slug with original post random id
			this.sanitizeData(this.requestedPostSlug!.slice(-8));
			this.validate();

			if (!this.errors.length) {
				await appwrite.updateDocument(config.POSTS_COLLECTION_ID, postId, {
					title: this.data.title,
					body: this.data.body,
					slug: this.data.slug,
					visibility: this.data.visibility
				});

				resolve('success');
			} else resolve('failure');
		});
	}

	static delete(author: string, slug: string, currentUserId: string) {
		return new Promise(async (resolve, reject) => {
			try {
				const post = await Post.findPostBySlug(author, slug, currentUserId);

				if (post.isVisitorAuthor) {
					await appwrite.deleteDocument(config.POSTS_COLLECTION_ID, post.$id);

					resolve(post);
				} else reject();
			} catch (error) {
				reject(error);
			}
		});
	}

	static postsQuery(queries: string[], currentUserId?: string) {
		return new Promise<PostQueryDocument[] | PostDocument[]>(async resolve => {
			// TODO: Populating author field with data (Pending when AppWrite has a populate query)

			// console.log('postsQuery (queries) ::', queries);
			const posts = (await appwrite.findDocuments(config.POSTS_COLLECTION_ID, queries)) as PostDocument[];
			if (posts.length === 0) return resolve(posts);

			const authorIds = posts.map(post => post.author);
			const authorData = (await appwrite.findDocuments(config.USERS_COLLECTION_ID, [Query.equal('$id', authorIds)])) as UserDocument[];

			// Clean up author property in each post object
			const populatedPosts = await Promise.all(
				posts.map(async post => {
					const populatedPost = { ...post } as unknown as PostQueryDocument;
					const author = authorData.find(author => author.$id === (populatedPost.author as unknown as string))!;
					populatedPost.isVisitorAuthor = false;
					populatedPost.isVisitorFollower = false;

					if (currentUserId) {
						populatedPost.isVisitorAuthor = author.$id === currentUserId;
						populatedPost.isVisitorFollower = await Follow.isUserFollowing(author.$id, currentUserId);
					}

					populatedPost.author = {
						username: author.username,
						avatar: User.getAvatar(author.email)
					};

					return populatedPost;
				})
			);

			resolve(populatedPosts);
		});
	}

	static findPostBySlug(author: string, slug: string, currentUserId: string) {
		return new Promise<PostQueryDocument>(async (resolve, reject) => {
			// Search for post slugs with the author username
			const posts = (await Post.postsQuery([Query.equal('slug', slug)], currentUserId)) as PostQueryDocument[];
			if (posts.length === 0) return reject('Invalid post slug provided for current user!');

			const [post] = posts;

			if (post.author.username !== author) reject('Post was not created by a user with that username!');

			// Check post visibility states and know if a user is permitted to view it
			if (post.visibility === 'private' && !post.isVisitorAuthor) return reject();
			if (post.visibility === 'followers' && !post.isVisitorAuthor && !post.isVisitorFollower) return reject();

			return resolve(post);
		});
	}

	static async findPostsByAuthorId(id: string, currentUserId?: string) {
		const posts = (await Post.postsQuery([Query.equal('author', id), Query.orderDesc('$createdAt')], currentUserId)) as PostQueryDocument[];

		return Post.filterViewablePosts(posts);
	}

	static async userPostsCount(id: string, currentUserId: string) {
		return new Promise<number>(async resolve => {
			const posts = (await Post.postsQuery([Query.equal('author', id)], currentUserId)) as PostQueryDocument[];

			resolve(Post.filterViewablePosts(posts).length);
		});
	}

	static search(searchQuery: string, currentUserId?: string) {
		return new Promise(async (resolve, reject) => {
			if (typeof searchQuery === 'string') {
				const posts = (await Post.postsQuery([Query.search('search', searchQuery)], currentUserId)) as PostQueryDocument[];

				resolve(Post.filterViewablePosts(posts));
			} else reject();
		});
	}

	static async getUserFeed(id: string) {
		// Create an array of the user ids' that the current user follows
		const followedUsers = (await appwrite.findDocuments(config.FOLLOWS_COLLECTION_ID, [Query.equal('userId', id)])) as FollowDocument[];

		const followedIds = followedUsers.map(followDocument => followDocument.followedId);
		if (followedUsers.length === 0) return [];

		const posts = (await Post.postsQuery([Query.equal('author', followedIds), Query.orderDesc('$createdAt')], id)) as PostQueryDocument[];

		return Post.filterViewablePosts(posts);
	}

	static filterViewablePosts(posts: PostQueryDocument[]) {
		const viewablePosts = [];
		for (let idx = 0; idx < posts.length; idx++) {
			const post = posts[idx];
			console.log('Post :>>', post);

			// Check post visibility states and know if a user is permitted to view it
			if (post.visibility === 'private' && !post.isVisitorAuthor) continue;
			if (post.visibility === 'followers' && !post.isVisitorAuthor && !post.isVisitorFollower) continue;

			viewablePosts.push(post);
		}

		return viewablePosts;
	}
}
