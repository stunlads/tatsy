// Core Packages
const fs = require('fs');
const path = require('path');

// Depends
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const glob = require('glob');

// Official packages
const config = require('tat-config');
const logger = require('tat-logger');

const _decodeFile = (f) => {
  const file = fs.readFileSync(f, 'utf8');
  return file;
};

const _clearBaseDir = (callback) => {

  // remove old dir.
  rimraf.sync(config.buildDir);

  // new base dir
  return mkdirp(config.buildDir, () => {

    // save decode file
    if (config.saveFile) {
      return mkdirp(config.filesDir, callback);
    }

    return callback();
  });
};

const _getTemplate = (name) => {
  return path.resolve(__dirname, `../templates/${name}.js`);
};

module.exports = (isStarted, success) => {
  _clearBaseDir(() => {
    const globOptions = {};

    glob(config.morsDir, globOptions, (error, files) => {
      const lines = [];

      // Main Start Add
      lines.push(_decodeFile(_getTemplate('start')));

      // Show started log
      if (isStarted) {
        logger.started(files);
      }

      files.forEach((f) => {
        const name = path.basename(f);
        const content = _decodeFile(f);
        const buildFile = `${config.filesDir}/${name}`;
    
        // save decoding file
        if (config.saveFile) {
          fs.appendFileSync(buildFile, content, 'utf8');
        }
    
        // Show Build log
        if (isStarted) {
          logger.building(f, buildFile);
        }
    
        lines.push(content);
      });

      // Show Build log
      if (isStarted) {
        logger.enter();
      }

      // Main End Add
      lines.push(_decodeFile(_getTemplate('end')));

      // main file
      fs.appendFileSync(`${config.buildDir}/main.js`, lines.join('\n'), 'utf8');

      // success builder
      return success();
    });
  });
};