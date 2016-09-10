<?php 
	define('INCLUDED', true);

	require('includes/common.php');

	$result = $db->query('SELECT lastupdate FROM factorioservers_config') or die('Database error 387.');
	$lastupdate = $result->fetch_row()[0];
	if ($lastupdate < microtime(true) - $cache_duration) {
		serverlist_update();
	}

	if (isset($_GET['gameid'])) {
		require('includes/game.php');
	}

	require('includes/list.php');

