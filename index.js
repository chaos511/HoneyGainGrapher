const config = require('config');
const https = require('https');
const http = require('http');
const fs = require('fs');
const url = require('url');
let {PythonShell} = require('python-shell')
var path = require('path');
var numOfDevices=0;
const debug=true;
var count=0;
var timestamp=-1;

const server = http.createServer(async (req, res) => {
    var ip = req.headers['x-forwarded-for'] ||      req.connection.remoteAddress ||      req.socket.remoteAddress ||     (req.connection.socket ? req.connection.socket.remoteAddress : null);
    appendLog("http req: "+req.url+" From Ip address: "+ip)
    var filePath = './www' + decodeURI(req.url);
    if(filePath.includes("dashboard")&&!getConfig("enableDashboard")){
        filePath="./www/"
    }
    if (filePath == './www/'){
        filePath = getConfig("enableDashboard")?'./www/dashboard.html':'./www/HoneyGainDevicesDelta_plot.html';
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
    if(filePath.split('?')[0]=="./www/dashboard/getdata"){
        var url_parts = url.parse(req.url, true);
        var query = url_parts.query;
        var responseText="{Error:No action Defined}"
        if(query!=undefined&&query.action!=undefined){
            switch(query.action){
                case "getbalance":
                    var x = await sendRequest("/api/v1/users/balances");
                    responseText='{"req":'+x+',"echo":"'+query.echo+'"}'
                break;
                case "getdevicebalance":
                    content=await wsReadFile("data.json")
                    jsonData=JSON.parse('{"dataFile":['+content.slice(0,-2)+']}')
                    var retBal={}
                    for (x in jsonData.dataFile){
                        var date=jsonData.dataFile[x]['9']
                        var id=jsonData.dataFile[x]['1']
                        var credits=jsonData.dataFile[x]['8']
                        if(query.time!="now"&&query.starttime!=undefined&&date>query.starttime){
                            if(retBal[id]==undefined){
                                retBal[id]=credits
                            }
                        }
                        if(query.time!="now"&&query.endtime!=undefined&&date<query.endtime){
                            retBal[id]={"credits":credits}
                        }
                        if(query.time=="now"){
                            if(retBal[id]!=undefined){
                                if(credits>retBal[id].credits){
                                    retBal[id]={"credits":credits,"lastEarning":date}
                                }
                            }else{
                                retBal[id]={"credits":credits,"lastEarning":date}
                            }
                        }
                    }
                    responseText='{"balance":'+JSON.stringify(retBal)+',"time":"'+(query.starttime||query.endtime)+'","echo":"'+query.echo+'"}'
                break;
                case "getstarttime":
                    content=await wsReadFile("data.json")
                    jsonData=JSON.parse('{"dataFile":['+content.slice(0,-2)+']}')
                    var retTime=(new Date()).getTime()/1000
                    for (x in jsonData.dataFile){
                        retTime=Math.min(retTime,jsonData.dataFile[x]['9'])                                    
                    }
                    responseText='{"time":"'+retTime+'","echo":"'+query.echo+'"}'
                break;
                case "getdata":
                    content=await wsReadFile("data.json")
                    responseText='{"dataFile":['+content.slice(0,-2)+'],"echo":"'+query.echo+'"}'
                break;
                case "getidmap":
                    content=await wsReadFile("idmap.json")
                    responseText='{"idmap":'+content+',"echo":"'+query.echo+'"}'
                break;
                case "gettransactions":
                    getTransactions(1)
                    try{
                        transactionsArray=JSON.parse(await ReadFile('transactions.json','[]'))
                    }catch{
                        console.log('Cannot Parse File: transactions.json')
                    }                       
                    var retData=[]
                    for (var transaction of transactionsArray){
                        var transactionDate=(new Date(transaction.created_at)).getTime()
                        if(transactionDate>query.starttime&&transactionDate<query.endtime){
                            retData.push(transaction)
                        }
                    }
                    responseText='{"transactions":'+JSON.stringify(retData)+',"echo":"'+query.echo+'"}'
                break;
            }
        }
        res.writeHead(200, { 'Content-Type': 'application/json'});
        res.end(responseText, 'utf-8');
    }else{
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
    }
});
server.listen(getConfig("webserverPort"),getConfig("webserverHost"), (h,p) => {
    console.log("Server running at http://"+getConfig("webserverHost")+":"+getConfig("webserverPort")+"");
});

function wsReadFile(fPath){
    return new Promise(resolve => {
        fs.readFile(fPath, function(error, content) {
            if (error) {
                if(error.code == 'ENOENT'){
                    connection.sendUTF("Error 404: File "+fPath+" Not Found");
                    appendLog("Error 404: File "+fPath+" Not Found")
                }
                resolve(undefined)
            }
            else {
                resolve(content)
            }
        });
    })
}
function ReadFile(fPath,onFail){
    return new Promise(resolve => {
        fs.readFile(fPath, function(error, content) {
            if (error) {
                if(error.code == 'ENOENT'){
                    appendLog("Error 404: File "+fPath+" Not Found")
                }
                resolve(onFail)
            }
            else {
                resolve(content)
            }
        });
    })
}
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
            appendLog('results: '+results);
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
function getConfig(keyName){
    var value;
    try{
        value=config.get(keyName)
    }catch(e){
        var defaultConfig=
        {
            "authToken":"<Insert Your Bearer Token>",
            "pingInterval":3600,
            "startOnTheHour":true,
            "graphTitle":"Honey Gain Devices Delta",
            "enableDashboard":true,
            "enableGraph":true,
            "useHTTPAuth":false,
            "webserverPort":80,
            "webserverHost":"127.0.0.1"
        }
        if(defaultConfig[keyName]==undefined){
            Error(e);
        }else{
            value=defaultConfig[keyName];
            appendLog("Key: "+keyName+" Not found in config using default value: "+value);
        }
    }
    return value
}
async function getNumOfDevices(){
    timestamp=Math.round(Date.now() / 1000)
    var x= await sendRequest('/api/v1/users/me');
    var jsonData=JSON.parse(x).data;
    numOfDevices=jsonData.total_devices;
    if(count==0){
        appendLog("Total Devices: "+numOfDevices)
    }
   
}
async function getDevices(pageNum){
    var res=await sendRequest('/api/v1/devices'+(pageNum==1?'':'?page='+pageNum))
    var jsonData=JSON.parse(res).data
    var idMap
    try{
        idMap=JSON.parse(await ReadFile("idmap.json","{}"))
    }catch{

    }
    if(idMap==undefined){
        idMap={}
        appendLog("idmap.json could not be parsed")
    }
    for(var device in jsonData){
        if(idMap[jsonData[device].id]==undefined||idMap[jsonData[device].id].title!=encodeURI(jsonData[device].title)){
            var idmapData={
                id:jsonData[device].id,
                manufacturer:encodeURI(jsonData[device].manufacturer),
                model:encodeURI(jsonData[device].model),
                title:encodeURI(jsonData[device].title),
                platform:encodeURI(jsonData[device].platform),
                version:encodeURI(jsonData[device].version),
            }
            if(debug){
                appendLog("device not found or changed adding: "+JSON.stringify(idmapData))
            }
            idMap[jsonData[device].id]=idmapData
        }
        var deviceData={
            1:jsonData[device].id,
            // 2:encodeURI(jsonData[device].manufacturer),
            // 3:encodeURI(jsonData[device].model),
            // 4:encodeURI(jsonData[device].title),
            // 5:encodeURI(jsonData[device].platform),
            // 6:encodeURI(jsonData[device].version),
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
    fs.writeFile("idmap.json", JSON.stringify(idMap), function(err) {
        if(err) {
            return console.log(err);
        }
    }); 
    if(pageNum<numOfDevices/10){
        console.log("Pagenum: "+pageNum)
        pageNum++;
      getDevices(pageNum+1);
    }else if (getConfig("enableGraph")){
        genGraph();
    }
}
var splitTransactionArray
async function getTransactions(pageNum,inArray){
    var res=await sendRequest('https://dashboard.honeygain.com/api/v1/transactions?page='+pageNum)
    var resJson=JSON.parse(res)
    var resArray=resJson.data
    var totalPages=resJson.meta.pagination.total_pages
    var totalItems=resJson.meta.pagination.total_items
    var transactionsArray=[]
    if(pageNum==1){
        splitTransactionArray=false
        try{
            transactionsArray=JSON.parse(await ReadFile('transactions.json','[]'))
        }catch{
            console.log('Cannot Parse File: transactions.json')
        }
    }else{
        transactionsArray=inArray
    }
    if(totalItems==transactionsArray.length){
        if(debug){
            console.log("totalItems length match not updating transactions")
        }
        return
    }
    if(totalItems<transactionsArray.length&&pageNum==1){
        if(debug){
            console.log("totalItems length to high resetting transactions")
        }
        transactionsArray=[]
    }
    resArray.reverse()
    var index=0
    for(var newData of resArray){
        var found=-1
        for(var aIndex in transactionsArray){
            if(transactionsArray[aIndex].id==newData.id){
                found=aIndex
            }
        }
        if(found==-1&&index==0){
            if(pageNum<totalPages){
                transactionsArray=await getTransactions(pageNum+1,transactionsArray)
            }
        }
        if(!splitTransactionArray){
            if(found>-1){
                splitTransactionArray=true
                transactionsArray.splice(found)
            }else if(pageNum>=totalPages){
                splitTransactionArray=true
                transactionsArray=[]
            }
        }
        transactionsArray.push(newData)
        index++
    }

    if(pageNum==1){
        var outString='[\n'
        for(var x of transactionsArray){
            outString+=JSON.stringify(x)+',\n'
        }
        outString=outString.substr(0,outString.length-2)
        outString+='\n]'
        fs.writeFile("transactions.json", outString, function(err) {
            if(err) {
                return console.log(err);
            }
        }); 
    }else{
        return transactionsArray
    }
}

function main(){
    getNumOfDevices()
    getDevices(1)
    getTransactions(1)
}
function init(){
    setInterval(main,getConfig("pingInterval")*1000) 
    main()
}
var passedIntervals=parseInt(((new Date).getMinutes()*60+(new Date).getSeconds())/getConfig("pingInterval"))
var nextIntervalTime=(passedIntervals+1)*getConfig("pingInterval")
var secondsToNextInterval=nextIntervalTime-((new Date).getMinutes()*60+(new Date).getSeconds())
setTimeout(init,secondsToNextInterval*1000)
// main()
getTransactions(1)
