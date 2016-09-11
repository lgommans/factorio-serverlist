<?php 
	define('INCLUDED', true);

	require('includes/common.php');

	$result = $db->query('SELECT lastupdate, last_start_update FROM factorioservers')
		or die('Database error 387.');
	list($lastupdate, $last_start_update) = $result->fetch_row();

	$t = microtime(true);
	// If lastupdate is too long ago and another thread is not already doing it
	if ($lastupdate < $t - $cache_duration && $last_start_update < $t - $update_timeout) {
		serverlist_update();
	}

	$result = $db->query('SELECT data, lastupdate FROM factorioservers') or die('Database error 68219');
	$result = $result->fetch_row();

	die('{"lastupdate":' . $result[1] . ',"servers":' . $result[0] . '}');

