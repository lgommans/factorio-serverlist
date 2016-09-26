# Factorio Serverlist

Unofficial serverlist for Factorio - version 2.1

**Features**

- Display countries
- Search by country, number of players, server version, mods (and versions),
  name, description, tags, IP address, player name... even mod crc!
- Servers are listed in random order for fairness, but order is preserved while
  updating
- List auto-updates every minute
- Filter out passworded servers
- Sort by playing time, number of players online, uptime, etc.

## Installing

Clone the repository into your web server (PHP 5.4+) and modify www/config.php.
You will need a MySQL/MariaDB database.

Setup is done automatically, just open the site.

It uses only one database table called 'factorioservers', so you don't need to
create a new database if you don't want to.

## License

MIT. See the [LICENSE](LICENSE) file. Third party resources are all noted in
the footer of the website (see the live site, or check out
[www/index.html](www/index.html)).

## Contributing

Contributions of any kind are welcome! Documentation, feedback, enhancements,
refactoring, graphics, you name it.

