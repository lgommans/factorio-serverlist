Settings = {
	displayUpdateTimeout: 350, // milliseconds
	updateTime: [57, 65], // seconds, minimum and maximum
	maxModListLength: 55, // characters, before it cuts off into an [expand] link
};

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
	return unsafe.toString()
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function getRandom(min, max) {
	return Math.round(Math.random() * (max - min)) + min;
}

function searchFilter(server) {
	// Returns true if current search setting would hide this server
	if ($("#search").value == '') {
		return false;
	}

	var searchable = server.name
		+ server.description
		+ (server.application_version ? server.application_version.game_version : '')
		+ server.game_id.toString()
		+ server.host_address
		+ 'country:' + (server.country ? server.country : 'local')
		;

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
		if (searchable.toLowerCase().indexOf(q[i].toLowerCase()) == -1) {
			return true;
		}
	}

	return false;
}

function modFilter(server) {
	// Returns true if current mod filter setting would hide this server
	if ($("#nomods").checked) {
		if (server.mods && server.mods.length < 2) {
			return false;
		}
		return true;
	}

	var searchable = '';

	if (server.mods) {
		if ($("#maxmodno").value != '') {
			if (server.mods.length > parseInt($("#maxmodno").value) + 1) { // +1 because of base
				return true;
			}
		}
		for (var i in server.mods) {
			searchable += server.mods[i].name + " " + server.mods[i].version;
		}
	}

	if ($("#hidemods").value == '') {
		return false;
	}

	var query = $("#hidemods").value.split(/ /g);
	for (var i in query) {
		if (query[i] == '') continue;
		if (searchable.toLowerCase().indexOf(query[i].toLowerCase()) != -1) {
			return true;
		}
	}

	return false;
}

function leadingZero(n) {
	if (n < 10) return "0" + n.toString();
	return n.toString();
}

function connect(game_id) {
	if ($(".connect.id" + game_id).innerHTML == '') {
		$(".connect.id" + game_id).innerHTML
			= "factorio --mp-connect " + escapeHtml(serverData.servers[game_id].host_address) + "<br>";
	}
	else {
		$(".connect.id" + game_id).innerHTML = '';
	}
}

function getPlayerString(game_id) {
	var players = serverData.servers[game_id].players;
	if (!players) {
		return '';
	}

	var playerStr = '<div class=line><strong>Players</strong> ';
	var comma = '';
	for (var i in players) {
		if (players[i] == '') continue;
		playerStr += comma + players[i];
		comma = ', ';
	}
	return playerStr + '</div>';
}

function modsExpand(game_id) {
	// Show the rest of the mods
	if ($(".modsexpand.id" + game_id)) {
		$(".modsexpand.id" + game_id).style.display = 'inline';
	}

	// Show the mods' versions
	var els = $$(".modversion.id" + game_id);
	for (var i in els) {
		if (!els[i].style) continue;
		els[i].style.display = 'inline';
	}

	// Hide the expand link
	$(".modsexpandLink.id" + game_id).style.display = 'none';
}

function modsCollapse(game_id) {
	// Hide the expanded section of mods
	if ($(".modsexpand.id" + game_id)) {
		$(".modsexpand.id" + game_id).style.display = 'none';
	}

	// Hide all the mod versions
	var els = $$(".modversion.id" + game_id);
	for (var i in els) {
		if (!els[i].style) continue;
		els[i].style.display = 'none';
	}

	// Show the expand link
	$(".modsexpandLink.id" + game_id).style.display = 'inline';
}

function link(game_id) {
	location.hash = '#game' + game_id;
}

function getServerHTML(server) {
	// Returns the HTML to be rendered for this server

	var playHours = Math.floor(server.game_time_elapsed / 60).toString();
	var playTime = playHours + ":" + leadingZero(server.game_time_elapsed % 60);
	var game_id = parseInt(server.game_id);
	var v = '<span class=versionV>v </span>';
	var version = (server.application_version ? v + server.application_version.game_version : 'n/a');

	var playerCountInfo = (server.players ? server.players.length : 0);
	if (server.max_players && server.max_players > 0) {
		playerCountInfo += "/" + parseInt(server.max_players);
	}
	else {
		playerCountInfo += "/&infin;";
	}

	var user_verification = '';
	if (server.require_user_verification == 'true') {
		user_verification = '<img src="res/user-verification.png" height=16 '
			+ 'title="Requires user verification" alt="user verification">&nbsp;&nbsp;&nbsp;';
	}

	var passworded = '';
	if (server.has_password == 'true') {
		passworded = '<img src="res/passworded.png" height=16 title="Requires password" '
			+ 'alt="passworded">&nbsp;&nbsp;&nbsp;';
	}

	var description = '';
	if (server.description) {
		description = '<i class=line>' + escapeHtml(server.description) + '</i>';
	}

	var country = '';
	if (server.country) {
		country = "<img src='res/flags/" + server.country.toLowerCase() + ".png' height=16 "
			+ "alt='" + server.country + "' title='hosted in " + server.country + "'>";
	}
	else {
		if (server.localIP) {
			country = '(local, unreachable outside LAN)';
		}
	}

	var tagstring = '';
	if (server.tags) {
		tagstring = '<strong>Tags</strong> ';
		var comma = '';
		for (var i in server.tags) {
			tagstring += comma + escapeHtml(server.tags[i]);
			comma = ', ';
		}
	}

	var modstring = '';
	if (server.mods && server.mods.length > 1) {
		modstring = '<strong>Mods</strong> ';
		var expandClassTriggered = false;
		var modsListLength = 0;
		var comma = '';
		for (var i in server.mods) {
			if (server.mods[i].name == 'base') continue;
			modstring += comma + escapeHtml(server.mods[i].name)
				+ "<span class='modversion id" + game_id + "' style='display: none;'> "
				+ escapeHtml(server.mods[i].version) + "</span>";
			modsListLength += (comma + escapeHtml(server.mods[i].name)).length;
			if (modsListLength > Settings.maxModListLength && expandClassTriggered == false) {
				modstring += "<span class='modsexpand id" + game_id + "' style='display: none;'>";
				expandClassTriggered = true;
			}
			comma = ', ';
		}
		if (expandClassTriggered) {
			modstring += " <a href='#' onclick='modsCollapse("
				+ game_id + "); return false;'>[collapse]</a></span>";
		}
		modstring += " <a href='#id" + game_id + "' class='modsexpandLink id" + game_id + "' "
			+ "onclick='modsExpand(" + game_id + "); return false;'>[expand]</a>";
	}

// Sorry 'bout the formatting here. Not sure what the best solution is. This way we can at
// least use HTML indentation while still fitting on any screen larger than a 80-char terminal.
var html = (
"<div id='id{GID}'>"
	+ "<img width=20 src='res/link.png' title='Link to game id {GID}' alt='Link' "
		+ "onclick='link({GID}); return false' class=clickableImage>&nbsp;&nbsp;"
	+ "<span class=serverName>{NAME}</span><br>"
	+ "<div class='serverOverview line'>"
		+ "{COUNTRY} <div class=spacing></div>"
		+ "<img height=16 src='res/person.png' alt='players' title='players'> {PLAYERCOUNTINFO}"
		+ "&nbsp;&nbsp;&nbsp;"
		+ "<span title='playing time in hours and minutes'>"
			+ "<img height=16 src='res/clock.png' alt='playing time (hours, minutes)'> {TIME}</span>"
		+ "&nbsp;&nbsp;&nbsp;"
		+ "{VERSION}"
		+ "&nbsp;&nbsp;&nbsp;"
		+ "{USER_VERIF}"
		+ "{PASSWORDED}"
		+ "<img height=16 src='res/connect.png' alt='join' title='join' onclick='connect({GID});' "
			+ "class=clickableImage>"
	+ "</div>")

		.replace(/{GID}/g, game_id)
		.replace(/{NAME}/g, escapeHtml(server.name))
		.replace(/{VERSION}/g, version)
		.replace(/{TIME}/g, playTime)
		.replace(/{PLAYERCOUNTINFO}/g, playerCountInfo)
		.replace(/{COUNTRY}/g, country)
		.replace(/{USER_VERIF}/g, user_verification)
		.replace(/{PASSWORDED}/g, passworded)

		+ description
		+ "<div class='line connect id" + game_id + "'></div>"
		+ getPlayerString(game_id)
		+ "<div class='line tags id" + game_id + "'>" + tagstring + "</div>"
		+ "<div class='line mods id" + game_id + "'>" + modstring + "</div>"
		+ "</div>"
		+ "<hr>";

	return html;
}

function sortBy(field) {
	if (field == 'rand') {
		return game_ids;
	}

	// sort() sorts in-place, so we need to create a copy with slice(0)
	return game_ids.slice(0).sort(function(a, b) {
		if (field == 'players') {
			var playersA = serverData.servers[a].players;
			var playersB = serverData.servers[b].players;
			return (playersA ? playersA.length : 0) - (playersB ? playersB.length : 0);
		}
		else if (field == 'uptime') {
			return b - a;
		}
		else if (field == 'mods') {
			var modsA = serverData.servers[a].mods;
			var modsB = serverData.servers[b].mods;
			return (modsA ? modsA.length : 0) - (modsB ? modsB.length : 0);
		}
		else if (field == 'playerlim') {
			var limA = serverData.servers[a].max_players;
			var limB = serverData.servers[b].max_players;
			return (limA == 0 ? Infinity : limA) - (limB == 0 ? Infinity : limB);
		}
		else if (field == 'playtime') {
			return serverData.servers[a].game_time_elapsed - serverData.servers[b].game_time_elapsed;
		}
	});
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
	var shownServers = 0;

	if (location.hash.substring(0, 5) == '#game') {
		sorted_game_ids = [location.hash.substring(5)];
		html += "<p><strong>You are viewing a single server.</strong> "
			+ "<a href='#' onclick='location.hash=\"\";'>Back to the full list.</a>"
			+ "</p><hr>";
	}
	else {
		sorted_game_ids = sortBy($("#sort").value.replace('+', ''));
		if ($("#sort").value.indexOf('+') > 0) {
			sorted_game_ids.reverse();
		}
	}

	for (var game_id in sorted_game_ids) {
		var server = serverData.servers[sorted_game_ids[game_id]];
		
		if (searchFilter(server)) continue;
		if (modFilter(server)) continue;
		if (parseInt($("#minPlayers").value) > (server.players ? server.players.length : 0)) continue;
		if ($("#passworded").checked && server.has_password == 'true') continue;

		// no server actually has user verification at this point
		//if (!$("#hideUserVerif").checked && server.require_user_verification == 'true') continue;

		html += getServerHTML(server);
		shownServers++;

		if (server.players) {
			playersOnline += server.players.length;
		}
	}

	$("main").innerHTML = html;

	var dataDate = new Date(serverData.lastupdate * 1000);
	var dataHMS = leadingZero(dataDate.getHours()) + ":"
		+ leadingZero(dataDate.getMinutes()) + ":"
		+ leadingZero(dataDate.getSeconds());

	$("#status").innerHTML = (
		'Updated: {TIME} | ' +
		'{PLAYERS} players in {FILTERED_SERVERS} shown servers ({SERVERS} total)')
		.replace('{TIME}', dataHMS)
		.replace('{PLAYERS}', playersOnline)
		.replace('{FILTERED_SERVERS}', shownServers)
		.replace('{SERVERS}', game_ids.length)
		;
	
	if (shownServers == 0) {
		if (game_ids.length > 0) {
			$("main").innerHTML = "<strong>No servers match your criteria.</strong>";
		}
		else {
			$("main").innerHTML = "There are either no servers online or we are having technical "
				+ "issues. Probably the latter.";
		}
	}
}

function error(data) {
	$("#status").innerHTML = 'Error loading data: ' + data;
}

function newServerData(data) {
	serverData = JSON.parse(data);

	game_ids = [];
	for (var game_id in serverData.servers) {
		game_ids.push(game_id);
	}
	game_ids = randomizeGameIds(game_ids);

	updateDisplay();

	var time = getRandom(Settings.updateTime[0] * 1000, Settings.updateTime[1] * 1000);
	setTimeout(getNewServerData, time);
}

function queueDisplayUpdate() {
	if (searchTimeout !== false) {
		clearTimeout(searchTimeout);
	}
	searchTimeout = setTimeout(updateDisplay, Settings.displayUpdateTimeout);
}

randomizeGameIds = (function() {
	/* Since Javascript cannot seed its random engine, this is necessary. The goal is to show
	 * the servers in a random order for fairness, but between updates it should preserve
	 * the previous order or you'd loose your scroll position every time it auto-updates.
	 *
	 * It randomizes the entire list. When a new server appears, it will be added:
	 *  - at the end if the user is scrolled down; or
	 *  - in a random position if the user is near the top of the page.
	 */

	_randomizedList = [];

	return function(list) {
		if (_randomizedList.length == 0) {
			var index;
			while (list.length > 0) {
				index = Math.floor(Math.random() * list.length);
				_randomizedList.push(list[index]);
				list.splice(index, 1);
			}
			return _randomizedList;
		}

		// Add new game ids
		for (var i in list) {
			if (_randomizedList.indexOf(list[i]) == -1) {
				if ((document.documentElement.scrollTop || document.body.scrollTop) > 400) {
					_randomizedList.push(list[i]);
				}
				else {
					_randomizedList.splice(Math.floor(Math.random() * list.length), 0, list[i]);
				}
			}
		}

		// Remove game ids that disappeared
		var remove = [];
		var indexOffset = 0;
		for (var i in _randomizedList) {
			if (list.indexOf(_randomizedList[i]) == -1) {
				remove.push(i - indexOffset);
				indexOffset++;
			}
		}
		for (var i in remove) {
			_randomizedList.splice(remove[i], 1);
		}

		return _randomizedList;
	};
})();

// This will contain the data from all Factorio servers
serverData = false;

// Randomized (but consistent) array to keep them in order between reloads
game_ids = [];

// setTimeout id, to keep a small delay between when someone is typing and
// actually updating the list (prevent each keystroke triggering an update)
searchTimeout = false;

// Bind fields
onhashchange = queueDisplayUpdate;
$("#search").onkeyup = $("#search").onchange = queueDisplayUpdate;
$("#hidemods").onkeyup = $("#hidemods").onchange = queueDisplayUpdate;
$("#nomods").onmouseup = $("#nomods").onchange = queueDisplayUpdate;
$("#maxmodno").onkeyup = $("#maxmodno").onchange = $("#maxmodno").onmouseup = queueDisplayUpdate;
$("#minPlayers").onkeyup = $("#minPlayers").onchange = $("#minPlayers").onmouseup = queueDisplayUpdate;
$("#passworded").onmouseup = $("#passworded").onchange = queueDisplayUpdate;
$("#sort").onchange = queueDisplayUpdate;

// Load the data (this also triggers auto-update in newServerData)
$("#status").innerHTML = "<strong>Loading data...</strong>";
(getNewServerData = function() {
	aGET('get-games.php', newServerData, error);
})();

