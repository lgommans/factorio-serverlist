-- This could still be optimized (storage-wise at least) since there will be a lot of duplicate
-- game_versions, mods, tags, etc. entries. For now, this is easy and fast when
-- inserting (inserter, get it?) and it's not as if we have ten million records anyway.

CREATE TABLE factorioservers_config (lastupdate DOUBLE NOT NULL,
	locked_by VARCHAR(32) NOT NULL,
	locked_at DOUBLE NOT NULL);

CREATE TABLE factorioservers_players (id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
	username VARCHAR(255) NOT NULL,
	serverid INT NOT NULL);

CREATE TABLE factorioservers_mods (id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
	name VARCHAR(255) NOT NULL,
	version VARCHAR(255) NOT NULL,
	serverid INT NOT NULL);

CREATE TABLE factorioservers_tags (id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
	tag VARCHAR(255) NOT NULL,
	serverid INT NOT NULL);

INSERT INTO factorioservers_config (lastupdate, locked_by, locked_at) VALUES(0, 'nobody', 0);

CREATE TABLE factorioservers_list (id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
	game_secret VARCHAR(255) NOT NULL,
	build_mode VARCHAR(255) NOT NULL,
	build_version VARCHAR(255) NOT NULL,
	game_version VARCHAR(255) NOT NULL,
	platform VARCHAR(255) NOT NULL,
	description VARCHAR(255) NOT NULL,
	game_id INT NOT NULL,
	game_time_elapsed INT NOT NULL,
	has_password TINYINT NOT NULL,
	host_address VARCHAR(255) NOT NULL,
	last_heartbeat DOUBLE NOT NULL,
	max_players INT NOT NULL,
	mods_crc INT NOT NULL,
	name VARCHAR(255) NOT NULL,
	require_user_verif TINYINT NOT NULL);

