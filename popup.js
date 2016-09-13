chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    if(!(tabs.length>0&&tabs[0].url.indexOf("http://t66y.com/thread")===0)){
        $("#download").hide();
    }
});

$("#download").click(function(){
    port.postMessage({action:"doDownload"});
});

var port = chrome.extension.connect({name: "popup"});
port.onMessage.addListener(function(request) {
    switch(request.action){
        case "downloading":
            $("#download").attr("disabled",true); 
            $("#download").text("下载中..");
            break;
        case "updateStatus":
            updateStatusView(request.inprogress,request.wait,request.completed);
            break;
    }
});

function updateStatusView(inprogress,wait,completed){
    $("#inprogress").text(inprogress);
    $("#wait").text(wait);
    $("#completed").text(completed);
}