<?php 
	require('config.php');

	$moddir = 'mods';
	if (!is_dir($moddir)) {
		mkdir($moddir);
	}

	$db = new mysqli($db_host, $db_user, $db_pass, $db_name);
	if ($db->connect_error) {
		header('HTTP/1.1 500 Internal Server Error'); die('Database connection error. If this is a new install, edit config.php.');
	}

	if (isset($_GET['versions'])) {
		$result = $db->query('SELECT DISTINCT gameversion FROM modlog') or die('Database error 47841');
		$versions = [];
		while ($row = $result->fetch_row()) {
			$versions[] = $row[0];
		}
		usort($versions, function($a, $b) {
			$aa = explode('.', $a);
			$bb = explode('.', $b);
			if (intval($aa[0]) < intval($bb[0])) {
				return 1;
			}
			else if (intval($bb[0]) < intval($aa[0])) {
				return -1;
			}
			else if (intval($aa[1]) < intval($bb[1])) {
				return 1;
			}
			else if (intval($bb[1]) < intval($aa[1])) {
				return -1;
			}
			else if (intval($aa[2]) < intval($bb[2])) {
				return 1;
			}
			else if (intval($bb[2]) < intval($aa[2])) {
				return -1;
			}
			return 0;
		});
		die(json_encode($versions));
	}

	if (!empty($_GET['version'])) {
		$mods = [];
		$unavailable = [];

		$result = $db->query('SELECT x.name, x.version, SUM(x.freq) as y FROM '
			. '(SELECT m.name, m.version, m.freq FROM modlog m '
			. 'WHERE m.gameversion = "' . $db->escape_string($_GET['version']) . '" '
			. 'AND m.timestamp > ' . (time() - 3600 * 24 * 14) . ') as x '
			. 'GROUP BY x.name, x.version '
			. 'ORDER BY y') or die('Database error 5182');

		while ($row = $result->fetch_row()) {
			if (isset($_GET['limit'])) {
				if (count($mods) >= intval($_GET['limit'])) {
					break;
				}
			}

			$name = $row[0];
			$version = $row[1];
			$freq = intval($row[2]) + 1; // +1 or it would show up as "popularity: 0", which looks weird

			$modhash = sha1("$name|$version");
			if (file_exists("$moddir/$modhash.zip")) {
				$fsize = filesize("$moddir/$modhash.zip");

				// Inclusion score (higher = more likely to be included) is basically a "bang for the bucks" value.
				// A lot of bang (high popularity; required for many servers) for few bucks (megabytes) should be
				// included first. The popularity is counted 4 times more than size because otherwise you'd get a
				// lot of tiny (but nearly useless) mods. The 140 bytes added to the filesize is to make up for
				// the header size in the zip file. (A zip with 100 1-byte files will be a lot larger than a zip
				// with one 100-byte file.)
				$inclusionScore = ($freq * 4) / ($fsize + 140 + strlen($name + $version));

				$mods[] = [$name, $version, $fsize, $freq, $inclusionScore];
			}
			else {
				$unavailable[] = [$name, $version, $freq];
			}
		}

		// Sort the mods by inclusion score
		usort($mods, function($a, $b) {
			if ($a[4] > $b[4]) {
				return -1;
			}
			if ($a[4] < $b[4]) {
				return 1;
			}
			return 0;
		});
	}

	if (!isset($_GET['dl'])) {
		die(json_encode([$mods, $unavailable]));
	}
	else {
		require('phpzipstream.php');

		$totalFilesize = 0; // The sum of all files' contents
		$size = 0; // size is the variable that matches Javascript's method (to get the same results... or as close as possible with any intermediate database updates)
		$filenameLengths = 0;
		$maxsize = floatval($_GET['maxsize']);
		$modpack = [];
		foreach ($mods as $mod) {
			if ($size > $maxsize) {
				// If the modpack has reached the maximum size...
				break;
			}

			if ($mod[2] + $size > $maxsize) {
				// Don't add this mod to the modpack if it would make the modpack oversized
				continue;
			}

			$filenameLengths += strlen($mod[0]) + strlen($mod[1]) + 5; // name + version + "_" and ".zip"

			$modhash = sha1("$mod[0]|$mod[1]");
			$filesize = filesize("$moddir/$modhash.zip");

			$totalFilesize += $filesize;
			$size += $filesize + 140 + strlen($mod[0]) + strlen($mod[1]); // +140 because each file requires a header in the zip file
			$modpack[$modhash] = $mod;
		}

		header('Content-Type: application/zip');
		header('Content-Length: ' . calculateFilesize(count($modpack), $filenameLengths, $totalFilesize));
		header('Content-Disposition: attachment; filename="modpack-' . $_GET['version'] . '-' . date('Y-m-d') . '.zip"');

		foreach ($modpack as $modhash=>$mod) {
			outputFile("$moddir/$modhash.zip", "$mod[0]_$mod[1].zip");
		}
		outputCentralDirectory();
		exit;
	}

	die('Invalid request.');

