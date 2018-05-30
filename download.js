var blendBuffer,
    counter = 0,
    decodedBlend = [];
function imagesHandler(event, images, trimLength){
    counter = images.length;
    for(var i = 0; i < images.length; i++){
        readImageBlob(event, images[i], i, trimLength);
    }
}

function readImageBlob(event, image, index, trimLength){
    var reader = new FileReader();
    reader.index = index;
    reader.onloadend = function(event){
        if(event.target.readyState == FileReader.DONE){
            var imageBuffer = event.target.result;
            var imageTyped = new Uint8Array(imageBuffer);
            var blendData = imageTyped.slice(trimLength, imageTyped.length - 16);
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
    //document.getElementById("downloadBlend").disabled = false;
    $('#message').removeClass('loadingMessage');
    $('#downloadBlend').css('cursor', 'pointer');
    $('.dropZone').addClass('active');
    $('svg').addClass('active');
    $('#message').html('Click to download <code>' + params['fn'] + '</code> (' + Math.round(blendLength / 10000) / 100 + 'MB)');
    document.getElementById('downloadBlend').addEventListener('click', function(){
        download(new Blob([blendBuffer]), params['fn']);zzz
    });
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
        document.title = "blendgur: download " + params['fn'];
        
        var i = 0,
            images = [];
        while(params['i' + i]){
            var settings = {
                "async": true,
                "crossDomain": true,
                "url": proxyUrl + 'https://i.stack.imgur.com/' + params['i' + i] + '.png',
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
        $.when.apply($, images).done(function(event){
            var results = [].slice.call(arguments);
            if(typeof results[1] == "string"){
                results = [results];
            }
            /*var results = event;
            if(typeof results !== "object"){
                results = [event];
            }*/
            imagesHandler(event, results.map(x => x[0]), params['pl']);
        });
    }else{
        console.error("No Query String!");
        $('.loadingMessage').hide();
        $('.errorMessage').html('Error getting <code>.blend</code>: No query string in URL');
        $('.errorMessage').show();
    }
};