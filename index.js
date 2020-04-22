const config = require('config');
const https = require('https');
const http = require('http');
const fs = require('fs');
let {PythonShell} = require('python-shell')
var path = require('path');
const WebSocketServer = require('websocket').server;
var pageNum=1;
var numOfDevices=0;
const debug=true;
var count=0;
var timestamp=-1;

const server = http.createServer((req, res) => {
    var ip = req.headers['x-forwarded-for'] ||      req.connection.remoteAddress ||      req.socket.remoteAddress ||     (req.connection.socket ? req.connection.socket.remoteAddress : null);
    appendLog("http req: "+req.url+" From Ip address: "+ip)
    var filePath = './www' + decodeURI(req.url);
    if(filePath.includes("dashboard")&&!getConfig("enableDashboard")){
        filePath="./www/"
    }
    if (filePath == './www/'){
        filePath = './www/HoneyGainDevicesDelta_plot.html';
    }
    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;      
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.wav':
            contentType = 'audio/wav';
            break;
    }
    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT'){
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end("Error 404: File "+filePath+" Not Found", 'utf-8');
            }
            else {
                res.writeHead(500);
                res.end('check with the site admin for error: '+error.code+' ..\n');
                res.end(); 
            }
        }
        else {
            res.writeHead(200, { 'Content-Type': contentType});
            res.end(content, 'utf-8');
        }
    });
});
server.listen(getConfig("webserverPort"),getConfig("webserverHost"), (h,p) => {
    console.log("Server running at http://"+getConfig("webserverHost")+":"+getConfig("webserverPort")+"");
});

wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});
wsServer.on('request', function(request) {
    var connection = request.accept('echo-protocol', request.origin);
    if(debug){
        appendLog((new Date()) + ' Connection accepted.');
    }
    connection.on('message', async function(message) {
        if (message.type === 'utf8') {
            if(debug){
                appendLog('Received Message: ' +message.utf8Data);
            }
            var jsonMessage=JSON.parse(message.utf8Data)
            if(jsonMessage.action!=undefined){
                switch(jsonMessage.action){
                    case "getbalance":
                        var x = await sendRequest("/api/v1/users/balances");
                        connection.sendUTF(x)
                    break;
                    case "getdata":
                        fs.readFile("data.json", function(error, content) {
                            if (error) {
                                if(error.code == 'ENOENT'){
                                    connection.sendUTF("Error 404: File "+filePath+" Not Found");
                                }
                            }
                            else {
                                connection.sendUTF("{\"dataFile\":["+content.slice(0,-2)+"]}");
                            }
                        });
                    break;
                }
            }
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
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
        appendLog("genGraph")
    }
    var options={
        args:[getConfig("graphTitle")]
    }
    PythonShell.run('HoneyGainDevicesDelta_plot.py', options, function (err, results) {
      if (err) 
        throw err;
        if(debug){
            appendLog('results: %j', results);
        }
    });
  }

function sendRequest(url){
    return new Promise(resolve => {
        var options = {
            hostname: 'dashboard.honeygain.com',
            port: 443,
            path: url,
            method: 'GET',
            headers: {
                'authorization': 'Bearer '+getConfig("authToken")
            }
        }
        if(debug){
            appendLog("sendRequest")
            appendLog("URL: "+options.path)
        }
        callback = function(response) {
            let str=''
            response.on('data', function (chunk) {
                str += chunk;
            });

            response.on('end', function () {
                if(response.statusCode==200){
                    resolve(str)
                }else{
                    appendLog("HTTP Get Error: "+str);
                }
            });
        }

        var req = https.request(options, callback).end();
        req.on('error', error => {
            appendLog("HTTP Get "+error)
        });
    });
}

async function getNumOfDevices(){
    timestamp=Math.round(Date.now() / 1000)
    devnum=-1
    pageNum=1;
    var x= await sendRequest('/api/v1/users/me');
    var jsonData=JSON.parse(x).data;
    numOfDevices=jsonData.total_devices;
    if(count==0){
        appendLog("Total Devices: "+numOfDevices)
    }
   
}
async function getDevices(){
    var x=await sendRequest('/api/v1/devices'+(pageNum==1?'':'?page='+pageNum))
    var jsonData=JSON.parse(x).data
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
    if(pageNum<numOfDevices/10){
        console.log("Pagenum: "+pageNum)
        pageNum++;
      getDevices();
    }else{
        genGraph();
    }
}
function main(){
    getNumOfDevices()
    getDevices()
}
function init(){
    setInterval(main,getConfig("pingInterval")*1000)
    getNumOfDevices()
}
function getConfig(keyname){
    var value;
    try{
        value=config.get(keyname)
    }catch(e){
        var defaultConfig={
        "authToken":"<Insert Your Bearer Token>",
        "pingInterval":3600,
        "startOnTheHour":true,
        "graphTitle":"Honey Gain Devices Delta",
        "enableDashboard":true,
        "useHTTPAuth":false,
        "webserverPort":80,
        "webserverHost":"127.0.0.1",
        "autoUpdate":true
        }
        if(defaultConfig[keyname]==undefined){
            Error(e);
        }else{
            value=defaultConfig[keyname];
            appendLog("Key: "+keyname+"Not found in config using default value: "+value);
        }

    }
    return value
}
var passedIntervals=parseInt(((new Date).getMinutes()*60+(new Date).getSeconds())/getConfig("pingInterval"))
var nextIntervalTime=(passedIntervals+1)*getConfig("pingInterval")
var secondsToNextInterval=nextIntervalTime-((new Date).getMinutes()*60+(new Date).getSeconds())
setTimeout(init,secondsToNextInterval*1000)
main()
