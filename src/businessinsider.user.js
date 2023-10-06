// ==UserScript==
// @name            businessinsider.com hide articles
// @description     Hide articles on businessinsider.com
// @include         http*://*businessinsider.tld/*
// @include         https://www.insider.tld/*
// @downloadURL     https://github.com/abasau/greasemonkey-scripts/raw/master/src/businessinsider.user.js
// @homepageURL     https://github.com/abasau/greasemonkey-scripts
// @version         0.22
// @grant    				none
// ==/UserScript==

const debugMode = false;

// ===================================== //

function addStyles (styles, name) {
  const id = `custom-style-${name}`;
  const existing = document.getElementById(id);

  if (existing) existing.remove();

  const styleSheet = document.createElement("style")
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  styleSheet.id = id;

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

function hashCode(str) {
  var hash = 0, i, chr;
  for (i = 0; i < str.length; i++) {
    chr   = str.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
};

// ===================================== //

const feedItemClass = "hideable-feed-item";
const feedItemTitleClass = "hideable-feed-item-title";
const premiumClass = "bi-premium-icon";
const categoryClass = "tout-tag-link";
const hiddenClass = "hidden-feed-item";
const removedClass = "removed-feed-item";

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

/* Hiding modal dialogs */

.tp-backdrop.tp-active, .tp-modal, .dialog-base {
	display: none !important;
}

body.tp-modal-open, body.js-dialog-open {
	overflow: auto !important;
}

/* Hiding ad news and ads */

.studios-hp-module, .l-ad, .htl-ad-placeholder, .multi-newsletter-signup {
	display: none !important;
}

/* Hiding sign up */

.sticky-banner-active {
	display: none !important;
}

/* Hiding most popular, videos, etc. */

.most-popular, .video-module, .newsletter-signup {
	display: none !important;
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

`, "main");

// ===================================== //

const storageVariableName = 'hidden-feed-items';
const categoryStorageVariableName = 'hidden-feed-categories';
const titleStorageVariableName = 'hidden-feed-titles';

if (debugMode) {
  addStyles (`
    .${feedItemClass} {
      border: 2px solid red !important;
    }

    .${feedItemTitleClass} {
      border: 2px solid black !important;
    }

    .${premiumClass}, .${categoryClass} {
      border: 2px solid lightgreen !important;
    }`, "debug");
};

function getFeedItems() {
  console.log('reading...')
  
  document.querySelectorAll('.js-feed-item, .tout-copy ol li').forEach(element => element.classList.add(feedItemClass));
	document.querySelectorAll('.popular-divider-wrapper').forEach(element => element.classList.add(feedItemClass));
  document.querySelectorAll('.tout').forEach(element => element.classList.add(feedItemClass));
  document.querySelectorAll('.quick-link').forEach(element => element.classList.add(feedItemClass));
  
  document.querySelectorAll(`.${feedItemClass} a.tout-title-link`).forEach(element => element.classList.add(feedItemTitleClass));
  document.querySelectorAll(`.${feedItemClass} a[data-analytics-product-module='hp_tout_clicks']:not(.two-column-tout-image)`).forEach(element => element.classList.add(feedItemTitleClass));
  
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

	    const primeElement = container.querySelector(`.${premiumClass}`);
      const categoryElement = container.querySelector(`.${categoryClass}`);
      
      const prime = !!primeElement;
      const category = categoryElement ? categoryElement.innerText.trim() : "";
      const titleLinkElement = element.querySelector(`.${feedItemTitleClass}`);
      const id = titleLinkElement ? titleLinkElement.href.replace(/[^?]*\//, '').replace(/\?.*/, '') : "";
      const title = titleLinkElement ? titleLinkElement.innerText.trim() : "";
      const position = { top: getAbsoluteTopPosition(element), hight: element.clientHeight, width: element.clientWidth };

      return { prime, category, title, id, position, element, relatedElements, titleLinkElement };
    });
  
  
  if (debugMode) {
  	console.log(data);
  }
  
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
  
  window.hiddenFeedItemIds = window.hiddenFeedItemIds || new Set(getFromLocalStorage(storageVariableName) || []);
  
  const categories = getFromLocalStorage(categoryStorageVariableName) || [];
  const titles = getFromLocalStorage(titleStorageVariableName) || [];
  
  const clientWindowBottomY = window.scrollY + window.innerHeight;

  feedItems.forEach(item => {
    var hash = hashCode(item.id);
    if (window.hiddenFeedItemIds.has(hash)) {
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
      window.hiddenFeedItemIds.add(hash);      
    };
  });
  
  if (!debugMode) {
  	saveToLocalStorage(storageVariableName, Array.from(window.hiddenFeedItemIds));
  }
};

function getWindowHeight() {
  return document.body.scrollHeight;
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
      <textarea id="filter-dialog-categories" rows="5" cols="118"></textarea>
      <h5>Filter Text</h5>
      <textarea id="filter-dialog-titles" rows="5" cols="118"></textarea>
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
  
  filterFeedItems(scrollYNext - 100);
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
