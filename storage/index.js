const fs = require('fs');

/* Saves data to name.json */
exports.save = (name, data) => 
    new Promise((fulfill, reject) => 
        fs.writeFile(`${__dirname}/${name}.json`, JSON.stringify(data),
            (err) => (err? reject(err) : fulfill())));

/* Loads data from name.json, if no such file, returns {} */
exports.load = (name) =>
    new Promise((fulfill, reject) =>
        fs.readFile(`${__dirname}/${name}.json`,
            (err, data) => (err? 
                (err.code === "ENOENT"? fulfill({}) :reject(err)) :
                 fulfill(JSON.parse(data)))));