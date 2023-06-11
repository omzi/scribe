import { User } from '@models/User';
import { appwrite } from '@utils/appwrite';
import { Query } from 'node-appwrite';
import { uuid } from '@utils/uuid';
import { config } from '@root/config';
import { UserDocument } from '@interfaces/auth.interface';
import { FollowDocument } from '@interfaces/follow.interface';

export class Follow {
	followedUsername: string;
	userId: string;
	errors: string[];
	followedId?: string;

	constructor(followedUsername: string, userId: string) {
		this.followedUsername = followedUsername;
		this.userId = userId;
		this.errors = [];
	}

	sanitizeData() {
		if (typeof this.followedUsername !== 'string') this.followedUsername = '';
	}

	async validate(action: string) {
		// Check user's existence
		const [followedAccount] = (await appwrite.findDocuments(config.USERS_COLLECTION_ID, [Query.equal('username', this.followedUsername)])) as UserDocument[];

		if (followedAccount) {
			this.followedId = followedAccount.$id;
		} else {
			this.errors.push('You cannot follow a non-existent user!');
		}

		const [doesFollowAlreadyExist] = (await appwrite.findDocuments(config.FOLLOWS_COLLECTION_ID, [Query.equal('followedId', this.followedId!), Query.equal('userId', this.userId)])) as FollowDocument[];

		if (action === 'create') {
			if (doesFollowAlreadyExist) this.errors.push('You already follow this user!');
		}

		if (action === 'delete') {
			if (!doesFollowAlreadyExist) this.errors.push('You are not following this user!');
		}

		if (this.followedId === this.userId) this.errors.push('You cannot follow yourself!');
	}

	create() {
		return new Promise<void>(async (resolve, reject) => {
			this.sanitizeData();
			await this.validate('create');

			if (!this.errors.length) {
				await appwrite.createDocument(config.FOLLOWS_COLLECTION_ID, uuid(), {
					followedId: this.followedId,
					userId: this.userId
				});
				resolve();
			} else reject(this.errors);
		});
	}

	delete() {
		return new Promise<void>(async (resolve, reject) => {
			this.sanitizeData();
			await this.validate('delete');

			if (!this.errors.length) {
				await appwrite.deleteDocument(config.FOLLOWS_COLLECTION_ID, this.followedId!);
				resolve();
			} else reject(this.errors);
		});
	}

	static async isUserFollowing(followedId: string, userId: string) {
		const followDocument = (await appwrite.findDocuments(config.FOLLOWS_COLLECTION_ID, [Query.equal('followedId', followedId), Query.equal('userId', userId)])) as FollowDocument[];

		return followDocument.length > 0 ? true : false;
	}

	static getFollowersByUserId(id: string) {
		return new Promise<{ username: string; avatar: string }[]>(async (resolve, reject) => {
			try {
				const followers = (await appwrite.findDocuments(config.FOLLOWS_COLLECTION_ID, [Query.equal('followedId', id)])) as FollowDocument[];
				if (followers.length === 0) return resolve([]);

				const arrayOfFollowersUserIds = followers.map(follower => follower.userId);
				const followersData = (await appwrite.findDocuments(config.USERS_COLLECTION_ID, [Query.equal('$id', arrayOfFollowersUserIds)])) as UserDocument[];

				const followersUserData = followers.map((_follower, idx) => {
					return {
						username: followersData[idx].username,
						avatar: User.getAvatar(followersData[idx].email)
					};
				});

				resolve(followersUserData);
			} catch (error) {
				reject();
			}
		});
	}

	static getFollowedUsersByUserId(id: string) {
		return new Promise<{ username: string; avatar: string }[]>(async (resolve, reject) => {
			try {
				const followings = (await appwrite.findDocuments(config.FOLLOWS_COLLECTION_ID, [Query.equal('userId', id)])) as FollowDocument[];
				if (followings.length === 0) return resolve([]);

				const arrayOfFollowedUserIds = followings.map(follower => follower.followedId);
				const followingsData = (await appwrite.findDocuments(config.USERS_COLLECTION_ID, [Query.equal('$id', arrayOfFollowedUserIds)])) as UserDocument[];

				const followingsUserData = followings.map((_follower, idx) => {
					return {
						username: followingsData[idx].username,
						avatar: User.getAvatar(followingsData[idx].email)
					};
				});

				resolve(followingsUserData);
			} catch (error) {
				reject();
			}
		});
	}

	static async userFollowersCount(id: string) {
		return new Promise<number>(async resolve => {
			const followersCount = await appwrite.countDocuments(config.FOLLOWS_COLLECTION_ID, [Query.equal('followedId', id)]);
			resolve(followersCount);
		});
	}

	static async userFollowingCount(id: string) {
		return new Promise<number>(async resolve => {
			const followingCount = await appwrite.countDocuments(config.FOLLOWS_COLLECTION_ID, [Query.equal('userId', id)]);
			resolve(followingCount);
		});
	}
}
