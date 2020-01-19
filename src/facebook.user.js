// ==UserScript==
// @name          facebook.com: clean up
// @include       http*://*facebook.tld/groups/*
// @downloadURL   https://github.com/abasau/greasemonkey-scripts/raw/master/src/facebook.user.js
// @homepageURL   https://github.com/abasau/greasemonkey-scripts
// @version       0.2
// @grant         none
// ==/UserScript==

const addStyles = function (styles) {
  var existing = document.getElementById('custom-style');

  if (existing) existing.remove();

  var styleSheet = document.createElement("style")
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  styleSheet.id = 'custom-style';

  document.head.appendChild(styleSheet);
};

const commentsSelector = "*[data-testid='UFI2CommentsList/root_depth_0']";
const newPostSelector = "#pagelet_group_composer";
const inviteIntoGroupSelector = "*[data-testid='GROUP_RHC_164489826895912']";

addStyles(`
${commentsSelector}, ${newPostSelector}, ${inviteIntoGroupSelector} {
	display: none !important;
}
`);
