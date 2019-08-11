// ==UserScript==
// @name        Indeed.com hide employers/jobs
// @description Provides an option on Indeed to hide employers/jobs you are uninterested in
// @include     http*://*indeed.tld/*
// @downloadURL     https://github.com/abasau/greasemonkey-scripts/raw/master/src/indeed.user.js
// @homepageURL     https://github.com/abasau/greasemonkey-scripts
// @version     1
// @grant       none
// ==/UserScript==

var jobId, jobRow;
var employers = document.querySelectorAll(".row .company");
var jobs = document.querySelectorAll(".row[data-jk]");

var hiddenEmployers = localStorage.hiddenEmployers = localStorage.hiddenEmployers || "";
var hiddenJobs = localStorage.hiddenJobs = localStorage.hiddenJobs || "";

function addShowResult(parentNode) {
  var indicatorShow = document.createElement("span");
  indicatorShow.textContent = " [show result] ";
  indicatorShow.style.cursor = "pointer";
  indicatorShow.className = "sl";

  parentNode.appendChild(indicatorShow);

  indicatorShow.addEventListener("click", function () {
    if (this.textContent == " [show result] ") {
      this.parentNode.nextSibling.style.display = "block";
      this.textContent = " [hide result] ";
    } else {
      this.parentNode.nextSibling.style.display = "none";
      this.textContent = " [show result] ";
    }
  });
}

function addEditList(parentNode, type, storageProp) {
  var indicatorEdit = document.createElement("span");
  indicatorEdit.textContent = " [edit " + type + " list] ";
  indicatorEdit.style.cursor = "pointer";
  indicatorEdit.className = "sl";

  parentNode.appendChild(indicatorEdit);

  indicatorEdit.addEventListener("click", function () {
    var existingList = document.getElementById("gm-hidden-edit");
    if (existingList) {
      existingList.parentNode.removeChild(existingList);
    }

    var editList = document.createElement("div");
    editList.id = "gm-hidden-edit";
    editList.innerHTML = '\
        <div style="position: absolute; top: calc(100% + 15px); padding: 15px; background-color: #fff; box-shadow: 1px 1px 5px #bbb; z-index: 2;"> \
          <div>One per line (text must match exactly)</div> \
          <textarea rows="5" cols="30">' + localStorage[storageProp] + '</textarea> \
          <div> \
            <input type="button" id="gm-hidden-save" value="Save"/> \
            <input type="button" id="gm-hidden-cancel" value="Cancel"/> \
          </div> \
        </div>';

    this.parentNode.appendChild(editList);

    document.getElementById("gm-hidden-save").addEventListener("click", function () {
      localStorage[storageProp] = editList.getElementsByTagName("textarea")[0].value;
      editList.parentNode.removeChild(editList);
    });

    document.getElementById("gm-hidden-cancel").addEventListener("click", function () {
      editList.parentNode.removeChild(editList);
    });
  });
}

function hideCard(row, employerName, type, storageProp) {
  row.style.display = "none";

  var indicator = document.createElement("div");
  indicator.textContent = "Hidden " + type + " (" + employerName + ")";
  indicator.className = "row";
  indicator.style.position = "relative";
  indicator.style.color = "gray";

  addShowResult(indicator);
  addEditList(indicator, type, storageProp);

  row.parentNode.insertBefore(indicator, row);
}

function hideEmployer(employerRow, employerName) {
  hideCard(employerRow, employerName, "employer", "hiddenEmployers");
}

function hideJob(jobRow, employerName) {
  hideCard(jobRow, employerName, "job", "hiddenJobs");
}

for (var i = 0; i < employers.length; i++) {
  var employer = employers[i];
  var employerName = employers[i].textContent.trim();
  if (hiddenEmployers.indexOf(employerName) > -1) {
    hideEmployer(employer.closest(".row"), employerName);
  }
}

for (var i = 0; i < jobs.length; i++) {
  var jobRow = jobs[i];
  var jobId = jobRow.getAttribute("data-jk").trim();
  var employerName = jobRow.querySelector(".company").textContent.trim();
  if (hiddenJobs.indexOf(jobId) > -1) {
    hideJob(jobRow, employerName);
  }
}

var saveJobLinks = document.getElementsByClassName("save-job-link");

for (var j = 0; j < saveJobLinks.length; j++) {
  var saveJobLink = saveJobLinks[j];

  var hideEmployerLink = document.createElement("a");

  //hideEmployerLink.className = "sl";
  hideEmployerLink.textContent = "hide employer";

  saveJobLink.parentNode.insertBefore(hideEmployerLink, saveJobLink);
  saveJobLink.parentNode.insertBefore(document.createTextNode(" - "), saveJobLink);

  hideEmployerLink.addEventListener("click", function () {
    var employerName = this.closest(".row").querySelector(".company").textContent.trim();

    var employersRegexp = new RegExp("(^|\\n)" + employerName + "(\\n|$)", "g");
    if (!employersRegexp.test(localStorage.hiddenEmployers)) {
      localStorage.hiddenEmployers += "\n" + employerName;
    }

    hideEmployer(this.closest(".row"), employerName);
  });

  var hideJobLink = document.createElement("a");

  //hideJobLink.className = "sl";
  hideJobLink.textContent = "hide job";

  saveJobLink.parentNode.insertBefore(hideJobLink, saveJobLink);
  saveJobLink.parentNode.insertBefore(document.createTextNode(" - "), saveJobLink);

  hideJobLink.addEventListener("click", function () {
    var jobId = this.closest(".row").getAttribute("data-jk").trim();
    var employerName = this.closest(".row").querySelector(".company").textContent.trim();

    var jobsRegexp = new RegExp("(^|\\n)" + jobId + "(\\n|$)", "g");
    if (!jobsRegexp.test(localStorage.hiddenJobs)) {
      localStorage.hiddenJobs += "\n" + jobId;
    }

    hideJob(this.closest(".row"), employerName);
  });
}

var advancedSearch = document.getElementsByClassName("advanced-search")[0];

addEditList(advancedSearch, "job", "hiddenJobs");
addEditList(advancedSearch, "company", "hiddenEmployers");
