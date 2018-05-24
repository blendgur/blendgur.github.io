/*global $*/
var baseImageData,pngChunkType, pngEndData;

var xhr = new XMLHttpRequest();
xhr.open("GET", '/base.png', true);
xhr.responseType = 'arraybuffer';
xhr.onreadystatechange = function(event){
    if(this.readyState == 4 && this.status == 200){
        baseImageData = new Uint8Array(this.response.slice(0, -12));
        pngChunkType = new Uint8Array([98,108,78,100]); //blNd
        pngEndData = new Uint8Array(this.response.slice(-12));
    }
};
xhr.send();

var fileName = "",
    blendFileChunks = [],
    images = [],
    fileCounter = 0;

function readBlendBlob(file, index){
    var reader = new FileReader();
    reader.index = index;
    reader.onloadend = function(event){
        if(event.target.readyState == FileReader.DONE){ //DONE == 2
            blendFileChunks[event.target.index] = event.target.result;
            fileCounter--;
            if(!fileCounter){
                /*images = [];
                for(var f = 0; f < blendFileChunks.length; f++){
                    images[f] = makePNG(blendFileChunks[f]);
                }*/
                images = blendFileChunks.map(c => makePNG(c));
                console.log(images);
                uploadToBSEImgur(images);
            }
        }
    };
    reader.readAsArrayBuffer(file);
}

function joinUint8Arr(arr1, arr2){
    var newarr = new Uint8Array(arr1.length + arr2.length);
    newarr.set(arr1);
    newarr.set(arr2, arr1.length);
    return newarr;
}

function makePNG(buffer){
    var chunkLength = buffer.length;
    var lengthData = new Uint8Array([(chunkLength >> 24) % 256, (chunkLength >> 16) % 256, (chunkLength >> 8) % 256, chunkLength % 256]);
    var checksum = new Uint8Array(4); //hopefully the CRC doesn't need to be correct for this chunk
    var data = new Uint8Array(buffer);
    
    var imageArr = joinUint8Arr(joinUint8Arr(joinUint8Arr(joinUint8Arr(joinUint8Arr(baseImageData, lengthData), pngChunkType), data), checksum), pngEndData);
    return imageArr;
}

function uploadToBSEImgur(files){
    var hostedIDs = [],
        seUrl = "https://blender.stackexchange.com/upload/image",
        proxyUrl = "https://cors-anywhere.herokuapp.com/";
    
    for(var f = 0; f < files.length; f++){
        var form = new FormData(),
            settings = {
                "async": true,
                "crossDomain": true,
                "url": proxyUrl + seUrl,
                "method": "POST",
                "processData": false,
                "contentType": false,
                "mimeType": "multipart/form-data",
                "data": form
            };
        form.append("image", new Blob([files[f]], {type: 'image/png'}));
        
        hostedIDs.push($.ajax(settings));
    }
    $.when.apply($, hostedIDs).done(function(){
        var results = [].slice.call(arguments);
        if(typeof results[0] !== "object"){
            results = [results];
        }
        var idList = [];
        console.log(results);
        /*for(var r = 0; r < results.length; r++){
            idList.push(results[r][0].match(/\w+\.png/)[0].slice(0, -4));
        }*/
        idList = results.map(r => r[0].match(/\w+\.png/)[0].slice(0, -4));
        createPasteString(idList);
    });
}

function createPasteString(ids){
    console.log(ids);
    var pasteString = "https://scottdmilner.github.io/blendgur/download?fileName=" + encodeURIComponent(fileName);
    for(var d = 0; d < ids.length; d++){
        pasteString += '&';
        pasteString += 'image' + d + '=' + ids[d];
    }
    document.getElementById("output").innerHTML = pasteString;
    console.log(pasteString);
}

function blendSelectHandler(event){
    blendFileChunks = [];
    var blendFile = event.target.files[0];
    fileName = blendFile.name;
    var chunkSize = 2000000 - baseImageData.length - 25;
    var blobList = [];
    for(var b = 0; b < blendFile.size; b += chunkSize){
        blobList.push(blendFile.slice(b, b + chunkSize));
    }
    fileCounter = blobList.length;
    for(var j = 0; j < blobList.length; j++){
        readBlendBlob(blobList[j], j);
    }
}

document.getElementById('uploadBlend').addEventListener('change', blendSelectHandler, false);