import axios from 'axios';
import DOMPurify from 'dompurify';

export default class Search {
  // 1. Select DOM elements & keep track of any useful data
  constructor() {
    this.injectSearchMarkup();
    this._csrf = document.querySelector('[name="_csrf"]').value;
    this.headerSearchIcon = document.querySelector('.header-search-icon');
    this.searchOverlay = document.querySelector('.search-overlay');
    this.closeIcon = document.querySelector('.close-live-search');
    this.searchField = document.getElementById('live-search-field');
    this.searchResultsContainer = document.querySelector('.live-search-results');
    this.loaderIcon = document.querySelector('.spinner');
    this.typingWaitTimer;
    this.previousQuery = '';
    this.events();
  }

  // 2. Events
  events() {
    this.headerSearchIcon.addEventListener('click', () => this.toggleOverlayVisibility());
    this.closeIcon.addEventListener('click', () => this.toggleOverlayVisibility());
    this.searchField.addEventListener('keypress', () => this.searchFieldHandler());

    document.addEventListener('keydown', e => {
      if (e.key === 'f' && e.ctrlKey && !this.searchOverlay.classList.contains('search-overlay--visible')) {
        e.preventDefault();
        this.toggleOverlayVisibility();
      }

      if (e.key === '/' && !this.searchOverlay.classList.contains('search-overlay--visible')) {
        this.toggleOverlayVisibility();
      }

      if (e.key && e.key.startsWith('Esc') && this.searchOverlay.classList.contains('search-overlay--visible')) {
        this.toggleOverlayVisibility();
      }
    })
  }

  // 3. Methods
  toggleOverlayVisibility() {
    this.searchOverlay.classList.toggle('search-overlay--visible');
    setTimeout(() => {
      this.searchOverlay.classList.contains('search-overlay--visible') && this.searchField.focus();
    }, 330);
  }

  showSearchLoader() {
    this.loaderIcon.classList.add('spinner-visible');
  }

  hideSearchLoader() {
    this.loaderIcon.classList.remove('spinner-visible');
  }

  showResultsContainer() {
    this.searchResultsContainer.classList.add('live-search-results--visible');
  }

  hideResultsContainer() {
    this.searchResultsContainer.classList.remove('live-search-results--visible');
  }

  searchFieldHandler() {
    const searchQuery = this.searchField.value;

    if (/\S/.test(searchQuery) && searchQuery !== this.previousQuery) {
      clearTimeout(this.typingWaitTimer);
      this.typingWaitTimer = setTimeout(() => {
        this.showSearchLoader();
        this.hideResultsContainer();
        this.sendSearchRequest();
      }, 750);
    }

    this.previousQuery = searchQuery;
  }

  sendSearchRequest() {
    const searchQuery = this.searchField.value.trim();

    axios.post('/search', { _csrf: this._csrf, searchQuery }).then(response => {
      console.log(response.data);
      this.renderSearchResults(response.data, searchQuery);
    }).catch(error => {
      console.log(error);
      this.hideSearchLoader();
      this.showResultsContainer();
      this.searchResultsContainer.innerHTML = `<p class="alert alert-danger text-center shadow-sm">Oops! An error occurred while making a request to the server.</b></p>`;
    });
  }

  renderSearchResults(posts, searchQuery) {
    if (posts.length) {
      this.searchResultsContainer.innerHTML = DOMPurify.sanitize(`<div class="list-group shadow-sm">
        <div class="list-group-item active"><strong>Search Results</strong> (${posts.length > 1 ? `${posts.length} items found` : '1 item found'})</div>

        ${posts.map(post => {
          return `<a href="/@${post.author.username}/post/${post.slug}" target="_blank" class="list-group-item list-group-item-action" data-post-id="${post.$id}">
              <h4><strong>${post.title}</strong></h4>
              <hr>
              <img loading="lazy" class="avatar-tiny" src="${post.author.avatar}"> <strong>${post.author.username}</strong> ✦ ${this.formatPostDate(new Date(post.$createdAt))}
              <hr>
              <div class="post-meta">
                ${post.visibility === 'public' ? `
                  <div class="visibility-status public">
                    <i class="material-icons mr-1">visibility</i>
                    <span>Publicly Visible</span>
                  </div>
                ` : ''}
                ${post.visibility === 'followers' ? `
                  <div class="visibility-status followers">
                    <i class="material-icons mr-1">visibility_off</i>
                    <span>Visible To Followers Only</span>
                  </div>
                ` : ''}
                ${post.visibility === 'private' ? `
                  <div class="visibility-status private">
                    <i class="material-icons mr-1">face</i>
                    <span>Visible To You</span>
                  </div>
                ` : ''}

                <div class="d-flex">
                  <div class="post-status mr-2">
                    <i class="material-icons mr-1">favorite</i>
                    <span class="likes-count">${this.formatNumber(post.likesCount)}</span>
                  </div>
                  <div class="post-status">
                    <i class="material-icons mr-1">bookmark</i>
                    <span class="bookmarks-count">${this.formatNumber(post.bookmarksCount)}</span>
                  </div>
                </div>
              </div>
          </a>`;
        }).join('')}

      </div>`);
    } else {
      this.searchResultsContainer.innerHTML = `<p class="alert alert-danger text-center shadow-sm">Sorry. No results found for <b>"${searchQuery.trim()}"</b>.</p>`;
    }

    this.hideSearchLoader();
    this.showResultsContainer();
  }

  injectSearchMarkup() {
    document.body.insertAdjacentHTML('beforeend', `<div class="search-overlay">
      <div class="search-overlay-top shadow-sm">
        <div class="container container--narrow">
          <label for="live-search-field" class="search-overlay-icon mb-0"><i class="material-icons">search</i></label>
          <input type="text" id="live-search-field" class="live-search-field" placeholder="What are you interested in?">
          <span class="close-live-search"><i class="material-icons">close</i></span>
        </div>
      </div>

      <div class="search-overlay-bottom">
        <div class="container container--narrow py-3">
          <svg class="spinner" viewBox="0 0 50 50">
            <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
          </svg>
          <div class="live-search-results"></div>
        </div>
      </div>
    </div>`);
  }

  formatNumber(number) {
		if (number < 1000) return number;
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    const suffixIndex = Math.floor(Math.log10(number) / 3);
    const formattedNumber = (number / Math.pow(10, suffixIndex * 3)).toFixed(1);

    return formattedNumber + suffixes[suffixIndex];
  }

  formatPostDate(date) {
    const formattedDate = new Date(date).toDateString();
    const ordinal = n => n < 11 || n > 13 ? [`${n}st`, `${n}nd`, `${n}rd`, `${n}th`][Math.min((n - 1) % 10, 3)] : `${n}th`;

    return formattedDate.replace(/(\w{3}) (\w{3}) (\d{2}) (\d{4})/, (_, day, month, date, year) => {
      return `${day}, ${month} ${ordinal(Number(date))} ${year}`;
    });
  }
}
