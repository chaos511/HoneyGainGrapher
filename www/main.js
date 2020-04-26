
var idmap={}
var userDevices={}
var userData={}
const socket=new WebSocket("ws://"+document.location.host,"echo-protocol")
var sevenday=7*24*60*60
var last7Total=0
var balUSD
var sidebarWidth=0
var last7initial={}
var deviceBalance={}
var deviceOverviewInitial

for(var x=0;x<2;x++){
    startDate[x].max=unixToYYYYMMDD((new Date().getTime()))
    startDate[x].value=unixToYYYYMMDD((new Date()).getTime()-sevenday*1000)
}
socket.addEventListener('error', function (event) {
    alert("Websocet Error")
    console.log(event)
});
socket.addEventListener('open', function (event) {
    socket.send('{"action":"getbalance","echo":"balance"}');
    socket.send('{"action":"getstarttime","echo":"starttime"}');
    socket.send('{"action":"getidmap","echo":"idmap"}');
    
});
socket.addEventListener('message', function (event) {
    jsondata=JSON.parse(event.data)
    if(jsondata.echo=="balance"){
         if(jsondata.req.data.payout!=undefined&&jsondata.req.data.payout.credits!=undefined){
            currentBalance.innerText=jsondata.req.data.payout.credits
            currentBalanceGB.innerText=(jsondata.req.data.payout.credits/100).toFixed(2)
         }
         if(jsondata.req.data.payout!=undefined&&jsondata.req.data.payout.usd_cents!=undefined){
            currentBalanceUSD.innerText=jsondata.req.data.payout.usd_cents/100
            balUSD=jsondata.req.data.payout.usd_cents/100
            calcNextPayout()
         }
    }
    if(jsondata.echo=="sevenday"){
        last7initial=jsondata.balance
        socket.send('{"action":"getdevicebalance","time":"now","echo":"now"}');
    }
    if(jsondata.echo=="now"){
        deviceBalance=jsondata.balance
        for (x in last7initial){
            last7Total+=deviceBalance[x].credits-last7initial[x]
            last7Balance.innerText      =last7Total.toFixed(2)
            last7BalanceUSD.innerText   =(last7Total/1000).toFixed(2)
            last7BalanceGB.innerText    =(last7Total/100).toFixed(2)
            last7Rate.innerText         =((last7Total/1000)/7).toFixed(2)
        }
        calcNextPayout()
    }
    if(jsondata.echo=="deviceoverview"){
        deviceOverviewInitial=jsondata.balance
        updateTables()
    }
    if(jsondata.echo=="starttime"){
        startDate[0].min=unixToYYYYMMDD(jsondata.time*1000)
        startDate[1].min=unixToYYYYMMDD(jsondata.time*1000)
    }
    if(jsondata.echo=="idmap"){
        idmap=jsondata.idmap
        socket.send('{"action":"getdevicebalance","time":'+((new Date()).getTime()/1000-sevenday)+',"echo":"sevenday"}');
    }
    console.log('message: ', jsondata);
});
function updateTables(){
    userDevices={}
    userData={}
    var hgactiveDevicesNum=0
    var activeDevicesNum=0
    var earningDevicesNum=0
    var earningsTotal=0
    var len=deviceoverviewTable.rows.length-1
    var len2=useroverviewTable.rows.length-1
    for(var x=0;x<len;x++){
        deviceoverviewTable.deleteRow(1);
    }
    for(var x=0;x<len2;x++){
        useroverviewTable.deleteRow(1);
        console.log(useroverviewTable.rows.length+" -- "+len)
    }
    for (x in deviceOverviewInitial){
        var earningDevice=false
        hgactiveDevicesNum++
        last7Total+=deviceBalance[x].credits-deviceOverviewInitial[x]
        if(deviceBalance[x].credits!=deviceOverviewInitial[x]){
            earningsTotal+=deviceBalance[x].credits-deviceOverviewInitial[x]
            earningDevicesNum++
            earningDevice=true
        }
        var row=deviceoverviewTable.insertRow(1)
        var user=row.insertCell(0)
        var device=row.insertCell(1)
        var creditsEarned=row.insertCell(2)
        var totalCredits=row.insertCell(3)
        var lastEarning=row.insertCell(4)
        var username=x
        if(idmap[x]==undefined){
            username=x
        }else{
            username=decodeURI(idmap[x].title)
        }
        var tSplit=username.split('*')
        if(tSplit[0].charAt(0)=='#'&&tSplit.length==3){
            username=tSplit[0].substr(1)
            device.innerText=tSplit[1]
            if(userDevices[tSplit[0].substr(1)]==undefined){
                userDevices[tSplit[0].substr(1)]=[]
                userData[username]={
                    deviceCount:0,
                    earningDeviceCount:0,
                    creditsEarned:0,
                    totalCredits:0,
                }
            }
            userData[tSplit[0].substr(1)].deviceCount++
            userData[tSplit[0].substr(1)].earningDeviceCount+=earningDevice?1:0
            userData[tSplit[0].substr(1)].creditsEarned=(deviceBalance[x].credits-deviceOverviewInitial[x])+parseFloat(userData[tSplit[0].substr(1)].creditsEarned)
            userData[username].totalCredits+=deviceBalance[x].credits
            userDevices[username].push({
                id:x,
                device:tSplit[1],
                creditsEarned:(deviceBalance[x]-deviceOverviewInitial[x]).toFixed(2),
                totalCredits:deviceBalance[x],
            })
        }
        user.innerText=username
        creditsEarned.innerText=(deviceBalance[x].credits-deviceOverviewInitial[x]).toFixed(2)
        if(deviceDisplayMode.selectedIndex==3&&(deviceBalance[x].credits-deviceOverviewInitial[x]).toFixed(2)==0){
            row.style="display:none;"
        }
        totalCredits.innerText=deviceBalance[x].credits
        lastEarning.innerText=(((new Date()).getTime()/1000-deviceBalance[x].lastEarning)/3600).toFixed(1)
        if((((new Date()).getTime()/1000-deviceBalance[x].lastEarning)/3600).toFixed(1)>=24){
            if(deviceDisplayMode.selectedIndex==1){
                row.style="display:none;"
            }
            lastEarning.style="background-color: #ff0000;"
        }else{
            if(deviceDisplayMode.selectedIndex==2){
                row.style="display:none;"
            }
            activeDevicesNum++;
        }
    }
    earningPerDevice.innerText=(earningsTotal/earningDevicesNum/1000).toFixed(3)
    hgactiveDevices.innerText=hgactiveDevicesNum
    activeDevices.innerText=activeDevicesNum
    earningDevices.innerText=earningDevicesNum
    var earningUserNum=0
    var activeUsersNum=0
    for(x in userData){
        activeUsersNum++
        var row=useroverviewTable.insertRow(1)
        row.insertCell(0).innerText=x
        row.insertCell(1).innerText=userData[x].deviceCount
        row.insertCell(2).innerText=userData[x].earningDeviceCount
        earningUserNum+=userData[x].earningDeviceCount>0?1:0
        row.insertCell(3).innerText=userData[x].creditsEarned.toFixed(2)
        row.insertCell(4).innerText=userData[x].totalCredits.toFixed(2)
    }
    activeUsers.innerText=activeUsersNum
    earningUsers.innerText=earningUserNum
    earningPerUser.innerText=(earningsTotal/earningUserNum/1000).toFixed(3)
    sortTable(deviceoverviewTable,2,true,'Credits Gained',deviceCreditsGained)
    sortTable(useroverviewTable,3,true,'Credits Gained',userCreditsGained)
}
function calcNextPayout(){
    if(balUSD>0&&last7Total>0){
        nextPayout.innerText=Math.max(((7/(last7Total/1000))*(20-balUSD)).toFixed(2),0)
        startDate[0].onchange()
    }
}

window.onhashchange=function(){
    switch(document.location.hash.replace('#','')){
        case "overview":
            closeSidebar();
            overviewPage.style.visibility="visible"
            graphPage.style.visibility="hidden"
            devicesPage.style.visibility="hidden"
            usersPage.style.visibility="hidden"
            pagelable.innerText="Overview"
        break;
        case "sidebar":
            openSidebar();
        break;        
        case "devices":
            closeSidebar();
            overviewPage.style.visibility="hidden"
            graphPage.style.visibility="hidden"
            devicesPage.style.visibility="visible"
            usersPage.style.visibility="hidden"
            pagelable.innerText="Devices"
        break;
        case "graph":
            closeSidebar();
            overviewPage.style.visibility="hidden"
            graphPage.style.visibility="visible"
            devicesPage.style.visibility="hidden"
            usersPage.style.visibility="hidden"
            pagelable.innerText="Graph"
        break;
        case "users":
            closeSidebar();
            overviewPage.style.visibility="hidden"
            graphPage.style.visibility="hidden"
            devicesPage.style.visibility="hidden"
            usersPage.style.visibility="visible"
            pagelable.innerText="Graph"
        break;
        default:
            document.location.hash="overview"
        break;
    }
}
function onDateChange(sdate){
    startDate[0].value=sdate
    startDate[1].value=sdate
    socket.send('{"action":"getdevicebalance","time":'+(new Date(sdate)).getTime()/1000+',"echo":"deviceoverview"}');
    activeDevices.innerText="Loaging..."
    earningDevices.innerText="Loaging..."
    console.log("onchange")
}
window.onhashchange()