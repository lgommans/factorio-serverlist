<?php 
	function db_sanitize($value) {
		global $db;

		return $db->escape_string($value);
	}

	function serverlist_update() {
		global $db, $factorio_url, $factorio_username, $factorio_token;

		if (!lock_list_for_update()) {
			// Either it was already locked, or we failed to obtain a lock.
			// Whatever, we can do this later, if another thread isn't doing it already.
			return;
		}

		$url = $factorio_url . '?username=' . $factorio_username . '&token=' . $factorio_token;
		$servers = json_decode(file_get_contents($url), true);

		// We want to purge the database and insert the new data, but we don't want to
		// mess it up for everyone until the update is complete. The answer? Transactions!
		$db->query('START TRANSACTION');

		$db->query('DELETE FROM factorioservers_list') or die('Database error 4029');
		$db->query('DELETE FROM factorioservers_mods') or die('Database error 9251');
		$db->query('DELETE FROM factorioservers_tags') or die('Database error 4198');
		$db->query('DELETE FROM factorioservers_players') or die('Database error 682');

		foreach ($servers as $server) {
			if (isset($server['application_version'])) {
				$build_mode = db_sanitize($server['application_version']['build_mode']);
				$build_version = db_sanitize($server['application_version']['build_version']);
				$game_version = db_sanitize($server['application_version']['game_version']);
				$platform = db_sanitize($server['application_version']['platform']);
			}
			else {
				$build_mode = $build_version = $game_version = $platform = 'n/a';
			}
			$game_secret = db_sanitize($server['game_secret']);
			$description = db_sanitize($server['description']);
			$game_id = intval($server['game_id']);
			$game_time_elapsed = intval($server['game_time_elapsed']);
			$has_password = $server['has_password'] == 'true' ? 1 : 0;
			$host_address = db_sanitize($server['host_address']);
			$last_heartbeat = floatval($server['last_heartbeat']);
			$max_players = intval($server['max_players']);
			$mods_crc = intval($server['mods_crc']);
			$name = db_sanitize($server['name']);
			$require_user_verif = $server['require_user_verification'] == 'true' ? 1 : 0;

			$db->query("INSERT INTO factorioservers_list (build_mode, build_version,
					game_version, platform, game_secret, description, game_id, game_time_elapsed,
					has_password, host_address, last_heartbeat, max_players, mods_crc,
					name, require_user_verif)
				VALUES ( '$build_mode', '$build_version', '$game_version', '$platform', '$game_secret',
					'$description', $game_id, $game_time_elapsed, $has_password, '$host_address',
					$last_heartbeat, $max_players, $mods_crc, '$name', $require_user_verif)")
				or die('Database error 6.');
			
			$serverid = $db->insert_id;
			
			foreach ($server['mods'] as $mod) {
				$name = db_sanitize($mod['name']);
				$version = db_sanitize($mod['version']);

				$db->query("INSERT INTO factorioservers_mods (name, version, serverid)
					VALUES('$name', '$version', $serverid)") or die('Database error 8286.');
			}

			if (isset($server['players'])) {
				foreach ($server['players'] as $player) {
					$name = db_sanitize($player);
					$db->query("INSERT INTO factorioservers_players (username, serverid)
						VALUES('$name', $serverid)") or die('Database error 62786');
				}
			}

			if (isset($server['tags'])) {
				foreach ($server['tags'] as $tag) {
					$tag = db_sanitize($tag);
					$db->query("INSERT INTO factorioservers_tags (tag, serverid)
						VALUES('$tag', $serverid)") or die('Database error 640893');
				}
			}
		}

		$db->commit();

		lock_release();
	}

	function lock_list_for_update() {
		global $db, $lock_timeout;

		// 1. Check if anyone else has a lock
		$result = $db->query('SELECT locked_by, locked_at FROM factorioservers_config')
			or die('Database error 5876');
		$result = $result->fetch_row();

		$locked = $result[0] != 'nobody';
		$lock_expired = $result[1] < (microtime(true) - $lock_timeout);
		if ($locked && !$lock_expired) {
			// Another thread is already updating the list, and the lock has not expired.
			return false;
		}

		// 2. Create and set a lock
		$id = bin2hex(openssl_random_pseudo_bytes(16));
		$time = microtime(true);
		$db->query("UPDATE factorioservers_config SET locked_by = '$id', locked_at = $time")
			or die('Database error 1478');

		// 3. Verify that the lock is ours
		$result = $db->query('SELECT locked_by, locked_at 
			FROM factorioservers_config') or die('Database error 684309');
		$lock = $result->fetch_row()[0];
		if ($lock == $id) {
			return true;
		}

		return false;
	}

	function lock_release() {
		global $db;
		$db->query('UPDATE factorioservers_config SET locked_by = "nobody"')
			or die('Database error 589231');
	}

