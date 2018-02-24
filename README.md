# Enmap-Level

Enmap-Level is a provider for the [Enmap](https://www.npmjs.com/package/enmap) module. It enables the use of a persistent data structure using leveldb as a backend.

> Because of the underlying file-based database, enmap-level cannot be used simultaneously from multiple processes or apps. If you're making a Discord bot, this means enmap-level does not support sharded bots. If you need support for multiple processes or shards, consider using [Enmap-Rethink](https://www.npmjs.com/package/enmap-rethink)

## Installation

> `leveldb` on Windows requires C++ Build Tools and Python 2.7.x installed. If you don't have those, run `npm i -g --production windows-build-tools` before installing enmap-level!

To install enmap-level simply run `npm i enmap-level`.

## Usage

```js
// Load Enmap
const Enmap = require('enmap');
 
// Load EnmapLevel
const EnmapLevel = require('enmap-level');
 
// Initialize the leveldb with the name "test" (this is the folder name in ./data)
const level = new EnmapLevel({ name: 'test' });
 
// Initialize the Enmap with the provider instance.
const myColl = new Enmap({ provider: level });
```

Shorthand declaration: 

```js
const Enmap = require('enmap');
const EnmapLevel = require('enmap-level');
const myColl = new Enmap({ provider: new EnmapLevel({ name: 'test' }); });
```

> Enmap-Level will automatically create a data folder (default: `./data`) when loading, assuming it has permissions to do so.

## Options

```js
// Example with all options.
const level = new EnmapLevel({ 
  name: 'test',
  dataDir: './data',
});
```

### name

The `name` option is mandatory and defines the name of the table where the data is stored. 

### dataDir

The `dataDir` is optional and defines the folder path where data is stored (excluding the `name` attribute which becomes a subfolder). This folder can be a full valid absolute path, or relative to the current file's folder (the file where EnmapLevel is initialized). The default data directory is `./data`. An enmap with the name `test` and the default dataDir would create `./data/test/`.
