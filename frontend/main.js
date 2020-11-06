import Search from './modules/search';

// If there is the search icon in the document perform this action
if (document.querySelector('.header-search-icon')) {
  new Search();
}
