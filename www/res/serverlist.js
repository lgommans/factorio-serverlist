function $(query) {
	return document.querySelector(query);
}

function $$(query) {
	// Function named $$ which is more than $ so you get more elements #logic.
	return document.querySelectorAll(query);
}

function aGET(uri, callback, errorCallback) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", uri, true);
	xhr.send();
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			callback(xhr.responseText);
		}
		if (xhr.readyState == 5) {
			errorCallback(xhr.responseText);
		}
	}
}

function updateDisplay() {
	if (serverData === false) {
		return; // Nothing to display.
	}

	if (serverData.length < 1024) {
		return error(serverData);
	}

	var playersOnline = 0;

	for (var i in serverData.servers) {
		$("main").innerHTML += serverData.servers[i].name + "<br>";
		if (serverData.servers[i].players) {
			playersOnline += serverData.servers[i].players.length;
		}
	}

	var d = new Date(serverData.lastupdate * 1000);
	var hour = d.getHours() < 10 ? "0" + d.getHours() : d.getHours();
	var minute = d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes();
	var second = d.getSeconds() < 10 ? "0" + d.getSeconds() : d.getSeconds();

	$("#status").innerHTML = 'Last update: ' + hour + ':' + minute + ":" + second
		+ ' | players online: ' + playersOnline;
}

function error(data) {
	$("#status").innerHTML = 'Error loading data: ' + data;
}

function about() {
	if ($("#about").style.display == 'block') {
		$("#about").style.display = 'none';
	}
	else {
		$("#about").style.display = 'block';
	}
}

function newServerData(data) {
	serverData = JSON.parse(data);
	updateDisplay();
	setTimeout(getNewServerData, 60 * 1000);
}

function queueDisplayUpdate() {
	if (searchTimeout !== false) {
		clearTimeout(searchTimeout);
	}
	searchTimeout = setTimeout(updateDisplay, 200);
}

serverData = false;
searchTimeout = -1;

$("#search").onkeyup = $("#search").onchange = queueDisplayUpdate();
$("#hidemods").onkeyup = $("#hidemods").onchange = queueDisplayUpdate();
$("#nomods").onmouseup = $("#nomods").onchange = queueDisplayUpdate();

$("#status").innerHTML = "<strong>Loading data...</strong>";

(getNewServerData = function() {
	aGET('get-games.php', newServerData, error);
})();

