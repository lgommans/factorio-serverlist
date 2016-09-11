<?php 
	function serverlist_update() {
		global $db, $factorio_url, $factorio_username, $factorio_token;

		$db->query("UPDATE factorioservers
			SET last_start_update = " . microtime(true)) or die('Database error 7159');

		$url = $factorio_url . '?username=' . $factorio_username . '&token=' . $factorio_token;
		$servers = $db->escape_string(file_get_contents($url));

		$db->query("UPDATE factorioservers
			SET data = '$servers', lastupdate = " . microtime(true)) or die('Database error 1958');
	}

