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


function escapeHtml(unsafe) {
	// From https://stackoverflow.com/a/6234804/1201863
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function searchFilter(server) {
	// Returns true if current search setting would hide this server
	if ($("#search").value == '') {
		return false;
	}

	var searchable = server.name
		+ server.description;
		+ (server.application_version ? server.application_version.game_version : '')
		+ server.game_id.toString()
		+ server.host_address;

	if (server.tags) {
		for (var i in server.tags) {
			searchable += server.tags[i];
		}
	}

	if (server.players) {
		for (var i in server.players) {
			searchable += server.players[i];
		}
	}

	if (server.mods) {
		for (var i in server.mods) {
			searchable += server.mods[i].name + " " + server.mods[i].version;
		}
	}

	var q = $("#search").value.split(/ /g);
	for (var i in q) {
		if (q[i] == '') continue;
		if (searchable.toLowerCase().indexOf(q[i].toLowerCase()) != -1) {
			return false;
		}
	}

	return true;
}

function modFilter(server) {
	// Returns true if current mod filter setting would hide this server
	if ($("#nomods").checked) {
		if (server.mods && server.mods.length < 2) {
			return false;
		}
		return true;
	}

	if ($("#hidemods").value == '') {
		return false;
	}

	var searchable = '';

	if (server.mods) {
		for (var i in server.mods) {
			searchable += server.mods[i].name + " " + server.mods[i].version;
		}
	}

	var query = $("#hidemods").value.split(/, ?/g);
	for (var i in query) {
		if (query[i] == '') continue;
		if (searchable.toLowerCase().indexOf(query[i].toLowerCase()) != -1) {
			return false;
		}
	}

	return true;
}

function getServerHTML(server) {
	// Returns the HTML to be rendered for this server

	var html = '';
	html += '<span class=serverName>' + escapeHtml(server.name) + "</span>"
		+ "<img src='res/flags/" + server.country.toLowerCase() + ".gif' alt='" + server.country + "' title='"
		+ server.country + "'><br>";

	if (server.mods) {
		for (var i in server.mods) {
			html += server.mods[i].name + ", ";
		}
	}

	html += "<hr>";

	return html;
}

function updateDisplay() {
	if (searchTimeout !== false) {
		searchTimeout = false;
	}

	if (serverData === false) {
		return; // Nothing to display.
	}

	if (serverData.length < 1024) {
		return error(serverData);
	}

	var playersOnline = 0;
	var html = '';

	for (var game_id in game_ids) {
		var server = serverData.servers[game_ids[game_id]];
		
		if (searchFilter(server)) continue;
		if (modFilter(server)) continue;

		html += getServerHTML(server);

		if (server.players) {
			playersOnline += server.players.length;
		}
	}

	$("main").innerHTML = html;

	var d = new Date(serverData.lastupdate * 1000);
	var hour = d.getHours() < 10 ? "0" + d.getHours() : d.getHours();
	var minute = d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes();
	var second = d.getSeconds() < 10 ? "0" + d.getSeconds() : d.getSeconds();

	$("#status").innerHTML = 'Last server update: ' + hour + ':' + minute + ":" + second
		+ ' | players in shown servers: ' + playersOnline;
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

	game_ids = [];
	for (var game_id in serverData.servers) {
		game_ids.push(game_id);
	}
	game_ids = randomizeList(game_ids);

	updateDisplay();

	setTimeout(getNewServerData, 6 * 1000);
}

function queueDisplayUpdate() {
	if (searchTimeout !== false) {
		clearTimeout(searchTimeout);
	}
	searchTimeout = setTimeout(updateDisplay, 200);
}

randomizeList = (function() {
	/* Since Javascript cannot seed its random engine, this is necessary. The goal is to
	 * show the servers in a random order for fairness, but between updates it should
	 * preserve the previous order or you'd loose your scroll position every time it updates.
	 */

	_random_numbers = [];

	return function(list) {
		var newlist = [], index = -1, ptr = 0;
		while (list.length > 0) {
			if (ptr >= _random_numbers.length) {
				_random_numbers.push(Math.random());
			}
			index = Math.floor(_random_numbers[ptr] * list.length);
			newlist.push(list[index]);
			list.splice(index, 1);
			ptr++;
		}
		return newlist;
	};
})();

serverData = false;
game_ids = [];
searchTimeout = false;

$("#search").onkeyup = $("#search").onchange = queueDisplayUpdate;
$("#hidemods").onkeyup = $("#hidemods").onchange = queueDisplayUpdate;
$("#nomods").onmouseup = $("#nomods").onchange = queueDisplayUpdate;

$("#status").innerHTML = "<strong>Loading data...</strong>";

(getNewServerData = function() {
	aGET('get-games.php', newServerData, error);
})();

