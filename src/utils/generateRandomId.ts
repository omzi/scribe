export const generateRandomId = (length = 8) => {
	return 'x'
		.repeat(length)
		.replace(/[x]/g, () => {
			return ((Math.random() * 16) | 0).toString(16);
		})
		.toLowerCase();
};
