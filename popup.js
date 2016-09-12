var port = chrome.extension.connect({name: "popup"});
port.onMessage.addListener(function(request) {
    switch(request.action){
        case "downloading":
            $("#download").attr("disabled",true); 
            $("#download").text("下载中..");
            break;
    }
});


$("#download").click(function(){
    port.postMessage({action:"doDownload"});
});
