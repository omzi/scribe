import { Client, Databases, Storage, Health } from 'node-appwrite';
import { config } from '../config';

class AppWrite {
	client: Client;
	config: { apiKey: string; endpoint: string; projectId: string };
	databaseId: string;
	database: Databases;
	storage: Storage;
	health: Health;

	constructor(apiKey: string, endpoint: string, projectId: string) {
		this.client = new Client();
		this.client.setEndpoint(endpoint);
		this.client.setProject(projectId);
		this.client.setKey(apiKey);
		this.config = { apiKey, endpoint, projectId };
		this.databaseId = config.DATABASE_ID;

		this.database = new Databases(this.client);
		this.storage = new Storage(this.client);
		this.health = new Health(this.client);
	}

	async createCollection(collectionName: string) {
		try {
			const response = await this.database.createCollection(this.databaseId, collectionName.toLowerCase(), collectionName);
			return response;
		} catch (error) {
			throw new Error('Failed to create collection :>>' + error);
		}
	}

	async getCollection(collectionId: string) {
		try {
			const collection = await this.database.getCollection(this.databaseId, collectionId);
			if (!collection) {
				throw new Error(`Collection ${collectionId} not found`);
			}

			return collection;
		} catch (error) {
			throw new Error('Failed to get collection :>>' + error);
		}
	}

	async createDocument(collectionId: string, documentId: string, data: object) {
		try {
			const response = await this.database.createDocument(this.databaseId, collectionId, documentId, data);
			return response;
		} catch (error) {
			throw new Error('Failed to create document :>>' + error);
		}
	}

	async getDocument(collectionId: string, documentId: string) {
		try {
			const response = await this.database.getDocument(this.databaseId, collectionId, documentId);
			return response;
		} catch (error) {
			throw new Error('Failed to get document :>>' + error);
		}
	}

	async findDocuments(collectionId: string, query: string[] = []) {
		const response = await this.database.listDocuments(this.databaseId, collectionId, query);
		return response.documents;
	}

	async countDocuments(collectionId: string, query: string[] = []) {
		const response = (await this.database.listDocuments(this.databaseId, collectionId, query)).total;
		return response;
	}

	async updateDocument(collectionId: string, documentId: string, data: object) {
		try {
			const response = await this.database.updateDocument(this.databaseId, collectionId, documentId, data);
			return response;
		} catch (error) {
			throw new Error('Failed to update document :>>' + error);
		}
	}

	async deleteDocument(collectionId: string, documentId: string) {
		try {
			const response = await this.database.deleteDocument(this.databaseId, collectionId, documentId);
			return response;
		} catch (error) {
			throw new Error('Failed to delete document :>>' + error);
		}
	}

	getHealth = async () => {
		const response = await this.health.get();
		return response;
	};
}

export const appwrite = new AppWrite(config.APPWRITE_API_KEY, config.APPWRITE_ENDPOINT, config.APPWRITE_PROJECT_ID);
