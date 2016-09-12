<?php 
	function serverlist_update() {
		global $db, $factorio_url, $factorio_username, $factorio_token, $geoip;

		$db->query("UPDATE factorioservers
			SET last_start_update = " . microtime(true)) or die('Database error 7159');

		$url = $factorio_url . '?username=' . $factorio_username . '&token=' . $factorio_token;
		$tmpservers = json_decode(file_get_contents($url), true);

		// Create a game_id=>server array from the dictionary
		$servers = [];
		foreach ($tmpservers as $server) {
			$servers[$server['game_id']] = $server;
		}

		// Perform GeoIP lookups
		foreach ($servers as $game_id=>$server) {
			$ip = substr($server['host_address'], 0, strpos($server['host_address'], ':'));
			if (substr($ip, 0, 3) == '10.' || substr($ip, 0, 6) == '192.168.') {
				// If anyone feels like properly implementing the class B /21, have fun.
				$servers[$game_id]['localIP'] = true;
			}
			else {
				$servers[$game_id]['localIP'] = false;
			}
			try {
				$servers[$game_id]['country'] = $geoip->country($ip)->country->isoCode;
			}
			catch (Exception $e) {
				$servers[$game_id]['country'] = '';
			}
		}

		$servers = $db->escape_string(json_encode($servers));
		$db->query("UPDATE factorioservers
			SET data = '$servers', lastupdate = " . microtime(true)) or die('Database error 1958');
	}

