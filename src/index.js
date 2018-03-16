const Level = require('level');
const path = require('path');
const fs = require('fs');

class EnmapLevel {

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

  fetch(key) {
    return this.db.get(key);
  }

  fetchEverything() {
    return new Promise((resolve) => {
      const stream = this.db.keyStream();
      stream.on('data', (key) => {
        this.db.get(key, (err, value) => {
          if (err) console.log(err);
          let parsedValue = value;
          if (value[0] === '[' || value[0] === '{') {
            parsedValue = JSON.parse(value);
          }
          this.enmap.set(key, parsedValue);
        });
      });
      stream.on('end', () =>
        resolve(this)
      );
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
      this.db.createKeyStream().pipe(this.bulkDeletedb.createDeleteStream()).on('end', resolve)
    );
  }

  /**
   * Internal method used to validate persistent enmap names (valid Windows filenames)
   * @private
   */
  validateName() {
    this.name = this.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

}

module.exports = EnmapLevel;
