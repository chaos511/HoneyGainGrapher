const config = require('config');
const https = require('https');
const http = require('http');
const fs = require('fs');
let {PythonShell} = require('python-shell')
var path = require('path');

const server = http.createServer((req, res) => {
    fs.readFile("HoneyGainDevicesDelta_plot.html", function(error, content) {
        if (error) {
            if(error.code == 'ENOENT'){
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end("Error 404: File Not Found", 'utf-8');
            }
            else {
                res.writeHead(500);
                res.end('check with the site admin for error: '+error.code+' ..\n');
                res.end(); 
            }
        }
        else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
        }
    });
});
server.listen(config.get("webserverPort"),config.get("webserverHost"), (h,p) => {
    console.log("Server running at http://"+config.get("webserverHost")+":"+config.get("webserverPort")+"");
});

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
function genGraph(){
    if(debug){
        console.log("genGraph")
    }
    PythonShell.run('HoneyGainDevicesDelta_plot.py', null, function (err, results) {
      if (err) 
        throw err;
        if(debug){
            console.log('results: %j', results);
        }
    });
  }
function getDevices(){
    if(debug){
        console.log("getDevices")
    }
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
                genGraph()
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

 //setInterval(getDevices,config.get("pingInterval")*1000)
 //getDevices()
 genGraph()