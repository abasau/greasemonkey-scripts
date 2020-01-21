// ==UserScript==
// @name            businessinsider.com hide articles
// @description     Hide articles on businessinsider.com
// @include         http*://*businessinsider.tld/
// @downloadURL     https://github.com/abasau/greasemonkey-scripts/raw/master/src/businessinsider.user.js
// @homepageURL     https://github.com/abasau/greasemonkey-scripts
// @version         0.1
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

addStyles (`
    .${feedItemClass} {
        //color: #999 !important;
        //background-color: #999 !important;
    }

    .${feedItemClass}.${hiddenClass} * {
        color: #FFF !important;
        background-color: #FFF !important;
    }

    .${feedItemClass}.${hiddenClass} .bi-prime-icon {
        display: none !important;
    }

    .${feedItemClass}.${hiddenClass} .lazy-holder img {
        opacity: 0.0;
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
  
  const data = Array.from(items).map(element => {
    
    const prime = !!element.querySelector('.bi-prime-icon');
    const categoryElement = element.querySelector('.tout-tag-link') || getElementByXpath('./preceding-sibling::*[1]//a[contains(@class, "tout-tag-link")]', element);
    const category = categoryElement ? categoryElement.innerText : "";
    const titleLinkElement = element.querySelector(`.${feedItemTitleClass}`);
    const id = titleLinkElement ? titleLinkElement.href.replace(/[^?]*\//, '').replace(/\?.*/, '') : "";
    
    return { prime, category, id, element }
  });
  
  console.log(data);
  
  return data;
};

function filterFeedItems(cutOffHight) {
  const storageVariableName = 'hidden-feed-items';
  
  const feedItems = getFeedItems();
  const hiddenFeedItemIds = getFromLocalStorage(storageVariableName) || [];

  feedItems.forEach(item => {
    if (hiddenFeedItemIds.includes(item.id)) {
      item.element.classList.add(hiddenClass);     
    } else if (item.prime || (getAbsoluteTopPosition(item.element) + item.element.clientHeight) < cutOffHight) {
      item.element.classList.add(hiddenClass);
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
