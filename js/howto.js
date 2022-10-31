let image = document.createElement("img");
image.src = "images/control.png";
image.style.position = "absolute";
image.style.top = "0px";
image.style.left = "0px";
image.style.width = "100%";
image.style.zIndex = "-1";


document.body.appendChild(image);

//when click at this window go to index.html
document.body.onclick = function(){
    window.location.replace("/index.html");
}

//disable scroll bar
document.body.style.overflow = "hidden";

document.body.style.cursor = "pointer";