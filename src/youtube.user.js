// ==UserScript==
// @name            YouTube.com mass hiding of recommended videos
// @description     Provides an option on YouTube to mass-hide recommended videos
// @include         http*://*youtube.tld/*
// @downloadURL     https://github.com/abasau/greasemonkey-scripts/raw/master/src/youtube.user.js
// @homepageURL     https://github.com/abasau/greasemonkey-scripts
// @version         1.2
// @grant           none
// ==/UserScript==

var styles = `
.switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 21px;
  }
  
  .switch input { 
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    -webkit-transition: .4s;
    transition: .4s;
  }
  
  .slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 5px;
    bottom: 3px;
    background-color: white;
    -webkit-transition: .4s;
    transition: .4s;
  }
  
  input:checked + .slider {
    background-color: #2196F3;
  }
  
  input:focus + .slider {
    box-shadow: 0 0 1px #2196F3;
  }
  
  input:checked + .slider:before {
    -webkit-transform: translateX(16px);
    -ms-transform: translateX(16px);
    transform: translateX(16px);
  }
  
  /* Rounded sliders */
  .slider.round {
    border-radius: 20px;
  }
  
  .slider.round:before {
    border-radius: 50%;
  }
`;

var addStyles = function (styles, postfix) {
    var existing = document.getElementById('custom-style');

    if (existing) existing.remove();

    var styleSheet = document.createElement("style")
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    styleSheet.id = 'custom-style-' + postfix;

    document.head.appendChild(styleSheet);
};

function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    return div.firstChild;
};

function hideVideo(event) {
    var parent = event.target.closest('ytd-grid-video-renderer');

    var button = parent.querySelector('button#button');
    if (button) button.click();

    setTimeout(function () {
        var link = getElementByText("//yt-formatted-string[contains(text(),'Not interested')]", parent);
        if (link) link.click();
    }, 0)
}

function getElementByText(xpath, parent) {
    return document.evaluate(xpath, parent || document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function addRemoveHidingHandlers(add) {
    var videos = Array.from(document.querySelectorAll('ytd-grid-video-renderer .ytd-thumbnail'));

    videos.forEach(function (video) {
        if (add) {
            video.addEventListener('mouseover', hideVideo);
        } else {
            video.removeEventListener('mouseover', hideVideo);
        };
    });
}

function addHideToggleButton() {
    addRemoveHidingHandlers(false);

    const buttonId = 'hide-on-hover';
    const buttonContainerId = `${buttonId}-container`;

    var existingToggle = document.getElementById(buttonContainerId);
    if (existingToggle) existingToggle.remove();

    var recommendedLabelContainer = document.querySelector('.grid-subheader');
    if (recommendedLabelContainer) {
        var el = createElementFromHTML(`
        <div id="${buttonContainerId}" style="position:relative;left:85%;top:-15px">
            <span class="title style-scope ytd-guide-entry-renderer" style="margin:5px">Hide on Hover</span>
            <label class="switch">
                <input id="${buttonId}" type="checkbox">
                <span class="slider round"></span>
            </label>
        </div>`);

        recommendedLabelContainer.appendChild(el);

        document.getElementById(buttonId).onclick = function () {
            addRemoveHidingHandlers(this.checked);
        };
    }
}

addStyles(styles, 'toggle');

window.addEventListener('yt-navigate-finish', addHideToggleButton);

addHideToggleButton();
