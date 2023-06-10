const { Store } = require("express-session");
const { Client, Databases } = require("node-appwrite");

class AppWriteSessionStore extends Store {
	constructor(config) {
		super();
		this.client = new Client();
		this.client.setEndpoint(config.endpoint);
		this.client.setProject(config.projectId);
		this.client.setKey(config.apiKey);

		this.database = new Databases(this.client);
	}

	async get(sid, callback) {
		try {
			const response = await this.client.database.listDocuments("your_collection_id", [], 1, 0, `id=${sid}`);
			const document = response.documents[0];
			if (document) {
				callback(null, document.session);
			} else {
				callback(null, null);
			}
		} catch (error) {
			callback(error);
		}
	}

	async set(sid, session, callback) {
		const document = {
			session,
			id: sid,
		};

		try {
			await this.client.document.createDocument("your_collection_id", document);
			callback(null);
		} catch (error) {
			callback(error);
		}
	}

	async touch(sid, session, callback) {
		try {
			const document = {
				session,
				id: sid,
			};

			await this.client.document.updateDocument("your_collection_id", sid, document);
			callback(null);
		} catch (error) {
			callback(error);
		}
	}

	async destroy(sid, callback) {
		try {
			await this.client.database.deleteDocument("your_collection_id", sid);
			callback(null);
		} catch (error) {
			callback(error);
		}
	}
}

module.exports = AppWriteSessionStore;
