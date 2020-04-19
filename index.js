const config = require('config');
const https = require('https');
const http = require('http');
const fs = require('fs');
let {PythonShell} = require('python-shell')
var path = require('path');
var pageNum=1;
var numOfDevices=0;
const debug=true;
var count=0;
var timestamp=-1;
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
    var options={
        args:[config.get("graphTitle")]
    }
    PythonShell.run('HoneyGainDevicesDelta_plot.py', options, function (err, results) {
      if (err) 
        throw err;
        if(debug){
            console.log('results: %j', results);
        }
    });
  }
function getNumOfDevices(){
    timestamp=Math.round(Date.now() / 1000)
    devnum=-1
    var options = {
        hostname: 'dashboard.honeygain.com',
        port: 443,
        path: '/api/v1/users/me',
        method: 'GET',
        headers: {
            'authorization': 'Bearer '+config.get("authToken")
        }
    }
    if(debug){
        console.log("get Total Devices")
        console.log("URL: "+options.path)
    }
    callback = function(response) {
        let str=''
        response.on('data', function (chunk) {
              str += chunk;
        });

        response.on('end', function () {
            if(response.statusCode==200){
                var jsonData=JSON.parse(str).data;
                numOfDevices=jsonData.total_devices;
                if(count==0){
                    console.log("Total Devices: "+numOfDevices)
                }
                getDevices()
            }else{
                appendLog("HTTP Get Error: "+str);
            }
        });
    }

  var req = https.request(options, callback).end();

    req.on('error', error => {
        appendLog("HTTP Get "+error)
    });
    return devnum
}

function getDevices(){

    var options = {
        hostname: 'dashboard.honeygain.com',
        port: 443,
        path: '/api/v1/devices'+(pageNum==1?'':'?page='+pageNum),
        method: 'GET',
        headers: {
            'authorization': 'Bearer '+config.get("authToken")
        }
    }
    if(debug){
        console.log("get Devices Page: "+pageNum)
        console.log("URL: "+options.path)
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
                        2:encodeURI(jsonData[device].manufacturer),
                        3:encodeURI(jsonData[device].model),
                        4:encodeURI(jsonData[device].title),
                        5:encodeURI(jsonData[device].platform),
                        6:encodeURI(jsonData[device].version),
                        7:jsonData[device].stats.total_traffic,
                        8:jsonData[device].stats.total_credits,
                        9:timestamp,
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
            if(pageNum<numOfDevices/10){
                console.log("Pagenum: "+pageNum)
                pageNum++;
                getDevices();
            }else{
                genGraph();
            }
        });
    }

  var req = https.request(options, callback).end();

    req.on('error', error => {
        appendLog("HTTP Get "+error)
        if(pageNum<numOfDevices/10){
            pageNum++;
            getDevices();
        }else{
            genGraph();
        }
    });
}
 setInterval(getNumOfDevices,config.get("pingInterval")*1000)
 getNumOfDevices()
//genGraph();