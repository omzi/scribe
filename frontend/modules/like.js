import axios from 'axios';

export default class Like {
  // 1. Select DOM elements & keep track of any useful data
  constructor() {
    this._csrf = document.querySelector('[name="_csrf"]').value;
		this.likeButton = document.getElementById('likeButton');
		this.isLoading = false;
    this.events();
  }

  // 2. Events
  events() {
		this.likeButton.addEventListener('click', () => this.likeHandler());
  }

	likeHandler() {
		if (this.isLoading) return;

		this.isLoading = true;
		const { postLikeStatus, postId } = this.likeButton.dataset;

		if (postLikeStatus === 'true') {
			this.showLikeLoader();
			this.sendUnlikeRequest(postId, postLikeStatus);
		}

		if (postLikeStatus === 'false') {
			this.showLikeLoader();
			this.sendLikeRequest(postId, postLikeStatus);
		}
	}

	showPreviousLikeState(postLikeStatus) {
		if (postLikeStatus === 'true') {
			this.hideLikeLoader();
			this.showLike();
		}

		if (postLikeStatus === 'false') {
			this.hideLikeLoader();
			this.showUnlike();
		}
	}

  // 3. Methods
  showLikeLoader() {
		this.likeButton.classList.remove('liked', 'unliked');
		this.likeButton.classList.add('saving');
  }

  hideLikeLoader() {
		this.likeButton.classList.remove('saving');
  }

	showLike() {
		this.likeButton.classList.remove('saving', 'unliked');
		this.likeButton.classList.add('liked');
	}

	showUnlike() {
		this.likeButton.classList.remove('saving', 'liked');
		this.likeButton.classList.add('unliked');
	}

	sendLikeRequest(postId, postLikeStatus) {
		axios.post(`/addLikeTo/${postId}`, { _csrf: this._csrf }).then(response => {
			this.likeButton.setAttribute('data-post-like-status', true);
			this.showLike();
			iziToast.success({ position: 'bottomLeft', timeout: 3e3, message: response.data.message });
    }).catch(error => {
			this.showPreviousLikeState(postLikeStatus);
			this.handleErrorResponse(error);
    });

		this.isLoading = false;
  }

	sendUnlikeRequest(postId, postLikeStatus) {
		axios.post(`/removeLikeFrom/${postId}`, { _csrf: this._csrf }).then(response => {
      this.likeButton.setAttribute('data-post-like-status', false);
			this.showUnlike();
			iziToast.info({ position: 'bottomLeft', timeout: 3e3, message: response.data.message });
    }).catch(error => {
			this.showPreviousLikeState(postLikeStatus);
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
