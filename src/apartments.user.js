// ==UserScript==
// @name            apartments.com unlike apartments
// @description     Provides an option on apartments.com to unlike apartments
// @include         http*://*apartments.tld/*
// @downloadURL     https://github.com/abasau/greasemonkey-scripts/raw/master/src/apartments.user.js
// @homepageURL     https://github.com/abasau/greasemonkey-scripts
// @version         1.2
// @grant           none
// ==/UserScript==

function runInPageScope(func) {
    var script = document.createElement('script');

    script.appendChild(document.createTextNode('(' + func + ')();'));

    (document.body || document.head || document.documentElement).appendChild(script);
};

function subscribeForResultChanged() {
    // ======= getUnliked ======= //
    var getUnliked = function (prefix) {
        if (!localStorage[prefix + 'Appartments']) {
            localStorage[prefix + 'Appartments'] = JSON.stringify([]);
        }

        return JSON.parse(localStorage[prefix + 'Appartments']);
    };

    // ======= setUnliked ======= //
    var setUnliked = function (unliked, prefix) {
        localStorage[prefix + 'Appartments'] = JSON.stringify(unliked);
    };

    // ======= addUnliked ======= //
    var addUnliked = function (unliked, prefix) {
        var list = getUnliked(prefix);
        list.push(unliked);

        setUnliked(list, prefix);
    };

    // ======= removeUnliked ======= //
    var removeUnliked = function (unliked, prefix) {
        var list = getUnliked(prefix);
        var index = list.indexOf(unliked);

        if (index > -1) {
            list.splice(index, 1);
            setUnliked(list, prefix);
        }
    };

    // ======= addStyles ======= //
    var addStyles = function (styles, postfix) {
        var existing = document.getElementById('custom-style');

        if (existing) existing.remove();

        var styleSheet = document.createElement("style")
        styleSheet.type = "text/css";
        styleSheet.innerText = styles;
        styleSheet.id = 'custom-style-' + postfix;

        document.head.appendChild(styleSheet);
    };

    // ======= setUnlikeStyles ======= //
    var setUnlikeStyles = function (name, color) {
        var styles = "";

        getUnliked(name).forEach(function (listingId) {
            styles += "div[data-id='" + listingId + "'] > img { background-color: " + color + " !important; opacity: 0.8; border-radius: 50%; }\n";
        });

        addStyles(styles, name);
    };

    // ======= addUnlikeButtons ======= //
    var addUnlikeButtons = function (name, color, index) {
        var wrappers = document.querySelectorAll(".infoPadding,.favoriteBox");
        var unliked = getUnliked(name);
        var unlikedClass = 'liked';

        Array.from(wrappers).forEach(function (wrapper) {
            if (wrapper.querySelectorAll(".unlike." + name + "-cat").length == 0) {
                var listingId = (wrapper.closest(".placard[data-listingid]") || document.querySelector("main[data-listingid]")).getAttribute("data-listingid");

                var link = document.createElement("A");

                link.className = "favoriteIcon unlike " + name;
                link.style.cssText = "color: " + color + "; right: " + (-0.6 + index * 2.4) + "rem";

                if (unliked.includes(listingId)) {
                    link.className += ' ' + unlikedClass;
                }

                link.onclick = function (event) {
                    if (this.classList.contains(unlikedClass)) {
                        this.classList.remove(unlikedClass);
                        removeUnliked(listingId, name);
                    } else {
                        this.classList.add(unlikedClass);
                        addUnliked(listingId, name);
                    };

                    setUnlikeStyles(name, color);

                    event.stopPropagation();
                };

                wrapper.appendChild(link);
            }
        })
    };

    // ======= addAllUnlikeButtons ======= //
    var addAllUnlikeButtons = function () {
        addUnlikeButtons('unliked', 'red', 1);
        addUnlikeButtons('maybe', 'blue', 2);
    };

    // ======= setAllUnlikeStyles ======= //
    var setAllUnlikeStyles = function () {
        setUnlikeStyles('unliked', 'red');
        setUnlikeStyles('maybe', 'blue');
    };

    // ====================== //
    setAllUnlikeStyles();
    addAllUnlikeButtons();

    window.requirejs(['Application', 'SearchEvents'], function (app, events) {
        app.Events.Subscribe(events.ResultChanged, null, function () {
            addAllUnlikeButtons();
        })
    });
};

runInPageScope(subscribeForResultChanged);
