chrome.extension.onConnect.addListener(function(port) {
  port.onMessage.addListener(function(request) {
        switch(request.action){
            case "doDownload":
                chrome.tabs.executeScript(null, {
                    file: "contentscript.js"
                }, function () {
                    if (chrome.runtime.lastError) {
                        message.innerText = 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
                    }
                });
                port.postMessage({action:"downloading"});
                break;
        }
        
  });
});

chrome.runtime.onMessage.addListener(function (request, sender) {
    switch (request.action) {
        case "getSource":
            parseSource(request.source);
            break;
    }
});

function parseSource(source){
    var dom = $(source);
    $(dom).find("h3 a").each(function(){
        var href = $(this).attr("href");
        if(href.indexOf("htm_data")===0){
            parseRmdownHash("http://t66y.com/"+href);
        }
    })
}

function parseRmdownHash(topicUrl){
    $.ajax({
        type:"GET",
        url: topicUrl,
        dataType:"html",
        success:function(data){
            var regx = /link\.php\?hash=(\w+)/g;
            var result;
            while((result=regx.exec(data))!=null){
                rmdown(result[1]);
                break;
            }
        }
    });
}

function rmdown(hash){
    var url = "http://www.rmdown.com/link.php?hash="+hash;
    console.log("download:"+url);
    $.ajax({
        type:"GET",
        url: url,
        dataType:"html",
        success:function(data){
            var reff = $(data).find("input[name='reff']").val();
            chrome.downloads.download({
                url: "http://www.rmdown.com/download.php?ref="+hash+"&reff="+escape(reff)+"&submit=download"
            })
        }
    });
}
