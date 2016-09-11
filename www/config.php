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

/* Git instructions for developers (if you want to upload changes for the project):
 * 
 * Gitignore is a very nice thing which ignores you. That's why it's called gitignore: it ignores you.
 * When you put www/config.php in gitignore, it will happily *not* ignore the config.php file and
 * instead include it when you try to commit.
 * Therefore, it is necessary to run this command if you want to exclude changes when contributing:
 *  git update-index --assume-unchanged www/config.php
 * Unlike a change in gitignore, this change is not included in a commit so we cannot solve it for
 * once and for all. On git's behalf, I'm terribly sorry for the inconvenience.
 */
