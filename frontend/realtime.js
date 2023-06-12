const eventSource = new EventSource('/realtime');


eventSource.addEventListener('updateLikesCount', (event) => {
	const eventData = JSON.parse(event.data);
	const { postId, likesCount } = eventData;

	const likesCountElements = document.querySelectorAll(`[data-post-id="${postId}"] .likes-count`);
	if (likesCountElements.length) {
		likesCountElements.forEach(likesCountElement => likesCountElement.textContent = likesCount);
	}
});

eventSource.addEventListener('updateBookmarksCount', (event) => {
	const eventData = JSON.parse(event.data);
	const { postId, bookmarksCount } = eventData;

	const bookmarksCountElements = document.querySelectorAll(`[data-post-id="${postId}"] .bookmarks-count`);
	if (bookmarksCountElements.length) {
		bookmarksCountElements.forEach(bookmarksCountElement => bookmarksCountElement.textContent = bookmarksCount);
	}
});

eventSource.addEventListener('liveUsers', (event) => {
	const eventData = JSON.parse(event.data); // Parse the JSON data
	const eventString = event.type; // Get the event type as a string

	// Handle the event and data
	console.log('Received Event ::', eventString);
	console.log('Received Data ::', eventData);
});

// Event handler for receiving SSE events
eventSource.onmessage = (event) => {
	console.log('Received Event :>>', event);
	console.log('Received Event Data :>>', event.data);
};

// Event handler for SSE connection error
eventSource.onerror = (event) => {
	console.error('SSE Connection Error :>>', event);
};

export default eventSource;
