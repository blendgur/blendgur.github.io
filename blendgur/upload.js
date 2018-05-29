var blendFile, baseImageData, pngChunkType, pngEndData;

var xhr = new XMLHttpRequest();
xhr.open("GET", '/blendgur/img/base.png', true);
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
    fileCounter = 0;

function readBlendBlob(file, index){
    var reader = new FileReader();
    reader.index = index;
    reader.onloadend = function(event){
        if(event.target.readyState == FileReader.DONE){ //DONE == 2
            blendFileChunks[event.target.index] = event.target.result;
            fileCounter--;
            if(!fileCounter)
                uploadToBSEImgur(blendFileChunks.map(c => makePNG(c)));
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
    return [baseImageData, lengthData, pngChunkType, data, checksum, pngEndData].reduce(joinUint8Arr);
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
        if(typeof results[0] !== "object")
            results = [results];
        var idList = results.map(r => r[0].match(/\w+\.png/)[0].slice(0, -4));
        createPasteString(idList);
    });
}

function createPasteString(ids){
    var pasteString = '[<img src="https://scottdmilner.github.io/blendgur/img/embedImage.png"/>](https://scottdmilner.github.io/blendgur/download?';
    pasteString += "fn=" + encodeURIComponent(fileName);
    pasteString += "&pl=" + encodeURIComponent(baseImageData.length);
    for(var d = 0; d < ids.length; d++){
        pasteString += '&i' + d + '=' + ids[d];
    }
    pasteString += ")";
    $('.successMessage').append('<div id="markdown">' + pasteString + '</div>');
    $('.loadingMessage').hide();
    $('.successMessage').show();
    window.getSelection().selectAllChildren(document.getElementById('markdown'));
}

function checkFileHeader(file){
    var blendHeader = [66, 76, 69, 78, 68, 69, 82]; //'BLENDER';
    var gzipHeader = [31, 139]; //1F 8B
    var reader = new FileReader();
    return new Promise(function(resolve, reject){
        reader.onerror = () => reject(new DOMException("Problem parsing .blend file"));
        reader.onloadend = function(event){
            if(event.target.readyState == FileReader.DONE){
                var blendView = new DataView(event.target.result, 0, 7);
                var gzipView = new DataView(event.target.result, 0, 2);
                resolve(blendHeader.reduce((acc, curr, i) => acc && curr == blendView.getUint8(i), true) || gzipHeader.reduce((acc, curr, i) => acc && curr == gzipView.getUint8(i), true));
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

function uploadBlend(blendFile){
    $('.checkMessage').hide();
    $('.loadingMessage').show();
    blendFileChunks = [];
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

function toggleZone(bool){
    if(bool){
        $('.dropZone').addClass('active');
        $('svg').addClass('active');
        $('#uploadBlend').prop('disabled', false)
        $('.fileUpload').css({'z-index': 99, 'cursor': 'pointer'});
    }else{
        $('.dropZone').removeClass('active');
        $('svg').removeClass('active');
        $('#uploadBlend').prop('disabled', true);
        $('.fileUpload').css({'z-index': 0, 'cursor': 'auto'});
    }
}
function resetPage(){
    $('.checkMessage').hide();
    $('.loadingMessage').hide();
    $('.successMessage').hide();
    $('.errorMessage').hide();
    setTimeout(toggleZone, 5, true);
    $('.uploadMessage').show();
}

async function blendSelectHandler(event){
    blendFile = event.target.files[0];
    fileName = blendFile.name;
    //verify .blend file header
    if(blendFile.size > 25000000){
        console.error('.blend file too large!');
        $('.uploadMessage').hide();
        toggleZone(false);
        $('.errorMessage').html('Error uploading file. File size exceeds 25MB<br><button id="reset" onmouseup="resetPage()">Try again</button>');
        $('.errorMessage').show();
    }else{
        if(await checkFileHeader(blendFile) && /\.blend\d*$/.test(fileName)){
            $('.uploadMessage').hide();
            $('.errorMessage').hide();
            toggleZone(false);
            $('.checkMessage').prepend('Please check the following details:<br><br><strong>file:</strong>  ' + fileName + '<br><strong>size:</strong>  ' + Math.round(blendFile.size / 1000) / 100 + 'MB<br><br>');
            $('.checkMessage').show();
        }else{
            console.error('Invalid .blend File!');
            $('.uploadMessage').hide();
            toggleZone(false);
            $('.errorMessage').html('Error uploading file. Please check that you have selected a .blend file<br><button id="reset" onmouseup="resetPage()">Try again</button>');
            $('.errorMessage').show();
        }
    }
}

document.getElementById('uploadBlend').addEventListener('change', blendSelectHandler, false);