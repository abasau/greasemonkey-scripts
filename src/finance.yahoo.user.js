// ==UserScript==
// @name            finance.yahoo.com improvements
// @description     Different improvements for finance.yahoo.com
// @include         http*://*finance.yahoo.tld/chart/*
// @downloadURL     https://github.com/abasau/greasemonkey-scripts/raw/master/src/finance.yahoo.user.js
// @homepageURL     https://github.com/abasau/greasemonkey-scripts
// @version         0.1
// @grant    				none
// ==/UserScript==

const pathname = window.location.pathname;
const picker = pathname.split('/').pop();

const pickerQuoteUrl = `/quote/${picker}`;

const pickerLink = document.createElement("A");
pickerLink.innerText = `< [ ${picker} ]`;
pickerLink.className = "C(white) Fw(500) Mstart(20px)";
pickerLink.href = pickerQuoteUrl;

const container = document.querySelector('header button').parentElement;

container.appendChild(pickerLink);
