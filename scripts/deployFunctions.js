const path = require('path');
const { InputFile } = require('node-appwrite');
const appwrite = require('node-appwrite');
const client = new appwrite.Client();
const functions = new appwrite.Functions(client);

client
	.setEndpoint('https://cloud.appwrite.io/v1')
	.setProject('5df5acd0d48c2')
	.setKey('919c2d18fb5d4...a2ae413da83346ad2');

const FUNCTIONS_TO_DEPLOY = [
	{
		functionId: 'updateLikesCount',
		entrypoint: 'functions/updateLikesCount.js',
		code: path.join(__dirname, 'functions', 'updateLikesCount.js')
	}
]

const promise = functions.createDeployment('[FUNCTION_ID]', '[ENTRYPOINT]', InputFile.fromPath('/path/to/file.png', 'file.png'), false);

promise.then(response => {
	console.log(response);
}, error => {
	console.log(error);
});
