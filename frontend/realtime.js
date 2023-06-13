import { NativeEventSource, EventSourcePolyfill } from 'event-source-polyfill';
const EventSource = NativeEventSource || EventSourcePolyfill;
import { ClientJS } from 'clientjs';

const fingerprint = new ClientJS().getFingerprint();
// console.log('Device FingerPrint :>>', fingerprint);

const eventSource = new EventSource(`/realtime?clientFingerprint=${fingerprint}`);

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
	const eventData = JSON.parse(event.data);

	console.log('Live Users :>>', eventData);
});

// Event handler for receiving SSE events
eventSource.onopen = (event) => {
	console.log('Connected to BackEnd successfully :>>', event);
};

// Event handler for SSE connection error
eventSource.onerror = (event) => {
	console.error('SSE Connection Error :>>', event);
};

export default eventSource;
