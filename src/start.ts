import 'colors';
import app from './app';
import { appwrite } from './utils/appwrite';
import { config } from './config';

(async () => {
	const response = await appwrite.getHealth();
	console.log('AppWrite Health Response ::', response);

	const PORT = process.env.PORT || 9999;

	const server = app.listen(PORT, () => {
		console.log('Server running in'.yellow.bold, config.NODE_ENV.toUpperCase().blue.bold, 'mode, on port'.yellow.bold, `:${config.PORT}`.blue.bold);
		console.log('Server started in'.white.italic.bold, process.uptime().toString().blue.bold, 'seconds, with process'.white.italic.bold, `${process.pid}`.blue.bold);
	});

	// 'Handle' unhandled promise rejections
	process.on('unhandledRejection', error => {
		console.log(error);
		console.log(`✖ | Error: ${error}`.red.bold);

		server.close(() => process.exit(1));
	});
})().catch(error => {
	console.log('An error occurred while starting the app :>>', error);
});
