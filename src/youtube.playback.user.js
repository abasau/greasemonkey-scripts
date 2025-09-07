// ==UserScript==
// @name            YouTube.com remember playback speed
// @description     Saves and restores playback speed per channel
// @include         http*://*youtube.tld/watch*
// @downloadURL     https://github.com/abasau/greasemonkey-scripts/raw/master/src/youtube.playback.user.js
// @homepageURL     https://github.com/abasau/greasemonkey-scripts
// @version         1.3
// @grant           none
// ==/UserScript==

// ========================================= //
function executeInPageContext(func) {
  window.eval(`(${func})()`);
}

executeInPageContext(() => {
  let currentStorageListener = null;
  let currentRateChangeHandler = null;
  
  function cleanup() {
    if (currentStorageListener) {
      window.removeEventListener("storage", currentStorageListener);
      currentStorageListener = null;
    }
    if (currentRateChangeHandler) {
      const video = document.getElementsByTagName('video').item(0);
      if (video) {
        video.removeEventListener('ratechange', currentRateChangeHandler);
      }
      currentRateChangeHandler = null;
    }
  }
  
  function initializePlaybackControl() {
    console.log('Initializing playback control...');
    
    // Clean up previous listeners
    cleanup();
    
    function getFromLocalStorage(name) {
      try {
        return localStorage[name] ? JSON.parse(localStorage[name]) : null;
      } catch (e) {
        console.error('Failed to parse localStorage:', e);
        return null;
      }
    }
    
    function saveToLocalStorage(name, value) {
      try {
        localStorage[name] = JSON.stringify(value);
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
    }
    
    const mp = document.getElementById("movie_player");
    if (!mp) {
      console.log('Movie player not found, retrying...');
      setTimeout(initializePlaybackControl, 500);
      return;
    }
    
    let videoData;
    try {
      videoData = mp.getVideoData();
    } catch (e) {
      console.log('Video data not ready, retrying...');
      setTimeout(initializePlaybackControl, 500);
      return;
    }
    
    if (!videoData || !videoData.author) {
      console.log('Author data not available, retrying...');
      setTimeout(initializePlaybackControl, 500);
      return;
    }
    
    const authorName = videoData.author;
    console.log('Author: ' + authorName);
    
    const storageVariableName = "channelPlaybackRates";
    
    function getChannelPlaybackRates() {
      return new Map(getFromLocalStorage(storageVariableName) || []);
    }
    
    function saveChannelPlaybackRates(rates) {
      saveToLocalStorage(storageVariableName, Array.from(rates.entries()));
    }
    
    function onStorageChange(ev) {
      if (ev.key == storageVariableName) {
        syncPlaybackRate();
      }
    }
    
    function savePlaybackRates() {
      try {
        const playbackRates = getChannelPlaybackRates();
        const currentPlaybackRate = mp.getPlaybackRate();
        playbackRates.set(authorName, currentPlaybackRate);
        console.log('Saving playback rates:', playbackRates);
        saveChannelPlaybackRates(playbackRates);
        console.log('Saving: ' + currentPlaybackRate);
      } catch (e) {
        console.error('Failed to save playback rates:', e);
      }
    }
    
    function syncPlaybackRate() {
      try {
        const playbackRates = getChannelPlaybackRates();
        console.log('Playback Rates:', playbackRates);
        
        const playbackRate = playbackRates.get(authorName);
        if (playbackRate) {
          mp.setPlaybackRate(playbackRate);
          console.log('Restoring: ' + playbackRate);
        }
      } catch (e) {
        console.error('Failed to sync playback rate:', e);
      }
    }
    
    // Set up storage listener
    currentStorageListener = onStorageChange;
    window.addEventListener("storage", currentStorageListener);
    
    // Set up rate change handler
    const video = document.getElementsByTagName('video').item(0);
    if (video) {
      currentRateChangeHandler = function(data) {
        console.log('Rate changed:', data);
        savePlaybackRates();
      };
      video.addEventListener('ratechange', currentRateChangeHandler);
    } else {
      console.warn('Video element not found');
    }
    
    console.log('Restoring Playback Rate...');
    syncPlaybackRate();
  }
  
  document.addEventListener("yt-navigate-finish", initializePlaybackControl);
});