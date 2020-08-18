function sleep(s) {
     return new Promise((resolve, reject) => {
          setTimeout(() => {
               resolve(true)
          }, 1000 * s);
     })
}

module.exports = { sleep }