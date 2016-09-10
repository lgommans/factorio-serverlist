<?php 
// You need a MySQL database to connect to
$db_host = 'p:localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'changeme';

// Your Factorio account username and token, used to get the game list.
// The token can be obtained from 'factorio/player-data.json'. See 'service-token'.
$factorio_username = '';
$factorio_token = '1234567890abcdef1234567890abcdef';

// How long should the list be cached?
$cache_duration = 15; // seconds

// When updating, the database is locked. After what time should that lock expire?
// This is to prevent cases where a lock is never released.
$lock_timeout = $cache_duration; // seconds

// The URL to contact (username and token parameters will be added).
$factorio_url = 'https://multiplayer.factorio.com/get-games';

