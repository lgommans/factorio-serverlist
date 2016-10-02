# Factorio Serverlist

Unofficial serverlist and mod pack generator for Factorio - version 3.0

(It was originally just a serverlist, now it also serves mods. Hence the name.)

**Serverlist features**

- Display countries and sort by closest server
- Search by number of players, server version, mods (and versions),
  server name, description, tags, IP address and player name
- List auto-updates every minute
- Filter out passworded servers or servers that require user verification
- Sort by playing time, number of players online, uptime, etc.
- It remembers your last search settings

**Mod pack generator**

Since version 3.0, a mod pack generator has been added. It is integrated into
this project because it fits nicely in the web interface (no need for a
separate website) and because it uses the serverlist data as well.

## Installing

You will need a MySQL/MariaDB database and a web server running PHP 5.4 or
newer. Copy all the files in `www` into the desired web directory and modify
`config.template.php`. After modifying, rename it to `config.php`.

Database setup is done automatically. It uses two tables: `factorioservers`
and `modlog`. Unless you have existing tables named that way, you don't need
to create a new database.

The final step is to setup a cronjob for updating the serverlist and
downloading mods. For the serverlist, either call get-games.php from the
command line (causing `$_SERVER[REMOTE_ADDR]` to be unset) or call
`get-games.php?secretUpdateParameter` (see `config.php` to configure the
parameter). For the mod downloader, call `mod-downloader.php` from the command
line.

## License

MIT. See the [LICENSE](LICENSE) file. Third party resources are all noted in
the footer of the website (see the live site, or check out
[www/index.html](www/index.html)).

## Contributing

Contributions of any kind are welcome! Documentation, feedback, enhancements,
refactoring, graphics, you name it.

