// ==UserScript==
// @name            finance.yahoo.com improvements
// @description     Different improvements for finance.yahoo.com
// @include         http*://*finance.yahoo.tld/*
// @downloadURL     https://github.com/abasau/greasemonkey-scripts/raw/master/src/finance.yahoo.user.js
// @homepageURL     https://github.com/abasau/greasemonkey-scripts
// @version         0.5
// @grant    				none
// ==/UserScript==

function runInPageScope(func) {
    var script = document.createElement('script');
    script.appendChild(document.createTextNode('(' + func + ')();'));
    (document.body || document.head || document.documentElement).appendChild(script);
};

function addStyles (styles) {
  const existing = document.getElementById('custom-style');

  if (existing) existing.remove();

  const styleSheet = document.createElement("style")
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  styleSheet.id = 'custom-style';

  document.head.appendChild(styleSheet);
};

function addHeaderLink(parent, text, url) {
  const link = document.createElement("A");
  link.innerText = text;
  link.className = "C(white) Fw(500) Mstart(20px) custom-header-link";
  link.href = url;
  parent.appendChild(link);
  return link;
}

function removeHeaderLinks() {
  const elements = document.querySelectorAll('.custom-header-link');
  
  [].forEach.call(elements, function(element) {
  	element.parentNode.removeChild(element);
  });
}

function addAllLinks() {
  const pathname = window.location.pathname;
  const picker = pathname.split('/').pop();

  const firstHeaderButton = document.querySelector('header button');
  
  if (firstHeaderButton) {
    const container = firstHeaderButton.parentElement;

    removeHeaderLinks();
    addHeaderLink(container, 'Summary', `/quote/${picker}`);
    addHeaderLink(container, 'Zack', `https://www.zacks.com/stock/quote/${picker}`);
  };
}

function addLocationChangeEvents() {
  window.history.pushState = ( f => function pushState(){
      var ret = f.apply(this, arguments);
      window.dispatchEvent(new Event('pushstate'));
      window.dispatchEvent(new Event('locationchange'));
      return ret;
  })(window.history.pushState);

  window.history.replaceState = ( f => function replaceState(){
      var ret = f.apply(this, arguments);
      window.dispatchEvent(new Event('replacestate'));
      window.dispatchEvent(new Event('locationchange'));
      return ret;
  })(window.history.replaceState);

  window.addEventListener('popstate',()=>{
      window.dispatchEvent(new Event('locationchange'))
  });
};

runInPageScope(addLocationChangeEvents);

window.addEventListener('replacestate', addAllLinks);

addStyles(`
.gemini-ad, #mrt-node-Lead-1-Ad, #mrt-node-Lead-2-Ad, #mrt-node-Lead-3-Ad, #mrt-node-Lead-4-Ad, #mrt-node-Lead-5-Ad, #mrt-node-Lead-6-Ad, #mrt-node-Lead-7-Ad {
	display: none !important;
}
`);
