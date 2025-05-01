// ==UserScript==
// @name         Komoot GPX Extractor with Highlights
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Extract tour data with highlights from Komoot and save as GPX
// @author       You
// @match        https://www.komoot.com/tour/*
// @match        https://www.komoot.de/tour/*
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @connect      komoot.com
// @connect      komoot.de
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Add a button to the page
    function addExportButton() {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.position = 'fixed';
        buttonContainer.style.top = '70px';
        buttonContainer.style.right = '20px';
        buttonContainer.style.zIndex = '9999';

        const button = document.createElement('button');
        button.innerText = 'Export GPX with Highlights';
        button.style.padding = '10px 15px';
        button.style.backgroundColor = '#f44336';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        button.style.fontWeight = 'bold';
        button.onclick = exportTourData;

        buttonContainer.appendChild(button);
        document.body.appendChild(buttonContainer);
    }

    // Extract tour ID from current URL
    function getTourId() {
        const urlPath = window.location.pathname;
        const matches = urlPath.match(/\/tour\/(\d+)/);
        if (matches && matches.length > 1) {
            return matches[1];
        }
        return null;
    }

    // Helper function to handle compatibility between Greasemonkey and Tampermonkey
    function makeRequest(options) {
        return new Promise((resolve, reject) => {
            // Create a callback function for the response
            const callback = {
                onload: options.onload,
                onerror: options.onerror
            };
            
            // Try to use GM.xmlHttpRequest (Greasemonkey 4+) first
            if (typeof GM !== 'undefined' && GM.xmlHttpRequest) {
                GM.xmlHttpRequest({
                    method: options.method,
                    url: options.url,
                    headers: options.headers,
                    onload: callback.onload,
                    onerror: callback.onerror
                });
            } 
            // Fall back to GM_xmlhttpRequest (Tampermonkey and older Greasemonkey)
            else if (typeof GM_xmlhttpRequest !== 'undefined') {
                GM_xmlhttpRequest({
                    method: options.method,
                    url: options.url,
                    headers: options.headers,
                    onload: callback.onload,
                    onerror: callback.onerror
                });
            } 
            // Last resort: try to use fetch API (may not work due to CORS)
            else {
                fetch(options.url, {
                    method: options.method,
                    headers: options.headers
                })
                .then(response => response.text())
                .then(text => {
                    callback.onload({ responseText: text });
                })
                .catch(error => {
                    callback.onerror(error);
                });
            }
        });
    }

    // Fetch tour data
    function fetchTourData(tourId) {
        return new Promise((resolve, reject) => {
            makeRequest({
                method: "GET",
                url: `https://www.komoot.com/api/v007/tours/${tourId}`,
                headers: {
                    "Content-Type": "application/json"
                },
                onload: function(response) {
                    try {
                        const tourData = JSON.parse(response.responseText);
                        resolve(tourData);
                    } catch (error) {
                        reject("Error parsing tour data: " + error);
                    }
                },
                onerror: function(error) {
                    reject("Error fetching tour data: " + error);
                }
            });
        });
    }

    // Fetch tour timeline
    function fetchTourTimeline(tourId) {
        return new Promise((resolve, reject) => {
            makeRequest({
                method: "GET",
                url: `https://www.komoot.com/api/v007/tours/${tourId}/timeline/`,
                headers: {
                    "Content-Type": "application/json"
                },
                onload: function(response) {
                    try {
                        const timelineData = JSON.parse(response.responseText);
                        resolve(timelineData || []);
                    } catch (error) {
                        reject("Error parsing timeline data: " + error);
                    }
                },
                onerror: function(error) {
                    reject("Error fetching timeline data: " + error);
                }
            });
        });
    }

    // Fetch tour waypoints
    function fetchWaypoints(tourId) {
        return new Promise((resolve, reject) => {
            makeRequest({
                method: "GET",
                url: `https://www.komoot.com/api/v007/tours/${tourId}/coordinates`,
                headers: {
                    "Content-Type": "application/json"
                },
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        const waypoints = data.items || [];
                        resolve(waypoints);
                    } catch (error) {
                        reject("Error parsing waypoints: " + error);
                    }
                },
                onerror: function(error) {
                    reject("Error fetching waypoints: " + error);
                }
            });
        });
    }

    // Extract highlights from tour data and timeline
    function extractHighlights(tourData, timelineData) {
        let highlights = [];
        
        // Get highlights from timeline
        if (timelineData && timelineData._embedded && timelineData._embedded.items) {
            const timelineItems = timelineData._embedded.items;
            
            // Filter highlights from the timeline
            const timelineHighlights = timelineItems.filter(item => 
                item.type === 'highlight' || 
                (item._embedded && item._embedded.reference && item._embedded.reference.type === 'highlight_point')
            );
            
            // Extract highlight data and avoid duplicates
            timelineHighlights.forEach(item => {
                const highlight = item._embedded.reference;
                
                if (highlight && highlight.id) {
                  highlights.push(highlight);
                }
            });
        }
        
        return highlights;
    }

    // Create GPX content
    function createGpxContent(tourData, waypoints, highlights) {
        const tourName = tourData.name || 'Komoot Tour';
        
        // Start GPX document
        let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Komoot GPX Extractor" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(tourName)}</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${escapeXml(tourName)}</name>
    <trkseg>`;

        // Add track points
        waypoints.forEach(wp => {
            gpx += `
      <trkpt lat="${wp.lat}" lon="${wp.lng}">
        <ele>${wp.alt || 0}</ele>
      </trkpt>`;
        });

        // Close track segment
        gpx += `
    </trkseg>
  </trk>`;

        // Add highlights as waypoints
        highlights.forEach(highlight => {
                gpx += `
  <wpt lat="${highlight.mid_point.lat}" lon="${highlight.mid_point.lng}">
    <name>${escapeXml(highlight.name || 'Highlight')}</name>
    <desc>${escapeXml(highlight.description || '')}</desc>
    <type>Highlight</type>
  </wpt>`;
        });

        // Close GPX document
        gpx += `
</gpx>`;

        return gpx;
    }

    // Escape XML special characters
    function escapeXml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    // Download content as a file
    function downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'application/gpx+xml' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    // Main function to export tour data
    async function exportTourData() {
        try {
            const tourId = getTourId();
            if (!tourId) {
                alert('Could not extract tour ID from the URL');
                return;
            }

            // Fetch data
            const tourData = await fetchTourData(tourId);
            const timelineData = await fetchTourTimeline(tourId);
            const waypoints = await fetchWaypoints(tourId);
            
            // Extract highlights from both tour data and timeline
            const highlights = extractHighlights(tourData, timelineData);

            // Create GPX content
            const gpxContent = createGpxContent(tourData, waypoints, highlights);

            // Download GPX file with tour name
            const safeTourName = (tourData.name || 'komoot-tour')
                .replace(/[^a-z0-9]/gi, '-')
                .replace(/-+/g, '-')
                .toLowerCase();
                
            downloadFile(gpxContent, `${safeTourName}-${tourId}.gpx`);
            
            console.log(`Extracted ${waypoints.length} waypoints and ${highlights.length} highlights`);

        } catch (error) {
            console.error('Error exporting tour data:', error);
            alert('Error exporting tour data: ' + error);
        }
    }

    // Initialize the script after page loads
    window.addEventListener('load', function() {
        setTimeout(addExportButton, 1500); // Delay to ensure page is fully loaded
    });
})();
