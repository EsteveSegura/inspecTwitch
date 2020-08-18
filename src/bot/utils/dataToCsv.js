
function convertViewsToCSV(viewsJson){
     let headers = ["time","totalViews","realViews","fakeViews"]
     let headerString = headers.toString()
     let bodyString = headerString + "\n"
     let time = []

     for(let i = 0 ; i < viewsJson.length; i++){
          if(i == 0){
               time.push(0)
          }
          time.push(time[time.length-1] + 5)
          bodyString = `${bodyString}${time[i]},${viewsJson[i].browserViews},${viewsJson[i].apiViews},${Math.abs(viewsJson[i].browserViews - viewsJson[i].apiViews)}\n`
     }

     return bodyString
}


module.exports = { convertViewsToCSV }