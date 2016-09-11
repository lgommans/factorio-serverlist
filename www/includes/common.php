<?php 
	if (INCLUDED !== true) {
		exit;
	}

	require('config.php');
	require('includes/functions.php');

	$db = new mysqli($db_host, $db_user, $db_pass, $db_name);
	if ($db->connect_error) {
		die('Database connection error. If this is a new install, edit config.php.');
	}

	// Future improvement: don't run this query on *every* pageload. Unnecessary load.
	$result = $db->query('SHOW TABLES LIKE "factorioservers"') or die('Database error 573.');
	if ($result->num_rows == 0) {
		// Database tables not created
		$create_statements = explode(';', file_get_contents('database_create.sql'));
		foreach ($create_statements as $statement) {
			if (trim($statement) == '') continue;
			$db->query($statement) or die('Database error 416578');
		}
	}

