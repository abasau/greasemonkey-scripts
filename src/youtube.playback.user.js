// ==UserScript==
// @name            YouTube.com remember playback speed
// @description     Saves and restores playback speed per channel
// @include         http*://*youtube.tld/watch*
// @downloadURL     https://github.com/abasau/greasemonkey-scripts/raw/master/src/youtube.playback.user.js
// @homepageURL     https://github.com/abasau/greasemonkey-scripts
// @version         1.1
// @grant           none
// ==/UserScript==

// ========================================= //

function executeInPageContext(func) {
  window.eval(`(${func})()`);
}

executeInPageContext(() => document.addEventListener("yt-navigate-finish", function(){
  
  function getFromLocalStorage (name) {
    return localStorage[name] ? JSON.parse(localStorage[name]) : null;
  };

  function saveToLocalStorage (name, value) {
    localStorage[name] = JSON.stringify(value);
  };

  const mp = document.getElementById("movie_player");
  
  if (!mp) return;
  
  const authorName = mp.getVideoData().author;
  //console.log( mp );
  
  window.addEventListener("storage", onStorageChange);

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
    const playbackRates = getChannelPlaybackRates();
    const currentPlaybackRate = mp.getPlaybackRate();
    playbackRates.set(authorName, currentPlaybackRate);
    console.log(playbackRates);
    saveChannelPlaybackRates(playbackRates);
    //console.log('Saving: ' + currentPlaybackRate);
  }
  
  function syncPlaybackRate() {
    const playbackRates = getChannelPlaybackRates();
    const playbackRate = playbackRates.get(authorName);
    playbackRate && mp.setPlaybackRate(playbackRate);
    //console.log('Restoring: ' + playbackRate);
  }
  
  document.getElementsByTagName('video').item(0).onratechange = function(data) {
    //console.log(data);
    savePlaybackRates();
  }
  
  syncPlaybackRate();

}));
