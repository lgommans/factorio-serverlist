<?php 

// You need a MySQL database to connect to
$db_host = 'p:localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'changeme';

// Your Factorio account username and token, used to get the game list.
// The token can be obtained from 'factorio/player-data.json'. See 'service-token'.
$factorio_username = '';
$factorio_token = 'changeme';

// The URL to contact (username and token parameters will be added).
$factorio_url = 'https://multiplayer.factorio.com/get-games';

// Session id to download mods
$mods_sessionid = 'changeme';

// Directory to store mods in
$moddir = 'mods';

// How long we should sleep after querying the mods server
$ratelimit = 15;

// Maximum mod size (for the mod downloader)
$maxmodsize = 1024 * 1024 * 450; // default: 450MB

// After how long should we retry mods that were previously unavailable?
$retry_mods_after = 3600 * 36; // default: 36h

// Secret parameter to manually trigger an update of the serverlist
$secretUpdateParameter = 'update_changeme';

