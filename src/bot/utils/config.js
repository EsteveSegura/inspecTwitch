const fs = require('fs');
const path = require('path')

function readCfg(){
    let d = fs.readFileSync(path.join(__dirname, '../config.json'),'utf8')
    return JSON.parse(d)
}

module.exports = { readCfg }