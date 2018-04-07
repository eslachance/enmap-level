const Level = require('level');
const path = require('path');
const fs = require('fs');

class EnmapProvider {

  constructor(options) {
    this.defer = new Promise((resolve) => {
      this.ready = resolve;
    });

    if (!options.name) throw new Error('Must provide options.name');
    this.name = options.name;

    this.validateName();
    this.dataDir = path.resolve(process.cwd(), options.dataDir || 'data');
    if (!options.dataDir) {
      if (!fs.existsSync('./data')) {
        fs.mkdirSync('./data');
      }
    }
    this.path = path.join(this.dataDir, this.name);
    this.db = new Level(this.path);
  }

  /**
   * Internal method called on persistent Enmaps to load data from the underlying database.
   * @param {Map} enmap In order to set data to the Enmap, one must be provided.
   * @returns {Promise} Returns the defer promise to await the ready state.
   */
  async init(enmap) {
    this.enmap = enmap;
    if (this.fetchAll) {
      await this.fetchEverything();
      this.ready();
    } else {
      this.ready();
    }
    return this.defer;
  }

  /**
   * Shuts down the underlying persistent enmap database.
   */
  close() {
    this.db.close();
  }

  /**
   * Force fetch one a value from the enmap. If the database has changed, that new value is used.
   * @param {string|number} key A single key to force fetch from the enmap database.
   * @return {Promise<*>} The value of the requested key in a promise.
   */
  fetch(key) {
    return this.db.get(key);
  }

  /**
   * Fetches every key from the persistent enmap and loads them into the current enmap value.
   * @return {Promise<Map>} The enmap containing all values.
   */
  fetchEverything() {
    return new Promise((resolve) => {
      this.db.createReadStream()
        .on('data', (data) => {
          let parsedValue = data.value;
          if (data.value[0] === '[' || data.value[0] === '{') {
            parsedValue = JSON.parse(data.value);
          }
          this.enmap.set(data.key, parsedValue);
        })
        .on('end', resolve);
    });
  }

  /**
   * Set a value to the Enmap.
   * @param {(string|number)} key Required. The key of the element to add to the EnMap object.
   * If the EnMap is persistent this value MUST be a string or number.
   * @param {*} val Required. The value of the element to add to the EnMap object.
   * If the EnMap is persistent this value MUST be stringifiable as JSON.
   * @return {Promise<*>} Promise returned by the database after insertion. 
   */
  set(key, val) {
    if (!key || !['String', 'Number'].includes(key.constructor.name)) {
      throw new Error('Level require keys to be strings or numbers.');
    }
    const insert = typeof val === 'object' ? JSON.stringify(val) : val;
    return this.db.put(key, insert);
  }


  /**
   * Delete an entry from the Enmap.
   * @param {(string|number)} key Required. The key of the element to delete from the EnMap object.
   * @param {boolean} bulk Internal property used by the purge method.
   * @return {Promise<*>} Promise returned by the database after deletion
   */
  delete(key) {
    return this.db.del(key);
  }

  hasAsync(key) {
    return this.db.get(key);
  }

  /**
   * Deletes all entries in the database.
   * @return {Promise<*>} Promise returned by the database after deletion
   */
  bulkDelete() {
    return new Promise(resolve =>
      this.db.createKeyStream().on('data', async key => await this.db.del(key)).on('end', resolve)
    );
  }

  /**
   * Internal method used to validate persistent enmap names (valid Windows filenames)
   * @private
   */
  validateName() {
    this.name = this.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  /**
   * Internal method used by Enmap to retrieve provider's correct version.
   * @return {string} Current version number.
   */
  getVersion() {
    return require('./package.json').version;
  }

}

module.exports = EnmapProvider;
