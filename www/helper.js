function unixToYYYYMMDD(unixtime){
    var date = new Date(unixtime);
    var dd = date.getDate();
    var mm=date.getMonth()+1
    if(dd<10){dd='0'+dd} 
    if(mm<10){mm='0'+mm} 
    return date.getFullYear()+'-'+mm+'-'+dd;
}

function exportToCsv(table){
    var rows=Array.from(table.querySelectorAll("tr"))
    var longest= findLongestRowLength(rows)
    var lines=[]
    var linesString;
    for(row of rows){
        var line=""
        for(var x=0;x<longest;x++){
            if(row.children[x]!=undefined){
                line+=parseCell(row.children[x])
            }
            line+=(x!=longest-1)?",":""
        }
        lines.push(line)
    }
    linesString=lines.join('\n')
    var csvBlob=new Blob([linesString],{type:'text/csv'})
    var blocUrl =URL.createObjectURL(csvBlob)
    console.log(blocUrl)
    var aElement=document.createElement('a')
    aElement.href=blocUrl
    aElement.download=table.id+'.csv'
    aElement.click()
    setTimeout(()=>{
        URL.revokeObjectURL(blocUrl)
    },500)
    }
    function findLongestRowLength(rows){
    var retNum=0
    for(x in rows){
        retNum=Math.max(rows[x].childElementCount,retNum)
    }
    return retNum
    }
    function parseCell(cell){
    var parsedValue=cell.textContent
    parsedValue=parsedValue.replace(/"/g,'""')
    parsedValue=/[",\n"]/.test(parsedValue)?`"${parsedValue}"`:parsedValue
    return parsedValue
    }
    

function closeSidebar(){
    if(sidebarWidth>0){
        sidebarWidth-=5
        menuSidebar.style.width=sidebarWidth+"px"
        setTimeout(closeSidebar,1)
        let pages = document.querySelectorAll(".page");
        for (let i = 0; i < pages.length; i++) {
            pages[i].style.opacity = 1-(sidebarWidth/300);
        }
    }
    menuSidebar.style.visibility=sidebarWidth>0?"visible":"hidden"
}
function openSidebar(){
    if(sidebarWidth<150){
        sidebarWidth+=5
        menuSidebar.style.width=sidebarWidth+"px"
        setTimeout(openSidebar,1)
        let pages = document.querySelectorAll(".page");
        for (let i = 0; i < pages.length; i++) {
            pages[i].style.opacity = 1-(sidebarWidth/300);
        }
    }
    menuSidebar.style.visibility=sidebarWidth>0?"visible":"hidden"
}



var lastElement={}
var lastBaseName={}
var inverSort={"deviceoverviewTable":false,"useroverviewTable":false}
var table, rows, sorting, i, x, y, shouldSwitch,sortIndex,isnumber,sortLoopInterval;

function sortTable(table,sortIndex,isnumber,baseName,element) {  
    if(sorting){
        alert()
    }else{
        try{
            lastElement[table.id].innerHTML=lastBaseName[table.id]
        }catch (ignored) {}
        if(lastElement[table.id]==element){
            inverSort[table.id]=!inverSort[table.id]
        }
        lastElement[table.id]=element
        lastBaseName[table.id]=baseName

        element.innerHTML=baseName+(inverSort[table.id]?"\u25b2":"\u25bc")

        sorting = true;
        this.table=table
        this.sortIndex=sortIndex
        this.isnumber=isnumber
        while(sorting){
        //sortLoopInterval=setInterval(sortLoop,0)
        sortLoop()
        }
    }
}
function sortLoop(){
    rows = table.rows;
    for (i = 1; i < (rows.length - 1); i++) {
        shouldSwitch = false;
        x = rows[i].getElementsByTagName("TD")[sortIndex].innerHTML;
        y = rows[i + 1].getElementsByTagName("TD")[sortIndex].innerHTML;
        var xPrefix
        var yPrefix
        if(x.includes("$")){
            x=x.substr(1)
        }
        if(y.includes("$")){
            y=y.substr(1)
        }
        if(isnumber){
            if ((parseFloat(x) < parseFloat(y)&&!inverSort[table.id])||(parseFloat(x) > parseFloat(y)&&inverSort[table.id])) {
                shouldSwitch = true;
                break;
            }
        }else{
            if ((x.toLowerCase() < y.toLowerCase()&&inverSort[table.id])||(x.toLowerCase() > y.toLowerCase()&&!inverSort[table.id])) {
                shouldSwitch = true;
                break;
            }
        }
    }
    if (shouldSwitch) {
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
    }else{
        // clearInterval(sortLoopInterval)
        sorting=false
    }
}