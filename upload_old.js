var baseImageData= new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,13,73,72,
    68,82,0,0,0,48,0,0,0,12,8,0,0,0,0,1,209,97,141,0,0,0,9,112,72,89,115,0,0,11,
    19,0,0,11,19,1,0,154,156,24,0,0,2,87,73,68,65,84,40,21,1,76,2,179,253,1,255,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,2,0,0,0,227,226,0,0,0,0,234,208,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,213,242,0,0,0,0,251,206,184,244,0,247,204,252,0,0,0,0,0,0,2,0,0,0,
    216,206,0,0,0,0,231,173,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,254,166,245,0,0,0,
    0,210,148,248,166,223,249,140,246,0,0,0,0,0,0,4,0,0,0,3,5,0,0,0,0,2,1,1,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,2,6,2,0,0,0,0,212,111,47,225,20,252,1,2,0,0,0,0,0,
    0,4,0,0,0,2,194,235,4,55,37,0,0,0,252,209,207,20,71,9,201,2,217,8,66,18,0,
    211,202,5,199,104,0,0,0,214,182,235,29,233,14,2,0,1,0,211,202,7,55,37,2,0,0,
    0,0,3,52,29,128,237,1,0,0,192,186,58,15,177,0,194,186,47,229,168,0,210,156,
    49,42,27,0,0,0,0,12,11,28,3,197,234,1,0,2,211,163,54,34,152,247,4,0,0,0,254,
    57,44,0,205,229,4,0,254,183,42,242,250,189,80,4,61,45,13,135,252,197,97,48,
    0,28,255,0,0,0,30,49,51,15,2,1,0,0,254,200,31,244,250,219,238,4,0,0,0,255,
    255,0,0,4,249,4,0,1,12,29,18,17,119,8,254,0,0,3,0,254,228,254,0,255,253,0,0,
    0,0,0,253,254,0,255,0,0,0,2,8,4,20,255,139,16,2,251,213,254,1,237,248,221,
    196,21,255,255,1,46,223,27,28,252,253,255,255,0,0,255,5,68,191,242,247,3,0,
    0,0,0,0,255,0,0,255,0,0,253,255,48,223,10,23,249,253,4,236,173,117,29,157,
    207,4,116,32,217,28,0,74,166,128,3,43,31,23,8,0,5,38,253,56,238,149,5,247,4,
    0,0,0,0,23,7,0,23,7,2,54,1,39,49,126,12,52,36,1,255,248,8,0,246,252,4,10,0,
    254,250,8,0,255,247,1,9,0,248,4,4,0,248,8,0,0,250,1,254,7,0,0,0,0,248,8,0,
    248,8,0,248,8,0,0,246,1,9,0,1,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,203,29,146,127,72,171,
    59,63]);//length = 665
var pngChunkType = new Uint8Array([98,108,78,100]); //blNd
var pngEndData = new Uint8Array([0,0,0,0,73,69,78,68,174,66,96,130]); //12

var blendFileChunks = [];
var images = [];

function blendSelectHandler(event){
    blendFileChunks = [];
    
    var blendFile = event.target.files[0];
    
    var chunkSize = 2000000 - baseImageData.length - 25;
    
    var j = 0;
    for(var b = 0; b < blendFile.size; b += chunkSize){
        readBlendBlob(event, blendFile, b, b + chunkSize, j);
        j++;
    }
}

function readBlendBlob(event, file, startByte, stopByte, index){
    var reader = new FileReader();
    reader.index = index;
    
    reader.onloadend = function(event){
        if(event.target.readyState == FileReader.DONE){ //DONE == 2
            blendFileChunks[event.target.index] = event.target.result;
            console.log(blendFileChunks);
            if(stopByte >= file.size){
                images = [];
                for(var f = 0; f < blendFileChunks.length; f++){
                    images[f] = makePNG(blendFileChunks[f]);
                }
                console.log(images);
            }
        }
    };
    
    var blob = file.slice(startByte, stopByte);
    reader.readAsArrayBuffer(blob);
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
    
    return imageArr.buffer;
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

document.getElementById('uploadBlend').addEventListener('change', blendSelectHandler, false);
document.getElementById('downloadImages').addEventListener('click', function(){
    for(var i = 0; i < images.length; i++){
        download(new Blob([images[i]]), 'blendFile' + i + '.png');
    }
}, false); 
