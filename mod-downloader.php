<?php 
	// NOTE: this is not supposed to be publicly accessible. It should be run in a cron job every few hours.

	require('www/config.php');

	// For downloading large mods, plus some margin
	ini_set('memory_limit', (round($maxmodsize / 1024 / 1024) + 50) . 'M');

	if (!is_dir($moddir)) {
		echo "Creating moddir.\n";
		mkdir($moddir);
	}

	$db = new mysqli($db_host, $db_user, $db_name, $db_pass);
	if ($db->connect_error) {
		die('Connection error');
	}

	$mods = $db->query('SELECT DISTINCT name, version, gameversion FROM modlog ORDER BY freq DESC');
	$ugh = 0;
	while ($row = $mods->fetch_row()) {
		if ($ugh++ % 25 == 0) {
			echo round($ugh / $mods->num_rows * 100) . "%\n";
		}

		$modhash = sha1($row[0] . '|' . $row[1]);
		if (file_exists("$moddir/$modhash.zip")) {
			continue;
		}

		if (file_exists("$moddir/$modhash.log")) {
			$data = explode(' ', file_get_contents("$moddir/$modhash.log"));
			$datetime = DateTime::createFromFormat('Y-m-d H:i', $data[count($data) - 2] . ' ' . $data[count($data) - 1])->getTimestamp();
			if (mt_rand(0, time() - $datetime) < $retry_mods_after) {
				// Skip randomly. Skipping becomes less and less likely as the last attempt is longer and longer go.
				// Always skips if it's less than 36 hours ago.
				continue;
			}
		}

		$found = false;

		$encodedName = urlencode($row[0]);
		$encodedName = str_replace('+', '%20', $encodedName);
		$t = microtime(true);
		$results = @file_get_contents("http://mods.factorio.com/api/mods/$encodedName");
		if ($results === false) {
			echo "$row[0] not on the mod portal.\n";
			$fid = fopen("$moddir/$modhash.log", 'w');
			fwrite($fid, 'Mod not found on the mod portal on ' . date('Y-m-d H:i'));
			fclose($fid);
			sleep($ratelimit);
			continue;
		}
		$taken = microtime(true) - $t;
		$json = json_decode($results, true);

		foreach ($json['releases'] as $release) {
			if ($release['version'] == $row[1]) {
				if ($release['file_size'] > $maxmodsize) {
					echo "$row[0] v$row[1] over configured size limit. Skipping.\n";
					break;
				}

				$size = round(intval($release['file_size']) / 1024 / 1024 * 10) / 10;
				echo "Downloading ${size}MB \t$row[0] $row[1]...";

				$opts = array('http'=>array(
					'method'=>"GET",
					'header'=>"Cookie: sessionid=$mods_sessionid\r\n"
				));
				$context = stream_context_create($opts);
				$data = file_get_contents("http://mods.factorio.com$release[download_url]", false, $context);

				if (strlen($data) == $release['file_size']) {
					$fid = fopen("$moddir/$modhash.zip", 'w');
					fwrite($fid, $data);
					unset($data);
					fclose($fid);
					echo " ok (took ${taken}s)\n";
					$found = true;
				}
				else {
					$len = strlen($data);
					$data = substr($data, 0, 2500);
					die("Download of $row[0] v$row[1] failed. Length $len instead of $releases[file_size]. Value: $data\n");
				}

				break;
			}
		}

		if (!$found) {
			echo "Correct version for $row[0] v$row[1] not found.\n";
			$fid = fopen("$moddir/$modhash.log", 'w');
			fwrite($fid, 'Version not available for download on ' . date('Y-m-d H:i'));
			fclose($fid);
		}
		sleep($ratelimit);
	}

