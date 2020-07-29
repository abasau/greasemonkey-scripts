// ==UserScript==
// @name            businessinsider.com hide articles
// @description     Hide articles on businessinsider.com
// @include         http*://*businessinsider.tld/
// @downloadURL     https://github.com/abasau/greasemonkey-scripts/raw/master/src/businessinsider.user.js
// @homepageURL     https://github.com/abasau/greasemonkey-scripts
// @version         0.9
// @grant    				none
// ==/UserScript==

// ===================================== //

function addStyles (styles) {
  const existing = document.getElementById('custom-style');

  if (existing) existing.remove();

  const styleSheet = document.createElement("style")
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  styleSheet.id = 'custom-style';

  document.head.appendChild(styleSheet);
};

function addHtmlToBody (html) {
  const container = document.createElement('div');
  container.innerHTML = html.trim();

  document.body.appendChild(container.firstChild);
}

function getElementByXpath (path, parent) {
  return document.evaluate(path, parent, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
};

function getAbsoluteTopPosition(element) {
  return element.getBoundingClientRect().top - document.body.getBoundingClientRect().top;
};

function getFromLocalStorage (name) {
  return localStorage[name] ? JSON.parse(localStorage[name]) : null;
};

function saveToLocalStorage (name, value) {
  localStorage[name] = JSON.stringify(value);
};

// ===================================== //

const feedItemClass = "hideable-feed-item";
const feedItemTitleClass = "hideable-feed-item-title";
const hiddenClass = "hidden";
const removedClass = "remove";

addStyles (`
.${hiddenClass} * {
  color: #FFF !important;
  background-color: #FFF !important;
}

.${hiddenClass} .bi-prime-icon {
	display: none !important;
}

.${hiddenClass} .lazy-holder img {
	opacity: 0.0 !important;;
}

.${hiddenClass}.${removedClass} {
	display: none !important;
}

#l-rightrail {
	display: none !important;
}

.btn-filter {
  display: inline-block;
  user-select: none;
  height: 25px;
  border-radius: 15px;
  padding: 0 16px;
  font-family: LabGrotesque, Helvetica, Arial, sans-serif;
  font-weight: 900;
  font-style: normal;
  font-size: 11px;
  line-height: 25px;
  color: #fff;
  letter-spacing: .6px;
  background: #007eff;
  margin-right: 5px;
  margin-left: 5px;
}

/* From https://www.w3schools.com/howto/howto_css_modals.asp */

.modal {
  display: none; /* Hidden by default */
  position: fixed; /* Stay in place */
  z-index: 1000; /* Sit on top */
  left: 0;
  top: 0;
  width: 100%; /* Full width */
  height: 100%; /* Full height */
  overflow: auto; /* Enable scroll if needed */
  background-color: rgb(0,0,0); /* Fallback color */
  background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
}

/* Modal Content/Box */
.modal-content {
  background-color: #fefefe;
  margin: 15% auto; /* 15% from the top and centered */
  padding: 20px;
  border: 1px solid #888;
  width: 80%; /* Could be more or less, depending on screen size */
}

/* The Close Button */
.close {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.close:hover,
.close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}

`);

// ===================================== //

const storageVariableName = 'hidden-feed-items';
const categoryStorageVariableName = 'hidden-feed-categories';
const titleStorageVariableName = 'hidden-feed-titles';

function getFeedItems() {
  document.querySelectorAll('.tout-copy ol li a').forEach(element => element.classList.add(feedItemTitleClass));
  document.querySelectorAll('.js-feed-item .tout-title a.tout-title-link').forEach(element => element.classList.add(feedItemTitleClass));
  document.querySelectorAll('.js-feed-item, .tout-copy ol li').forEach(element => element.classList.add(feedItemClass));

  const items = document.querySelectorAll(`.${feedItemClass}`);
  
  const data = Array.from(items)
  	.filter(element => (element.clientHeight > 10))
    .filter(element => (!element.classList.contains(hiddenClass)))
    .filter(element => (!element.classList.contains(removedClass)))
  	.map(element => {
      
      let container, relatedElements;
      
      if (element.tagName === 'SECTION') {
        container = getElementByXpath('./preceding-sibling::*[1]', element);
        relatedElements = [container];
      } else {
        container = element;
        relatedElements = [];
      }

	    const primeElement = container.querySelector('.bi-prime-icon');
      const categoryElement = container.querySelector('.tout-tag-link');
      
      const prime = !!primeElement;
      const category = categoryElement ? categoryElement.innerText.trim() : "";
      const titleLinkElement = element.querySelector(`.${feedItemTitleClass}`);
      const id = titleLinkElement ? titleLinkElement.href.replace(/[^?]*\//, '').replace(/\?.*/, '') : "";
      const title = titleLinkElement ? titleLinkElement.innerText.trim() : "";
      const position = { top: getAbsoluteTopPosition(element), hight: element.clientHeight, width: element.clientWidth };

      return { prime, category, title, id, position, element, relatedElements };
    });
  
  //console.log(data);
  
  return data;
};

function hideItem(item) {
  item.element.classList.add(hiddenClass);
  item.relatedElements.forEach(element => element.classList.add(hiddenClass));
}

function removeItem(item) {
  item.element.classList.add(removedClass);
  item.relatedElements.forEach(element => element.classList.add(removedClass));
}

function filterFeedItems(cutOffHight) {
  const feedItems = getFeedItems();
  
  const hiddenFeedItemIds = getFromLocalStorage(storageVariableName) || [];
  const categories = getFromLocalStorage(categoryStorageVariableName) || [];
  const titles = getFromLocalStorage(titleStorageVariableName) || [];
  
  const clientWindowBottomY = window.scrollY + window.innerHeight;

  feedItems.forEach(item => {
    if (hiddenFeedItemIds.includes(item.id)) {
      if (item.position.top > clientWindowBottomY) {
        hideItem(item);
        removeItem(item);
      } else {
        hideItem(item);
      }
    } else if (item.prime
               || (item.position.top + item.position.hight) < cutOffHight
               || categories.some(category => (category.toUpperCase() === item.category.toUpperCase()))
               || titles.some(title => (item.title.toUpperCase().indexOf(title.toUpperCase()) !== -1))) {
      if (item.position.top > clientWindowBottomY) {
        hideItem(item);
        removeItem(item);
      } else {
        hideItem(item);
      }    
      hiddenFeedItemIds.push(item.id);      
    };
  });
  
  saveToLocalStorage(storageVariableName, hiddenFeedItemIds);
};

function getWindowHeight() {
  return document.body.offsetHeight;
}

let scrollYNext = 0;
let windowHeight = 0;

function onScroll(event) {
  if (window.scrollY > scrollYNext) {
    filterFeedItems(scrollYNext - 100);
    scrollYNext += 300;
    windowHeight = getWindowHeight();
  } else if (getWindowHeight() !== windowHeight) {
    filterFeedItems(scrollYNext - 100);
    windowHeight = getWindowHeight();
  }
}

window.addEventListener('scroll', onScroll);

// ============= Filter button and dialog ============== //

addHtmlToBody(`
<div id="filter-dialog" class="modal">

  <!-- Modal content -->
  <div class="modal-content">
    <span id="filter-dialog-close" class="close">&times;</span>
    <div>
      <h5>Filter Category</h5>
      <textarea id="filter-dialog-categories" rows="5" cols="150"></textarea>
      <h5>Filter Text</h5>
      <textarea id="filter-dialog-titles" rows="5" cols="150"></textarea>
    </div>
  </div>

</div>
`);

const modal = document.getElementById("filter-dialog");
const closeLink = document.getElementById("filter-dialog-close");
const filterCategoriesTextArea = document.getElementById("filter-dialog-categories");
const filterTitlesTextArea = document.getElementById("filter-dialog-titles");

const showModal = function() {
  const categories = getFromLocalStorage(categoryStorageVariableName) || [];
  const titles = getFromLocalStorage(titleStorageVariableName) || [];
  
  filterCategoriesTextArea.value = categories.join('\n');
  filterTitlesTextArea.value = titles.join('\n');
  
  modal.style.display = "block";
};

const closeModal = function() {
  const categories = filterCategoriesTextArea.value.split('\n').filter(v => v);
  const titles = filterTitlesTextArea.value.split('\n').filter(v => v);
  
  saveToLocalStorage(categoryStorageVariableName, categories);
  saveToLocalStorage(titleStorageVariableName, titles);
  
  modal.style.display = "none";
};

closeLink.onclick = closeModal;
window.onclick = function(event) { if (event.target == modal) { closeModal(); }; };

document.querySelectorAll(`header .subscribe-btn`).forEach(element => {
  const filterLink = document.createElement("A");
  filterLink.innerText = "Filter";
  filterLink.className = "btn-filter";
  filterLink.href = "javascript:void(0);";
	filterLink.onclick = showModal;
  
  element.parentElement.appendChild(filterLink);
});
