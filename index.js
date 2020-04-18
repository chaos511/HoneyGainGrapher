const config = require('config');
const https = require('https');
const fs = require('fs');
let {PythonShell} = require('python-shell')
const options = {
    hostname: 'dashboard.honeygain.com',
    port: 443,
    path: '/api/v1/devices',
    method: 'GET',
    headers: {
        'authorization': 'Bearer '+config.get("authToken")
    }
}
const debug=true;
function appendLog(logStr){
    console.log(logStr);
        fs.appendFile("latest.log", logStr+"\n", function(err) {
            if(err) {
                return console.log(err);
            }
        }); 
}
function getDevices(){
    console.log("getDevices")
    callback = function(response) {
        let str=''
        response.on('data', function (chunk) {
              str += chunk;
        });

        response.on('end', function () {
            if(response.statusCode==200){
                var jsonData=JSON.parse(str).data
                for(device in jsonData){
                    deviceData={
                        1:jsonData[device].id,
                        2:encodeURIComponent(jsonData[device].manufacturer),
                        3:encodeURIComponent(jsonData[device].model),
                        4:encodeURIComponent(jsonData[device].title),
                        5:encodeURIComponent(jsonData[device].platform),
                        6:encodeURIComponent(jsonData[device].version),
                        7:jsonData[device].stats.total_traffic,
                        8:jsonData[device].stats.total_credits,
                        9:Math.round(Date.now() / 1000),
                    };
                    fs.appendFile("data.json", JSON.stringify(deviceData)+",\n", function(err) {
                        if(err) {
                            return console.log(err);
                        }
                    }); 
                }
            }else{
                appendLog("HTTP Get Error: "+str)
            }
        });
    }

  var req = https.request(options, callback).end();

    req.on('error', error => {
        appendLog("HTTP Get "+error)
    });
}

// setInterval(getDevices,config.get("pingInterval")*1000)
// getDevices()

  PythonShell.run('HoneyGainDevicesDelta_plot.py', null, function (err, results) {
    if (err) 
      throw err;
    // Results is an array consisting of messages collected during execution
    console.log('results: %j', results);
  });