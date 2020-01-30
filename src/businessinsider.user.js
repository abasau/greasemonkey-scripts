// ==UserScript==
// @name            businessinsider.com hide articles
// @description     Hide articles on businessinsider.com
// @include         http*://*businessinsider.tld/
// @downloadURL     https://github.com/abasau/greasemonkey-scripts/raw/master/src/businessinsider.user.js
// @homepageURL     https://github.com/abasau/greasemonkey-scripts
// @version         0.4
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
`);

// ===================================== //

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
      const category = categoryElement ? categoryElement.innerText : "";
      const titleLinkElement = element.querySelector(`.${feedItemTitleClass}`);
      const id = titleLinkElement ? titleLinkElement.href.replace(/[^?]*\//, '').replace(/\?.*/, '') : "";
      const position = { top: getAbsoluteTopPosition(element), hight: element.clientHeight, width: element.clientWidth };

      return { prime, category, id, position, element, relatedElements };
    });
  
  console.log(data);
  
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
  const storageVariableName = 'hidden-feed-items';
  
  const feedItems = getFeedItems();
  const hiddenFeedItemIds = getFromLocalStorage(storageVariableName) || [];
  
  const clientWindowBottomY = window.scrollY + window.innerHeight;

  feedItems.forEach(item => {
    if (hiddenFeedItemIds.includes(item.id)) {
      if (item.position.top > clientWindowBottomY) {
        hideItem(item);
        removeItem(item);
      } else {
        hideItem(item);
      }
    } else if (item.prime || (item.position.top + item.position.hight) < cutOffHight) {
      hideItem(item);     
      hiddenFeedItemIds.push(item.id);      
    };
  });
  
  saveToLocalStorage(storageVariableName, hiddenFeedItemIds);
};

let scrollYNext = 0;

function onScroll(event) {
  if (window.scrollY > scrollYNext) {
    filterFeedItems(scrollYNext - 100);
    scrollYNext += 300;
  }
}

window.addEventListener('scroll', onScroll);
