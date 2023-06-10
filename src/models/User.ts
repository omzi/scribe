import validator from 'validator';
import bcrypt from 'bcryptjs';
import md5 from 'md5';
import { appwrite } from '@utils/appwrite';
import { uuid } from '@utils/uuid';
import { Query } from 'node-appwrite';
import { config } from '@root/config';
import { AuthData, SessionUser, UserDocument } from '@interfaces/auth.interface';

export class User {
	data: AuthData;
	errors: string[];
	id?: string;
	avatar?: string;

	constructor(user: AuthData) {
		this.data = user;
		this.data.username = user.username || user.mobileLoginUsername || user.desktopLoginUsername;
		this.data.password = user.password || user.mobileLoginPassword! || user.desktopLoginPassword!;
		this.errors = [];
	}

	async validate() {
		if (this.data.username == '') this.errors.push('You must provide a username.');
		if (this.data.username && !validator.isAlphanumeric(this.data.username)) this.errors.push('Username must only contain letters and numbers.');
		if (this.data.email && !validator.isEmail(this.data.email)) this.errors.push('You must provide a valid email address.');
		if (this.data.password == '') this.errors.push('You must provide a password.');
		if (this.data.password && this.data.password.length < 6) this.errors.push('Password must be at least 6 characters.');
		if (this.data.password && this.data.password.length > 50) this.errors.push('Password cannot exceed 50 characters.');
		if (this.data.username && this.data.username.length < 3) this.errors.push('Username must be at least 3 characters.');
		if (this.data.username && this.data.username.length > 30) this.errors.push('Username cannot exceed 30 characters.');

		// Check validity, then check if username has been taken
		if (this.data.username && this.data.username.length >= 3 && this.data.username.length <= 30 && validator.isAlphanumeric(this.data.username)) {
			const usernameExists = await User.findByUsername(this.data.username);
			if (usernameExists) this.errors.push('Username has already been taken!');
		}

		// Check validity, then check if account with email exists
		if (this.data.email && validator.isEmail(this.data.email)) {
			const emailExists = await User.doesEmailExist(this.data.email);
			if (emailExists) this.errors.push('Account with email already exists!');
		}
	}

	sanitizeData() {
		if (typeof this.data.username != 'string') this.data.username = '';
		if (typeof this.data.email != 'string') this.data.email = '';
		if (typeof this.data.password != 'string') this.data.password = '';

		// Get rid of bogus properties
		this.data = {
			username: this.data.username.trim().toLowerCase(),
			email: this.data.email.trim().toLowerCase(),
			password: this.data.password
		};
	}

	register() {
		return new Promise<void>(async (resolve, reject) => {
			// Step #1: Sanitize & validate user data
			this.sanitizeData();
			await this.validate();

			// Step #2: If no validation errors, save the user data
			if (!this.errors.length) {
				// Hash user password
				const salt = bcrypt.genSaltSync(10);
				this.data.password = bcrypt.hashSync(this.data.password, salt);

				const userId = uuid();
				(await appwrite.createDocument(config.USERS_COLLECTION_ID, userId, this.data)) as UserDocument;

				this.id = userId;
				this.avatar = User.getAvatar(this.data.email!);
				resolve();
			} else reject(this.errors);
		});
	}

	login() {
		return new Promise(async (resolve, reject) => {
			this.sanitizeData();

			const [attemptedUser] = (await appwrite.findDocuments(config.USERS_COLLECTION_ID, [Query.equal('username', this.data.username!)])) as UserDocument[];
			console.log('attemptedUser :>>', attemptedUser);

			if (attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
				this.data = attemptedUser;
				this.id = attemptedUser.$id;
				this.avatar = User.getAvatar(attemptedUser.email);
				resolve('Congrats!');
			} else {
				reject('Invalid credentials!');
			}
		});
	}

	static getAvatar(userEmail: string) {
		return `https://gravatar.com/avatar/${md5(userEmail)}?s=32`;
	}

	static async findByUsername(username: string): Promise<SessionUser | boolean> {
		const users = (await appwrite.findDocuments(config.USERS_COLLECTION_ID, [Query.equal('username', username)])) as UserDocument[];

		if (users.length) {
			const [user] = users;
			// Clean up user data
			const userData = {
				id: user.$id,
				username: user.username,
				avatar: User.getAvatar(user.email)
			} as SessionUser;

			return userData;
		} else return false;
	}

	static async doesEmailExist(email: string): Promise<boolean> {
		if (typeof email !== 'string') return false;

		const users = (await appwrite.findDocuments(config.USERS_COLLECTION_ID, [Query.equal('email', email)])) as UserDocument[];
		// console.log('AppWrite User (Email) Response :>>', users);

		return users.length ? true : false;
	}
}
