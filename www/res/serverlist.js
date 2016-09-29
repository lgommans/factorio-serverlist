Settings = {
	displayUpdateTimeout: 350, // milliseconds
	updateTime: [57, 65], // seconds, minimum and maximum
	maxModListLength: 55, // characters, before it cuts off into an [expand] link
	serversPerDisplayUpdate: 4, // max number of servers added to $(main) at once (prevent freezing)
	defineScrolled: 400, // pixel threshold before user is considered to have scrolled down
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
		+ server.description + ' '
		+ (server.application_version ? server.application_version.game_version : '') + ' '
		+ server.game_id.toString() + ' '
		+ server.host_address + ' '
		+ 'country:' + (server.country ? server.country : 'local') + ' '
		;

	if (server.tags) {
		for (var i in server.tags) {
			searchable += server.tags[i] + ' ';
		}
	}

	if (server.players) {
		for (var i in server.players) {
			searchable += server.players[i] + ' ';
		}
	}

	if (server.mods) {
		for (var i in server.mods) {
			searchable += server.mods[i].name + " " + server.mods[i].version + ' ';
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

function addThousandSeparator(n) {
	n = n.toString();
	var separated = '';
	var i;
	for (i = n.length - 3; i >= 0; i -= 3) {
		separated = ' ' + n.substr(i, 3) + separated;
	}
	if (i != 0) {
		return n.substr(0, 3+i) + separated;
	}
	return separated.substr(1);
}

function getServerDiv(server) {
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
			country = '(LAN-only)';
		}
	}

	var distance = '';
	if (serverData.yourlocation && server.coords) {
		var km = addThousandSeparator(Math.round(
			coordDistance(serverData.yourlocation, server.coords)
		));
		distance = "<img height=16 src='res/distance3.svg' alt='distance (estimate)' "
			+ "title='distance (estimate)'> "
			+ km + "km"
			+ "&nbsp;&nbsp;&nbsp;";
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
		var link = '';
		for (var i in server.mods) {
			if (server.mods[i].name == 'base') continue;
			link = '<a href="https://mods.factorio.com/?q=' + escape(server.mods[i].name)
				+ '" target="_blank">';
			modstring += comma + link + escapeHtml(server.mods[i].name) + '</a>'
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

	var div = document.createElement('div');
	div.id = 'id' + game_id;

// Sorry 'bout the formatting here. Not sure what the best solution is. This way we can at
// least use HTML indentation while still fitting on any screen larger than a 80-char terminal.
div.innerHTML = ("<img width=20 src='res/link.png' title='Link to game id {GID}' alt='Link' "
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
		+ "{DISTANCE}"
		+ "{USER_VERIF}"
		+ "{PASSWORDED}"
		// This currently doesn't work, since you need the game_secret and factorio has no command line
		// option to provide that.
		//+ "<img height=16 src='res/connect.png' alt='join' title='join' onclick='connect({GID});' "
			//+ "class=clickableImage>"
	)
		.replace(/{GID}/g, game_id)
		.replace(/{NAME}/g, escapeHtml(server.name))
		.replace(/{VERSION}/g, version)
		.replace(/{TIME}/g, playTime)
		.replace(/{PLAYERCOUNTINFO}/g, playerCountInfo)
		.replace(/{COUNTRY}/g, country)
		.replace(/{DISTANCE}/g, distance)
		.replace(/{USER_VERIF}/g, user_verification)
		.replace(/{PASSWORDED}/g, passworded)

		+ description
		+ "<div class='line connect id" + game_id + "'></div>"
		+ getPlayerString(game_id)
		+ "<div class='line tags id" + game_id + "'>" + tagstring + "</div>"
		+ "<div class='line mods id" + game_id + "'>" + modstring + "</div>"
		+ "</div>"
		+ "<hr>";

	return div;
}

function serverScore(server) {
	var score = 0; // higher is better

	if (server.players) {
		// Players are good, but more players is not always better
		var additional = 1000;
		for (var i in server.players) {
			score += Math.max(0, additional);
			additional -= 150;
		}
	}

	if (server.mods && server.mods.length > 1) {
		// Other mods than base? Subtract a little bit from the score since
		// the player might not have those mods.
		score -= 100 + Math.min(10, server.mods.length) * 15;
	}

	if (serverData.yourlocation && server.coords) {
		score -= Math.pow(coordDistance(serverData.yourlocation, server.coords), 2) / 1000;
	}
	else if (server.localIP) {
		score -= 999000; // lan-only, unreachable.
	}

	return score;
}

function sortBy(field) {
	if (field == 'rand') {
		return game_ids;
	}
	if (field == 'distance' && serverData.yourlocation === false) {
		alert("Sorry, we do not know your location, so we cannot sort by distance.");
		return game_ids;
	}

	// sort() sorts in-place, so we need to create a copy with slice(0)
	return game_ids.slice(0).sort(function(a, b) {
		if (field == 'best') {
			return -(serverScore(serverData.servers[a]) - serverScore(serverData.servers[b]));
		}
		else if (field == 'players') {
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
		else if (field == 'distance') {
			// If we don't have coordinates, so it's probably a local IP
			// address, so unreachable, so infinite distance. We could check
			// for a local IP, but I have yet to see a case where it's not
			// cause by a local IP, and returning random coordinates does not
			// seem much better.
			if (!serverData.servers[a].coords) {
				if (!serverData.servers[b].coords) {
					return 0;
				}
				return 1;
			}
			if (!serverData.servers[b].coords) {
				return -1;
			}
			var distToA = coordDistance(serverData.yourlocation, serverData.servers[a].coords);
			var distToB = coordDistance(serverData.yourlocation, serverData.servers[b].coords);
			return distToA - distToB;
		}
		else if (field == 'country') {
			if (serverData.servers[a].country == serverData.servers[b].country) {
				return 0;
			}
			if (serverData.servers[a].country > serverData.servers[b].country) {
				return 1;
			}
			return -1;
		}
	});
}

function coordDistance(latlon1, latlon2) {
	// Adapted from http://stackoverflow.com/a/21623206
	latlon1 = latlon1.split(',');
	latlon2 = latlon2.split(',');

	var p = 0.017453292519943295;
	var c = Math.cos;
	var a = 0.5 - c((latlon2[0] - latlon1[0]) * p)/2 + c(latlon1[0] * p) * c(latlon2[0] * p) * (1 - c((latlon2[1] - latlon1[1]) * p))/2;

	return 12742 * Math.asin(Math.sqrt(a));
}

function deg2rad(deg) {
	return deg * (Math.PI/180);
}

function queueUpdate(game_ids) {
	if (game_ids) {
		_queuedGameIds = game_ids;
		$("main").innerHTML = '';
	}
	if (queueUpdateTimeout !== 'ready') {
		clearTimeout(queueUpdateTimeout);
	}
	for (var i = 0; i < Settings.serversPerDisplayUpdate; i++) {
		var game_id = _queuedGameIds.shift();
		if (game_id) {
			$("main").appendChild(getServerDiv(serverData.servers[game_id]));
		}
		else {
			// Last shift() returned undefined; end of list.
			queueUpdateTimeout = 'ready';
			return;
		}
	}
	queueUpdateTimeout = setTimeout(queueUpdate, 67);
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

	var shownServers = [];

	for (var i in sorted_game_ids) {
		var server = serverData.servers[sorted_game_ids[i]];
		
		if (searchFilter(server)) continue;

		if (modFilter(server)) continue;

		if (parseInt($("#minPlayers").value) > (server.players ? server.players.length : 0)) continue;

		if ($("#passworded").checked && server.has_password == 'true') continue;

		if ($("#onlyUserVerif").checked && server.require_user_verification != 'true') continue;
		else if ($("#hideUserVerif").checked && server.require_user_verification == 'true') continue;

		shownServers.push(sorted_game_ids[i]);

		if (server.players) {
			playersOnline += server.players.length;
		}
	}

	var dataDate = new Date(serverData.lastupdate * 1000);
	var dataHMS = leadingZero(dataDate.getHours()) + ":"
		+ leadingZero(dataDate.getMinutes()) + ":"
		+ leadingZero(dataDate.getSeconds());

	$("#status").innerHTML = (
		'Updated: {TIME} | ' +
		'{PLAYERS} players in {FILTERED_SERVERS} shown servers ({SERVERS} total)')
		.replace('{TIME}', dataHMS)
		.replace('{PLAYERS}', playersOnline)
		.replace('{FILTERED_SERVERS}', shownServers.length)
		.replace('{SERVERS}', game_ids.length)
		;
	
	if (shownServers.length == 0) {
		if (game_ids.length > 0) {
			$("main").innerHTML = "<strong>No servers match your criteria.</strong>";
		}
		else {
			$("main").innerHTML = "There are either no servers online or we are having technical "
				+ "issues. Probably the latter.";
		}
	}
	else {
		// We don't want to store a query that gives no results
		localStorage['searchSettings'] = JSON.stringify({
			search: $("#search").value,
			hidemods: $("#hidemods").value,
			nomods: $("#nomods").checked,
			maxmodno: $("#maxmodno").value,
			minPlayers: $("#minPlayers").value,
			hidePwd: $("#passworded").checked,
			sort: $("#sort").selectedIndex,
			onlyUserVerif: $("#onlyUserVerif").checked,
			hideUserVerif: $("#hideUserVerif").checked,
			allowUserVerif: $("#allowUserVerif").checked,
			version: 2 // Increment me every time you make a change to the fields here
		});
	}

	queueUpdate(shownServers);
}

function error(data) {
	$("#status").innerHTML = 'Error loading data: ' + data;
}

function getScrollPosition() {
	return document.documentElement.scrollTop || document.body.scrollTop;
}

function newServerData(data) {
	serverData = JSON.parse(data);

	game_ids = [];
	for (var game_id in serverData.servers) {
		game_ids.push(game_id);
	}
	game_ids = randomizeGameIds(game_ids);

	var time = getRandom(Settings.updateTime[0] * 1000, Settings.updateTime[1] * 1000);
	if (getScrollPosition() < Settings.defineScrolled) {
		// User is not scrolled down, so rebuilding the list will not reset their scroll position.
		updateDisplay();
	}
	else {
		// They don't see updates anyway, there is an update queued already
		// (for next time they change the filter parameters). We might as well
		// delay it a bit.
		time *= 1.5;
	}

	setTimeout(getNewServerData, time);
}

function load() {
	// maintain dimensions so elements don't jump around
	$("#loadPrevious").style.visibility = 'hidden';

	$("#search").value = lastSearchSettings.search;
	$("#hidemods").value = lastSearchSettings.hidemods;
	$("#nomods").checked = lastSearchSettings.nomods;
	$("#maxmodno").value = lastSearchSettings.maxmodno;
	$("#minPlayers").value = lastSearchSettings.minPlayers;
	$("#passworded").checked = lastSearchSettings.passworded;
	$("#sort").selectedIndex = lastSearchSettings.sort;
	if (lastSearchSettings.version && lastSearchSettings.version > 1) {
		$("#onlyUserVerif").checked = lastSearchSettings.onlyUserVerif;
		$("#hideUserVerif").checked = lastSearchSettings.hideUserVerif;
		$("#allowUserVerif").checked = lastSearchSettings.allowUserVerif;
	}
	updateDisplay();
}

function reset() {
	$("#search").value = '';
	$("#hidemods").value = '';
	$("#nomods").checked = false;
	$("#maxmodno").value = '';
	$("#minPlayers").value = '';
	$("#passworded").checked = true;
	$("#sort").selectedIndex = 0;
	$("#onlyUserVerif").checked = false;
	$("#hideUserVerif").checked = false;
	$("#allowUserVerif").checked = true;
	updateDisplay();
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
				if (getScrollPosition() > Settings.defineScrolled) {
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

// setTimeout id of the loader (prevents display freezing)
queueUpdateTimeout = 'ready';

if (localStorage['searchSettings']) {
	lastSearchSettings = JSON.parse(localStorage['searchSettings']);
	$("#loadPrevious").style.display = 'inline';
}
else {
	lastSearchSettings = {};
}

// Bind fields
onhashchange = updateDisplay;
$("#search").onkeyup = $("#search").onchange = queueDisplayUpdate;
$("#hidemods").onkeyup = $("#hidemods").onchange = queueDisplayUpdate;
$("#nomods").onmouseup = $("#nomods").onchange = updateDisplay;
$("#maxmodno").onkeyup = $("#maxmodno").onchange = $("#maxmodno").onmouseup = queueDisplayUpdate;
$("#minPlayers").onkeyup = $("#minPlayers").onchange = $("#minPlayers").onmouseup = queueDisplayUpdate;
$("#passworded").onmouseup = $("#passworded").onchange = updateDisplay;
$("#sort").onchange = updateDisplay;
$("#onlyUserVerif").onchange = $("#onlyUserVerif").onkeyup = $("#onlyUserVerif").onmouseup = updateDisplay;
$("#hideUserVerif").onchange = $("#hideUserVerif").onkeyup = $("#hideUserVerif").onmouseup = updateDisplay;
$("#allowUserVerif").onchange = $("#allowUserVerif").onkeyup = $("#allowUserVerif").onmouseup = updateDisplay;

// Load the data (this also triggers auto-update in newServerData)
$("#status").innerHTML = "<strong>Loading data...</strong>";
(getNewServerData = function() {
	aGET('get-games.php', newServerData, error);
})();

