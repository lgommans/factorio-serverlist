<?php 
	function leadingZeros($n, $zeros) {
		return str_repeat('0', $zeros - strlen($n)) . $n;
	}

	function swapEndianness($hex) {
		// From: http://stackoverflow.com/a/7548355
		return implode('', array_reverse(str_split($hex, 2)));
	}

	function outputFile($real_filename, $output_filename) {
		global $centralDirectory, $byteOffset;

		$filesize = filesize($real_filename);
		$size = swapEndianness(leadingZeros(dechex($filesize), 8));
		$crc32 = swapEndianness(hash_file('crc32b', $real_filename));
		$header_hex = '0a00' // minimum version to extract: 1 (no idea what this black magic encoding is, but other encoders do it this way, and decoders recognize it)
			. '0000' // general purpose flag (indicates encryption and compression options)
			. '0000' // no compression (since they're already zip files)
			. '00000000' // date and time. We don't know this, it's mod x version y. Date/time metadata is useless.
			. $crc32
			. $size // compressed size
			. $size // uncompressed size
			. swapEndianness(leadingZeros(dechex(strlen($output_filename)), 4)) // filename length
			. '0000'; // extra field length

		echo hex2bin('504b0304' . $header_hex);

		echo $output_filename;

		$i = 0;
		$blocksize = 1024 * 1024;
		$fid = fopen($real_filename, 'r');
		while ($i < $filesize) {
			echo fread($fid, $blocksize);
			$i += $blocksize;
		}
		fclose($fid);

		$centralDirectory[] = ['header' => $header_hex,
			'offset' => $byteOffset,
			'fname' => $output_filename];
		$byteOffset += $filesize + strlen($output_filename) + 4 /* magic */ + strlen($header_hex) / 2;
	}

	function outputCentralDirectory() {
		global $centralDirectory, $byteOffset;

		$centralDirectorySize = 0;

		foreach ($centralDirectory as $entry) {
			$tmp = '';
			$tmp .= hex2bin('504b0102'
				. '1e03' // version made by
				. $entry['header']
				. '0000' // comment length
				. '0000' // disk number start
				. '0000' // internal file attributes
				. '0000ed81' // external file attributes (I have no idea what ed81 means)
				. swapEndianness(leadingZeros(dechex($entry['offset']), 8))
			);
			$tmp .= $entry['fname'];
			echo $tmp;
			$centralDirectorySize += strlen($tmp);
		}
		/* seems to be optional? In fact, including it corrupts the file. Zip is weird.
		if ($centralDirectorySize > 0) {
			echo hex2bin('504b0505' // magic
				. '0000' // size of (signature) data
			);
		} */
		echo hex2bin('504b0506' // magic (EOCD)
			. '00000000' // some disk stuff
			. swapEndianness(leadingZeros(dechex(count($centralDirectory)), 4)) // entries in CD on disk
			. swapEndianness(leadingZeros(dechex(count($centralDirectory)), 4)) // total entries in CD
			. swapEndianness(leadingZeros(dechex($centralDirectorySize), 8)) // CD size
			. swapEndianness(leadingZeros(dechex($byteOffset), 8)) // offset of start of CD on disk
			. '0000' // comment length
		);
	}

	function calculateFilesize($files, $filenameLengths, $dataSize) {
		$fixedHeaderSize = 2+2+2+4+4+4+4+2+2;
		$localHeaderSize = 4+$fixedHeaderSize; // +filename length
		$centralDirectoryEntrySize = 4+2+$fixedHeaderSize+2+2+2+4+4; // +filename length
		$EOCDSize = 4+4+2+2+4+4+2;

		// $filenameLengths times two because they appear in both the local header and central directory entry
		return $files * $localHeaderSize + $files * $centralDirectoryEntrySize + $filenameLengths * 2 + $dataSize + $EOCDSize;
	}

	$centralDirectory = [];
	$byteOffset = 0;

