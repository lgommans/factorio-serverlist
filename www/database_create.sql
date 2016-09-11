CREATE TABLE factorioservers (lastupdate DOUBLE NOT NULL, -- unix timestamp with microseconds
	last_start_update DOUBLE, -- unix timestamp with microseconds
	data LONGBLOB -- the JSON returned by /get-games
	);

INSERT INTO factorioservers (lastupdate) VALUES(0);

