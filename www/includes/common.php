<?php 
	if (INCLUDED !== true) {
		exit;
	}

	require('config.php');

	$db = new mysqli($db_host, $db_user, $db_pass, $db_name);
	if ($db->connect_error) {
		die('Database connection error.');
	}

