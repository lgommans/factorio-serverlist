<?php 
	if (INCLUDED !== true) {
		exit;
	}

	$result = $db->query('
		SELECT l.game_id, l.game_version, l.description, l.name, l.game_time_elapsed,
			l.has_password, l.last_heartbeat, l.max_players, l.require_user_verif,
			m.name, m.version, COUNT(p.serverid)
		FROM factorioservers_list l
		INNER JOIN factorioservers_players p ON p.serverid = l.id
		INNER JOIN factorioservers_mods m ON m.serverid = l.id
		GROUP BY p.serverid') or die('Database error 58932');

	while ($row = $result->fetch_assoc()) {
		foreach ($row as $k=>$v) {
			echo "$k=$v, ";
		}
		echo "<br>\n";
	}

