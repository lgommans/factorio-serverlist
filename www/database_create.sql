-- This could still be optimized (storage-wise at least) since there will be a lot of duplicate
-- game_versions, mods, tags, etc. entries. For now, this is easy and fast when
-- inserting (inserter, get it?) and it's not as if we have ten million records anyway.

CREATE TABLE factorioservers_config (lastupdate DOUBLE NOT NULL, -- unix timestamp with microseconds
	locked_by VARCHAR(32) NOT NULL, -- unique id
	locked_at DOUBLE NOT NULL -- unix timestamp with microseconds
	);

CREATE TABLE factorioservers_players (id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
	username VARCHAR(255) NOT NULL,
	serverid INT NOT NULL -- primary key (id) of factorioservers_list
	);

CREATE TABLE factorioservers_mods (id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
	name VARCHAR(255) NOT NULL, -- string
	version VARCHAR(255) NOT NULL, -- semantic version, e.g. "1.2.0"
	serverid INT NOT NULL -- primary key (id) of factorioservers_list
	);

CREATE TABLE factorioservers_tags (id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
	tag VARCHAR(255) NOT NULL,
	serverid INT NOT NULL -- primary key (id) of factorioservers_list
	);

CREATE TABLE factorioservers_list (id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
	game_secret VARCHAR(255) NOT NULL, -- random alphanumeric
	build_mode VARCHAR(255) NOT NULL, -- string, stream|alpha|headless|...
	build_version VARCHAR(255) NOT NULL, -- build number (numeric, but str in the json)
	game_version VARCHAR(255) NOT NULL, -- semantic version, "0.14.0"
	platform VARCHAR(255) NOT NULL, -- string, win64|linux64|win32|...
	description VARCHAR(255) NOT NULL, -- string, user defined
	game_id INT NOT NULL, -- numeric, can be used for /get-game-details/$game_id
	game_time_elapsed INT NOT NULL, -- numeric, probably minutes
	has_password TINYINT NOT NULL, -- string "true" or "false" in json, converted to 1 or 0
	host_address VARCHAR(255) NOT NULL, -- string "1.2.3.4:1234"
	last_heartbeat DOUBLE NOT NULL, -- double-precision unix time
	max_players INT NOT NULL, -- numeric
	mods_crc INT NOT NULL, -- numeric
	name VARCHAR(255) NOT NULL, -- string, user defined
	require_user_verif TINYINT NOT NULL -- string "true" or "false" in json, converted to 1 or 0
	);

INSERT INTO factorioservers_config (lastupdate, locked_by, locked_at) VALUES(0, 'nobody', 0);

