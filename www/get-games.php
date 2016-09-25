<?php 
	require('config.php');
	require('geoip/geoip2.phar');

	// Load GeoIP database
	use GeoIp2\Database\Reader;
	$geoip = new Reader('geoip/geolite-city.mmdb');

	$db = new mysqli($db_host, $db_user, $db_pass, $db_name);
	if ($db->connect_error) {
		header('HTTP/1.1 500 Internal Server Error');
		die('Database connection error. If this is a new install, edit config.php.');
	}

	// Check whether database is set up
	// Future improvement: don't run this query on *every* request. Unnecessary load.
	$result = $db->query('SHOW TABLES LIKE "factorioservers"') or die('Database error 573.');
	if ($result->num_rows == 0) {
		// Database tables not created; run database setup
		$db->query('CREATE TABLE factorioservers (lastupdate DOUBLE NOT NULL,
			last_start_update DOUBLE,
			data LONGBLOB)') or die('Database error 5189');

		$db->query('INSERT INTO factorioservers (lastupdate) VALUES(0)') or die('Database error 418');
	}

	// Get the latest data
	$result = $db->query('SELECT lastupdate, last_start_update, data FROM factorioservers')
		or die('Database error 387.');
	list($lastupdate, $last_start_update, $data) = $result->fetch_row();

	// Check if the data needs updating
	$now = microtime(true);
	if ($lastupdate < $now - $cache_duration && $last_start_update < $now - $update_timeout) {
		list($success, $lastupdate_new, $data_new) = serverlist_update();
		if ($success) {
			$lastupdate = $lastupdate_new;
			$data = $data_new;
		}
	}

	try {
		$record = $geoip->city($_SERVER['REMOTE_ADDR']);
		$latlon = '"' . $record->location->latitude . ',' . $record->location->longitude . '"';
	}
	catch (Exception $e) {
		$latlon = 'false';
	}

	die('{"lastupdate":' . $lastupdate . ',"servers":' . $data . ',"yourlocation":' . $latlon . '}');

	function serverlist_update() {
		global $db, $factorio_url, $factorio_username, $factorio_token, $geoip;

		// Mark in the database that we're updating already
		$db->query("UPDATE factorioservers
			SET last_start_update = " . microtime(true)) or die('Database error 7159');

		// Get the latest data
		$url = $factorio_url . '?username=' . $factorio_username . '&token=' . $factorio_token;
		$tmpservers = file_get_contents($url);
		if (strlen($tmpservers) < 2048) {
			return [false, false, false];
		}
		$tmpservers = json_decode($tmpservers, true);
		$lastupdate = microtime(true); // And note from when the data is before further processing

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
				$servers[$game_id]['country'] = '';
			}
			else {
				$servers[$game_id]['localIP'] = false;

				try {
					$record = $geoip->city($ip);
					$servers[$game_id]['country'] = $record->country->isoCode;
					$servers[$game_id]['coords'] = $record->location->latitude . ',' . $record->location->longitude;
				}
				catch (Exception $e) {
					$servers[$game_id]['country'] = '';
					$servers[$game_id]['coords'] = '';
				}
			}
			unset($servers[$game_id]['game_secret']); // This is currently useless info
			unset($servers[$game_id]['mod_crc']); // This is currently useless info
		}

		$json = json_encode($servers);
		$db->query("UPDATE factorioservers SET data = '" . $db->escape_string($json) . "', "
			. "lastupdate = " . $lastupdate) or die('Database error 1958');

		return [true, $lastupdate, $json];
	}

