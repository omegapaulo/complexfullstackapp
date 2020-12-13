import Search from './modules/search';
import Chat from './modules/chat';

// If there is the chat div wrappar in the document perform this action
if (document.querySelector('#chat-wrapper')) {
  new Chat();
}

// If there is the search icon in the document perform this action
if (document.querySelector('.header-search-icon')) {
  new Search();
}
