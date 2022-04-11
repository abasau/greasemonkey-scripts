// ==UserScript==
// @name            YouTube.com mass hiding of recommended videos
// @description     Provides an option on YouTube to mass-hide recommended videos
// @include         http*://*youtube.tld/*
// @downloadURL     https://github.com/abasau/greasemonkey-scripts/raw/master/src/youtube.user.js
// @homepageURL     https://github.com/abasau/greasemonkey-scripts
// @version         1.12
// @grant           none
// ==/UserScript==

// ========================================= //

function addStyles(styles, postfix) {
  const existing = document.getElementById('custom-style');

  if (existing) existing.remove();

  const styleSheet = document.createElement("style")
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  styleSheet.id = 'custom-style-' + postfix;

  document.head.appendChild(styleSheet);
}

function createElementFromHTML(htmlString) {
  const div = document.createElement('div');
  div.innerHTML = htmlString.trim();

  return div.firstChild;
}

function getElementByText(xpath, parent) {
  return document.evaluate(xpath, parent || document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function isHidden(element) {
  return (element.offsetParent === null);
}

// ========================================= //

const buttonContainerClass = 'switch-container';

const styles = `
  .switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 21px;
    top: -5px;
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

function hideContextMenuPopup() {
  document.querySelector('ytd-popup-container').style.display = 'none';
}

function restoreContextMenuPopup() {
  document.querySelector('ytd-popup-container').style.display = 'block';
}

function hideVideo(event) {
  return new Promise((resolve, reject) => {
    const parent = event.target.closest('ytd-rich-item-renderer');
    
    if (parent) {
      const button = parent.querySelector('button#button');

      if (button) {
        hideContextMenuPopup();
        button.click();
      }

      setTimeout(function () {
        const link = getElementByText("//yt-formatted-string[contains(text(),'Not interested')]", parent);

        if (link) {
          link.click();
        }

        restoreContextMenuPopup();

        resolve();
      }, 0);
    } else {
        resolve();
    }
  });
}

function getVideoThumbnails() {
  return Array.from(document.querySelectorAll('ytd-rich-grid-renderer ytd-thumbnail')).filter(element => isHidden(element) === false);
}

function removeAllToogleButtons() {
  const existingToggles = document.querySelectorAll(`.${buttonContainerClass}`);

  existingToggles.forEach(function (existingToggle) {
    existingToggle.remove();
  });
}

function appendToogleButton(container, label) {
  const toogleContainer = createElementFromHTML(`
      <div class="${buttonContainerClass}">
        <span class="title style-scope ytd-guide-entry-renderer" style="margin:5px">${label}</span>
        <label class="switch">
          <input type="checkbox">
          <span class="slider round"></span>
        </label>
      </div>`);

  container.appendChild(toogleContainer);

  return toogleContainer.querySelector('input');
}


function addHideToggleButton() {
  removeAllToogleButtons();

  const recommendedLabelContainer = document.querySelector('#container #center');

  if (recommendedLabelContainer) {
    const hideAllButton = appendToogleButton(recommendedLabelContainer, 'Hide All');

    hideAllButton.onclick = function () {
      const videos = getVideoThumbnails();

      videos
        .reduce((p, video) => p.then(() => hideVideo({ target: video })), Promise.resolve())
        .then(() => this.checked = false);
    };
  }
}

function resetToggleButtonOnNavigation() {
  window.addEventListener('yt-navigate-finish', addHideToggleButton);
}

addStyles(styles, 'toggle');

resetToggleButtonOnNavigation();
addHideToggleButton();
