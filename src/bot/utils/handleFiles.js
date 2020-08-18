const fs = require('fs');

function readJsonFile(path){
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err,data) =>{
            if(err) reject(err)
            resolve(JSON.parse(data));
        })
    });
}

function writeJsonFile(path,data){
    return new Promise((resolve, reject) => {
        let parseToJson = JSON.stringify(data)
        fs.writeFile(path, parseToJson, () =>{
            resolve(true)
        });
        
    });  
}

function writeCsvFile(path,data){
    return new Promise((resolve,reject) =>{
        fs.writeFile(path, data, () => {
            resolve(true)
        }) 
    })
}

module.exports = { readJsonFile, writeJsonFile, writeCsvFile };