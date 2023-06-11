import axios from 'axios';

export default class Bookmark {
	// 1. Select DOM elements & keep track of any useful data
	constructor() {
		this._csrf = document.querySelector('[name="_csrf"]').value;
		this.bookmarkButton = document.getElementById('bookmarkButton');
		this.isLoading = false;
		this.events();
	}

	// 2. Events
	events() {
		this.bookmarkButton.addEventListener('click', () => this.bookmarkHandler());
	}

	bookmarkHandler() {
		if (this.isLoading) return;

		this.isLoading = true;
		const { postBookmarkStatus, postId } = this.bookmarkButton.dataset;

		if (postBookmarkStatus === 'true') {
			this.showBookmarkLoader();
			this.sendUnbookmarkRequest(postId, postBookmarkStatus);
		}

		if (postBookmarkStatus === 'false') {
			this.showBookmarkLoader();
			this.sendBookmarkRequest(postId, postBookmarkStatus);
		}
	}

	showPreviousBookmarkState(postBookmarkStatus) {
		if (postBookmarkStatus === 'true') {
			this.hideBookmarkLoader();
			this.showBookmark();
		}

		if (postBookmarkStatus === 'false') {
			this.hideBookmarkLoader();
			this.showUnbookmark();
		}
	}

	// 3. Methods
	showBookmarkLoader() {
		this.bookmarkButton.classList.remove('bookmarked', 'unbookmarked');
		this.bookmarkButton.classList.add('saving');
	}

	hideBookmarkLoader() {
		this.bookmarkButton.classList.remove('saving');
	}

	showBookmark() {
		this.bookmarkButton.classList.remove('saving', 'unbookmarked');
		this.bookmarkButton.classList.add('bookmarked');
	}

	showUnbookmark() {
		this.bookmarkButton.classList.remove('saving', 'bookmarked');
		this.bookmarkButton.classList.add('unbookmarked');
	}

	sendBookmarkRequest(postId, postBookmarkStatus) {
		axios.post(`/addBookmarkTo/${postId}`, { _csrf: this._csrf }).then(response => {
			this.bookmarkButton.setAttribute('data-post-bookmark-status', true);
			this.showBookmark();
			iziToast.success({ position: 'bottomLeft', timeout: 3e3, message: response.data.message });
		}).catch(error => {
			this.showPreviousBookmarkState(postBookmarkStatus);
			this.handleErrorResponse(error);
		});

		this.isLoading = false;
	}

	sendUnbookmarkRequest(postId, postBookmarkStatus) {
		axios.post(`/removeBookmarkFrom/${postId}`, { _csrf: this._csrf }).then(response => {
			this.bookmarkButton.setAttribute('data-post-bookmark-status', false);
			this.showUnbookmark();
			iziToast.success({ position: 'bottomLeft', timeout: 3e3, message: response.data.message });
		}).catch(error => {
			this.showPreviousBookmarkState(postBookmarkStatus);
			this.handleErrorResponse(error);
		});

		this.isLoading = false;
	}

	handleErrorResponse(errorResponse) {
		const errorMessage = errorResponse.response.data.message;
		const errorResponseErrors = errorResponse.response.data.errors;

		if (errorMessage) {
			iziToast.error({ position: 'bottomLeft', timeout: 3e3, message: errorResponse.response.data.message });
		} else if (errorResponseErrors && errorResponseErrors.length) {
			errorResponseErrors.forEach((error, idx) => {
				setTimeout(() => {
					iziToast.error({ position: 'bottomLeft', timeout: 3e3, message: error });
				}, idx * 750);
			});
		}
	}
}
