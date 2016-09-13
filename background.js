var MAX_DOWNLOAD_TASK_NUM = 5;
var RMDOWN_KEY_PREFIX = "rm_";

var STATE_WAIT = 1;
var STATE_SUBMIT = 2;
var STATE_COMPLETED = 3;

var waitTasks;
var inprogressTasks;
var completedTasks;

var portQueue = [];

chrome.extension.onConnect.addListener(function(port) {
    portQueue.push(port);
    port.postMessage({ 
        action: "updateStatus", 
        wait: waitTasks,
        inprogress: inprogressTasks,
        completed: completedTasks
    });

    port.onMessage.addListener(function(request) {
        switch(request.action){
            case "doDownload":
                console.log("do download");
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

    port.onDisconnect.addListener(function(port){
        for(var i=portQueue.length-1;i>=0;i--){
            if(port==portQueue[i]){
                portQueue.splice(i)
            }
        }
    });
});

chrome.runtime.onMessage.addListener(function(request){
    switch (request.action) {
        case "pageContent":
            $(request.source).find("h3 a").each(function(){
                var href = $(this).attr("href");
                if(href.indexOf("htm_data")===0){
                    parseRmdownHash("http://t66y.com/"+href);
                }
            });
            break;
    }
});

chrome.downloads.onChanged.addListener(function(info){
    if(info.state&&info.state.current=="complete"){
        chrome.downloads.search({id:info.id},function(files){
            if(files.length>0){
                var rs = /(\w+)\.\w+$/.exec(files[0].filename);
                if(rs&&rs.length==2){
                    var hash = rs[1];
                    if(localStorage.getItem(RMDOWN_KEY_PREFIX+hash)){
                        console.log("Download completed: "+hash);
                        //Update download state
                        localStorage.setItem(RMDOWN_KEY_PREFIX+hash,STATE_COMPLETED);
                    }
                }
                
            }
        })
        
    }
});

function handleDownloadTask(){
    chrome.downloads.search({state:"in_progress"},function(tasks){
        var remain  =  MAX_DOWNLOAD_TASK_NUM - tasks.length;

        var wait = 0;
        var completed = 0;
        for(var i=0,len=localStorage.length;i<len;i++){
            var key = localStorage.key(i);
            if(key.indexOf(RMDOWN_KEY_PREFIX)===0){
                switch(parseInt(localStorage.getItem(key))){
                    case STATE_WAIT:
                        wait++;
                        if(remain-->0){
                            rmdown(key.replace(RMDOWN_KEY_PREFIX,""));
                            localStorage.setItem(key,STATE_SUBMIT);
                        }
                        break;
                    case STATE_COMPLETED:
                        completed++;
                        break;
                }
            }
        }

        waitTasks = wait;
        completedTasks = completed;
        inprogressTasks = tasks.length;

        $.each(portQueue,function(){
            this.postMessage({ 
                    action: "updateStatus", 
                    wait: wait,
                    inprogress: inprogressTasks,
                    completed: completed
                });
        })

        clearTimeout(timer);
        setTimeout(handleDownloadTask,300);
    });
}

var timer = setTimeout(handleDownloadTask,300);

function parseRmdownHash(topicUrl){
    $.ajax({
        type:"GET",
        url: topicUrl,
        dataType:"html",
        success:function(data){
            var regx = /link\.php\?hash=(\w+)/g;
            var result;
            while((result=regx.exec(data))!=null){
                var hash = result[1];
			    if(!localStorage.getItem(RMDOWN_KEY_PREFIX+hash)){
                    localStorage.setItem(RMDOWN_KEY_PREFIX+hash,STATE_WAIT);
			    }
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
                url: "http://www.rmdown.com/download.php?ref="+hash+"&reff="+escape(reff)+"&submit=download",
                filename: "bt/"+hash+".torrent",
                conflictAction: "overwrite"
            });
        }
    });
}
