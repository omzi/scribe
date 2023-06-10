import dotenv from 'dotenv';
dotenv.config();

class Config {
	public PORT: string | number;
	public NODE_ENV: string;
	public SESSION_SECRET: string;
	public APPWRITE_PROJECT_ID: string;
	public APPWRITE_ENDPOINT: string;
	public APPWRITE_API_KEY: string;
	public DATABASE_ID: string;
	public USERS_COLLECTION_ID: string;
	public POSTS_COLLECTION_ID: string;
	public COMMENTS_COLLECTION_ID: string;
	public FOLLOWS_COLLECTION_ID: string;
	public LIKES_COLLECTION_ID: string;
	public BOOKMARKS_COLLECTION_ID: string;
	public SESSIONS_COLLECTION_ID: string;
	public IS_PRODUCTION: boolean;

	constructor() {
		this.PORT = process.env.PORT || 9999;
		this.NODE_ENV = process.env.NODE_ENV || '';
		this.SESSION_SECRET = process.env.SESSION_SECRET || '';
		this.APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '';
		this.APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || '';
		this.APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || '';
		this.DATABASE_ID = process.env.DATABASE_ID || '';
		this.USERS_COLLECTION_ID = process.env.USERS_COLLECTION_ID || '';
		this.POSTS_COLLECTION_ID = process.env.POSTS_COLLECTION_ID || '';
		this.COMMENTS_COLLECTION_ID = process.env.COMMENTS_COLLECTION_ID || '';
		this.FOLLOWS_COLLECTION_ID = process.env.FOLLOWS_COLLECTION_ID || '';
		this.LIKES_COLLECTION_ID = process.env.LIKES_COLLECTION_ID || '';
		this.BOOKMARKS_COLLECTION_ID = process.env.BOOKMARKS_COLLECTION_ID || '';
		this.SESSIONS_COLLECTION_ID = process.env.SESSIONS_COLLECTION_ID || '';
		this.IS_PRODUCTION = this.NODE_ENV === 'production';
	}

	public validateConfig(): void {
		// console.log(this);
		for (const [key, value] of Object.entries(this)) {
			if (value === undefined || value === 0) {
				throw new Error(`Configuration ${key} is undefined.`);
			}
		}
	}
}

export const config: Config = new Config();
