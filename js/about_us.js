let image = document.createElement("img");
image.src = "images/AboutUS.gif";
image.style.position = "absolute";
image.style.width = "100%";
image.style.zIndex = "-1";

document.body.appendChild(image);

//disable scroll bar
document.body.style.overflow = "hidden";

//body to cursor
document.body.style.cursor = "pointer";

//when click at this window go to index.html
document.body.onclick = function(){
    window.location.replace("/index.html");
}
