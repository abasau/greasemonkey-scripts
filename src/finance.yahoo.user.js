// ==UserScript==
// @name            finance.yahoo.com improvements
// @description     Different improvements for finance.yahoo.com
// @include         http*://*finance.yahoo.tld/chart/*
// @downloadURL     https://github.com/abasau/greasemonkey-scripts/raw/master/src/finance.yahoo.user.js
// @homepageURL     https://github.com/abasau/greasemonkey-scripts
// @version         0.2
// @grant    				none
// ==/UserScript==

const pathname = window.location.pathname;
const picker = pathname.split('/').pop();

function addHeaderLink(parent, text, url) {
  const link = document.createElement("A");
  link.innerText = text;
  link.className = "C(white) Fw(500) Mstart(20px)";
  link.href = url;
  parent.appendChild(link);
  return link;
}

const container = document.querySelector('header button').parentElement;

addHeaderLink(container, 'Summary', `/quote/${picker}`);
addHeaderLink(container, 'Zack', `https://www.zacks.com/stock/quote/${picker}`);
