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

	// Are we supposed to update or return the data?
	if (!isset($_SERVER['REMOTE_ADDR']) || isset($_GET[$secretUpdateParameter])) {
		if (!is_dir($moddir)) {
			// Disable mod checking in this case
			$moddir = false;
		}

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
			// Note which mods are available to download
			if ($moddir && isset($server['mods'])) {
				foreach ($server['mods'] as $key=>$mod) {
					if ($mod['name'] == 'base') continue;

					$modhash = sha1("$mod[name]|$mod[version]");
					if (fexists("$moddir/$modhash.zip")) {
						$servers[$game_id]['mods'][$key]['dl'] = 1;
					}
				}
			}
			unset($servers[$game_id]['game_secret']); // This is currently useless info
			unset($servers[$game_id]['mod_crc']); // This is currently useless info
		}

		$json = json_encode($servers);
		$db->query("UPDATE factorioservers SET data = '" . $db->escape_string($json) . "', "
			. "lastupdate = " . $lastupdate) or die('Database error 1958');

		$db->query('create table if not exists '
			. 'modlog(id int primary key auto_increment, name varchar(255), version varchar(15), gameversion varchar(10), timestamp int unsigned, freq int unsigned default 0)')
			or die('Database error 68184');
		// TODO: add index on name

		foreach ($servers as $game_id=>$server) {
			if (isset($server['players']) && count($server['players']) > 1 && isset($server['mods']) && isset($server['application_version'])) {
				$gameversion = $db->escape_string($server['application_version']['game_version']);
				foreach ($server['mods'] as $mod) {
					if ($mod['name'] == 'base') continue;
					$name = $db->escape_string($mod['name']);
					$version = $db->escape_string($mod['version']);
					$result = $db->query("SELECT id FROM modlog WHERE name = '$name' AND version = '$version' AND gameversion = '$gameversion' AND timestamp > " . (time() - 3600 * 12));
					if ($result->num_rows == 0) {
						$db->query('INSERT INTO modlog(name, version, gameversion, timestamp) '
							. "VALUES('$name', '$version', '$gameversion', " . round($lastupdate) . ')');
						echo "new mod: $name,$version,4game:$gameversion\n";
					}
					else {
						$playercount = count($server['players']);
						$db->query("UPDATE modlog SET freq = freq + $playercount WHERE name = '$name' AND version = '$version' AND gameversion = '$gameversion' AND timestamp > " . (time() - 3600 * 12));
					}
				}
			}
		}

		die('fin');
	}

	$result = $db->query('SELECT lastupdate FROM factorioservers') or die('Database error 6279237');
	$lastupdate = $result->fetch_row()[0];

	if ($lastupdate == $_GET['lastupdate']) die('no update');

	$result = $db->query('SELECT data FROM factorioservers') or die('Database error 387.');
	$data = $result->fetch_row()[0];

	try {
		$record = $geoip->city($_SERVER['REMOTE_ADDR']);
		$latlon = '"' . $record->location->latitude . ',' . $record->location->longitude . '"';
	}
	catch (Exception $e) {
		$latlon = 'false';
	}

	die('{"lastupdate":' . $lastupdate . ',"servers":' . $data . ',"yourlocation":' . $latlon . '}');

	function fexists($filename) {
		// This function is identical to file_exists() but with caching
		global $fexistscache;

		if (!isset($fexistscache)) {
			$fexistscache = [];
		}

		if (!isset($fexistscache[$filename])) {
			$fexistscache[$filename] = file_exists($filename);
		}

		return $fexistscache[$filename];
	}

