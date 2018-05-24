/*global $*/
var blendBuffer,
    counter = 0,
    decodedBlend = [];
function imagesHandler(images){
    counter = images.length;
    for(var i = 0; i < images.length; i++){
        readImageBlob(event, images[i], i);
    }
}

function readImageBlob(event, image, index){
    var reader = new FileReader();
    reader.index = index;
    reader.onloadend = function(event){
        if(event.target.readyState == FileReader.DONE){
            var imageBuffer = event.target.result;
            var imageTyped = new Uint8Array(imageBuffer);
            var blendData = imageTyped.slice(673, imageTyped.length - 16);
            decodedBlend[event.target.index] = blendData;
            counter--;
            if(!counter){
                compileBlend(decodedBlend);
            }
        }
    };
    reader.readAsArrayBuffer(image);
}

function compileBlend(data){
    var blendLength = data.reduce((acc, curr) => acc + curr.length, 0);
    var blendTyped = new Uint8Array(blendLength);
    for(var i = 0; i < data.length; i++){
        blendTyped.set(data[i], data.slice(0, i).reduce((acc, curr) => acc + curr.length, 0));
    }
    
    blendBuffer = blendTyped.buffer;
    document.getElementById("downloadBlend").disabled = false;
}

function download(buffer, filename){
    var element = document.createElement('a');
    element.setAttribute('href', window.URL.createObjectURL(buffer));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    
    element.click();
    document.body.removeChild(element);
}

var params = {};
window.onload = function(){
    var queryString = window.location.search.slice(1);
    var proxyUrl = "https://cors-anywhere.herokuapp.com/";
    if(queryString){
        queryString = queryString.split('#')[0];
        var arr = queryString.split('&');
        for(var q = 0; q < arr.length; q++){
            var keyPair = arr[q].split('=');
            params[keyPair[0]] = keyPair[1];
        }
        var i = 0,
            images = [];
        while(params['image' + i]){
            var settings = {
                "async": true,
                "crossDomain": true,
                "url": proxyUrl + 'https://i.stack.imgur.com/' + params['image' + i] + '.png',
                "method": 'GET',
                "xhr": function(){
                    var xhr = new XMLHttpRequest();
                    xhr.responseType = 'blob';
                    return xhr;
                }
            };
            images.push($.ajax(settings));
            i++;
        }
        $.when.apply($, images).done(function(){
            var results = [].slice.call(arguments);
            if(typeof results[1] == "string"){
                results = [results];
            }
            imagesHandler(results.map(x => x[0]));
        });
    }else{
        console.warn("No Query String!");
    }
};


document.getElementById('downloadBlend').addEventListener('click', function(){
    download(new Blob([blendBuffer]), params['fileName']);
});