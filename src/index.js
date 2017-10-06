const Level = require('native-level-promise');
const path = require('path');
const fs = require('fs');

class EnmapLevel {

  constructor(options) {
    this.defer = new Promise((resolve) => {
      this.ready = resolve;
    });

    this.features = {
      multiProcess: false,
      complexTypes: false,
      keys: 'single'
    }

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
   * @return {Promise} Returns the defer promise to await the ready state.
   */
  init(enmap) {
    const stream = this.db.keyStream();
    stream.on('data', (key) => {
      this.db.get(key, (err, value) => {
        if (err) console.log(err);
        let parsedValue = value;
        if (value[0] === '[' || value[0] === '{') {
          parsedValue = JSON.parse(value);
        }
        enmap.set(key, parsedValue);
      });
    });
    stream.on('end', () => {
      this.ready();
    });
    return this.defer;
  }

  /**
   * Internal method used to validate persistent enmap names (valid Windows filenames);
   */
  validateName() {
    this.name = this.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  /**
   * Shuts down the underlying persistent enmap database.
   */
  close() {
    this.db.close();
  }

  /**
   * 
   * @param {*} key Required. The key of the element to add to the EnMap object. 
   * If the EnMap is persistent this value MUST be a string or number.
   * @param {*} val Required. The value of the element to add to the EnMap object. 
   * If the EnMap is persistent this value MUST be stringifiable as JSON.
   */
  set(key, val) {
    if (!key || !['String', 'Number'].includes(key.constructor.name)) {
      throw new Error('Level require keys to be strings or numbers.');
    }
    const insert = typeof val === 'object' ? JSON.stringify(val) : val;
    this.db.put(key, insert);
  }

  /**
   * 
   * @param {*} key Required. The key of the element to add to the EnMap object. 
   * If the EnMap is persistent this value MUST be a string or number.
   * @param {*} val Required. The value of the element to add to the EnMap object. 
   * If the EnMap is persistent this value MUST be stringifiable as JSON.
   */
  async setAsync(key, val) {
    if (!key || !['String', 'Number'].includes(key.constructor.name)) {
      throw new Error('Level require keys to be strings or numbers.');
    }
    const insert = typeof val === 'object' ? JSON.stringify(val) : val;
    await this.db.put(key, insert);
  }

  /**
   * 
   * @param {*} key Required. The key of the element to delete from the EnMap object. 
   * @param {boolean} bulk Internal property used by the purge method.  
   */
  delete(key) {
    this.db.del(key);
  }

  /**
   * 
   * @param {*} key Required. The key of the element to delete from the EnMap object. 
   * @param {boolean} bulk Internal property used by the purge method.  
   */
  async deleteAsync(key) {
    await this.db.del(key);
  }

}

module.exports = EnmapLevel;
