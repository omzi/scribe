require('colors');
const fs = require('fs-extra');

(async () => {
	try {
		// Copy .ejs files
		await fs.copy('src/views', 'build/views');

		// Copy public folder
		await fs.copy('src/public', 'build/public');

		console.log('🎉', 'Files copied successfully!'.green.bold);
	} catch (error) {
		console.error('', 'Error copying files :>>', `${error}`.bold);
	}
})();
