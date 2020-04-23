const fs = require('fs');

function wsReadFile(fpath){
    return new Promise(resolve => {
        fs.readFile(fpath, function(error, content) {
            if (error) {
                console.log("Error 404: File "+fpath+" Not Found");
                resolve("{}")
            }
            else {
                resolve(content)
            }
        });
    })
}
async function main(){
    var content=await wsReadFile("data.json")
    jsonData=JSON.parse('['+content.slice(0,-2)+']')
    var dataBuffer=""
    var idmap
    try{
        idmap=JSON.parse(await wsReadFile("idmap.json","{}"))
    }catch{

    }
    if(idmap==undefined){
        idmap={}
    }
    for(device in jsonData){
        if(idmap[jsonData[device]['1']]==undefined||idmap[jsonData[device]['1']].title!=(jsonData[device]['4'])){
            idmapData={
                id:jsonData[device]['1'],
                manufacturer:(jsonData[device]['2']),
                model:(jsonData[device]['3']),
                title:(jsonData[device]['4']),
                platform:(jsonData[device]['5']),
                version:(jsonData[device]['6']),
            }
                console.log("device not found or changed adding: "+JSON.stringify(idmapData))
            
            idmap[jsonData[device]['1']]=idmapData
        }
        deviceData={
            1:jsonData[device]['1'],
            // 2:encodeURI(jsonData[device].['2']),
            // 3:encodeURI(jsonData[device].['3']),
            // 4:encodeURI(jsonData[device].['4']),
            // 5:encodeURI(jsonData[device].['5']),
            // 6:encodeURI(jsonData[device].['6']),
            7:jsonData[device]['7'],
            8:jsonData[device]['8'],
            9:jsonData[device]['9'],
        };

        dataBuffer+=JSON.stringify(deviceData)+",\n"
    }

    fs.writeFile("data.json", dataBuffer, function(err) {
        if(err) {
            return console.log(err);
        }
    }); 
    fs.writeFile("idmap.json", JSON.stringify(idmap), function(err) {
        if(err) {
            return console.log(err);
        }
    }); 
}
main()