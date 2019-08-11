// ==UserScript==
// @name        apartments.com unlike apartments
// @description Provides an option on apartments.com to unlike apartments
// @include     http*://*apartments.tld/*
// @downloadURL     https://github.com/abasau/greasemonkey-scripts/raw/master/src/apartments.user.js
// @homepageURL     https://github.com/abasau/greasemonkey-scripts
// @version     1
// @grant       none
// ==/UserScript==

function runInPageScope(func) {
    var script = document.createElement('script');

    script.appendChild(document.createTextNode('(' + func + ')();'));

    (document.body || document.head || document.documentElement).appendChild(script);
};

function subscribeForResultChanged() {
    // ======= getUnliked ======= //
    var getUnliked = function () {
        if (!localStorage.unlikedAppartments) {
            localStorage.unlikedAppartments = JSON.stringify([]);
        }

        return JSON.parse(localStorage.unlikedAppartments);
    };

    // ======= setUnliked ======= //
    var setUnliked = function (unliked) {
        localStorage.unlikedAppartments = JSON.stringify(unliked);
    };

    // ======= addUnliked ======= //
    var addUnliked = function (unliked) {
        var list = getUnliked();
        list.push(unliked);

        setUnliked(list);
    };

    // ======= removeUnliked ======= //
    var removeUnliked = function (unliked) {
        var list = getUnliked();
        var index = list.indexOf(unliked);

        if (index > -1) {
            list.splice(index, 1);
            setUnliked(list);
        }
    };

    // ======= addStyles ======= //

    var addStyles = function (styles) {
        var existing = document.getElementById('custom-style');

        if (existing) existing.remove();

        var styleSheet = document.createElement("style")
        styleSheet.type = "text/css";
        styleSheet.innerText = styles;
        styleSheet.id = 'custom-style';

        document.head.appendChild(styleSheet);
    };

    // ======= setUnlikeStyles ======= //

    var setUnlikeStyles = function () {
        var styles = "";

        getUnliked().forEach(function (listingId) {
            styles += "div[data-id='" + listingId + "'] > img { background-color: #FF4500 !important; opacity: 0.5; border-radius: 50%; }\n";
        });

        addStyles(styles);
    };

    // ======= addUnlikeButtons ======= //
    var addUnlikeButtons = function (data) {
        var wrappers = document.getElementsByClassName("infoPadding");
        var unliked = getUnliked();
        var unlikedClass = 'liked';

        Array.from(wrappers).forEach(function (wrapper) {
            if (wrapper.getElementsByClassName("unlike").length == 0) {
                var listingId = wrapper.closest(".placard").getAttribute("data-listingid");

                var link = document.createElement("A");

                link.className = "favoriteIcon unlike";
                link.style.cssText = "color: red; right: 1.8rem";

                if (unliked.includes(listingId)) {
                    link.className += ' ' + unlikedClass;
                }

                link.onclick = function (event) {
                    if (this.className.includes(unlikedClass)) {
                        this.className = this.className.replace(unlikedClass, '');
                        removeUnliked(listingId);
                    } else {
                        this.className += ' ' + unlikedClass;
                        addUnliked(listingId);
                    };

                    setUnlikeStyles();
                    event.stopPropagation();
                };
            }

            wrapper.appendChild(link);
        })
    };

    // ====================== //
    addUnlikeButtons();
    setUnlikeStyles();

    window.requirejs(['Application', 'SearchEvents'], function (app, events) {
        app.Events.Subscribe(events.ResultChanged, null, function () {
            addUnlikeButtons();
        })
    });
};

runInPageScope(subscribeForResultChanged);
