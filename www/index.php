<?php 
	define('INCLUDED', true);

	require('includes/common.php');

	if (isset($_GET['gameid'])) {
		require('includes/game.php');
	}

	require('includes/list.php');

