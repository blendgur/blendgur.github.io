var decodedBlend = [];

function imagesSelectHandler(event){
    var images = event.target.files;
    console.log(images);
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
            console.log(event.target.index);
            decodedBlend[event.target.index] = blendData;
        }
    };
    
    reader.readAsArrayBuffer(image);
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

document.getElementById('uploadImages').addEventListener('change', imagesSelectHandler, false);
document.getElementById('downloadBlend').addEventListener('click', function(){
    var blendLength = 0;
    for(var i = 0; i < decodedBlend.length; i++){
        blendLength += decodedBlend[i].length;
    }
    var blendTyped = new Uint8Array(blendLength);
    
    blendLength = 0;
    for(var i = 0; i < decodedBlend.length; i++){
        blendTyped.set(decodedBlend[i], blendLength);
        blendLength += decodedBlend[i].length;
    }
    var blendBuffer = blendTyped.buffer;
    
    download(new Blob([blendBuffer]), 'testblend.blend');
});
