//replace body background with image

let image = document.createElement("img");
image.src = "images/StartMenu.gif";
image.style.position = "absolute";
image.style.top = "0px";
image.style.left = "0px";
image.style.width = "100%";
image.style.height = "100%";
image.style.zIndex = "-1";
document.body.appendChild(image);

//create button top 47.5% left 10% width 33% height 30%
let button = document.createElement("div");
button.style.position = "absolute";
button.style.top = "55%";
button.style.left = "20%";
button.style.width = "25%";
button.style.height = "15%";
button.style.zIndex = "1";
button.style.fontSize = "50px";
button.style.fontFamily = "Arial";
button.style.color = "white";
button.style.border = "none";
button.style.borderRadius = "10px";

window.addEventListener("DOMContentLoaded", event => {
    const audio = document.querySelector("audio");
    audio.volume = 0.2;
    audio.play();
  });

const audio = document.querySelector("audio");
audio.volume = 0.2;
audio.play();
  

button.onclick = async function(){
    // play sound id = "audioContainer"
    //document.getElementById("audioContainer").volume = 1;
    var audio = new Audio('https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3');
    await audio.play();

    window.location.replace("/game.html");
    //go to game.html
}

//set button to invisible
//button.style.visibility = "hidden";
document.body.appendChild(button);


//set page unhilighted able
document.body.style.userSelect = "none";

//create button top 70% left 16% width 40% height 10%
let button2 = document.createElement("div");
button2.style.position = "absolute";
button2.style.top = "70%";
button2.style.left = "13%";
button2.style.width = "40%";
button2.style.height = "13%";
button2.style.zIndex = "1";
button2.style.fontSize = "50px";
button2.style.fontFamily = "Arial";
button2.style.color = "white";
button2.style.border = "none";
button2.style.borderRadius = "10px";

button2.onclick = function(){
    window.location.replace("/howto.html");
}

//set button to invisible
//button.style.visibility = "hidden";
document.body.appendChild(button2);

//create button top 80% left 25% width 20% height 10%
let button3 = document.createElement("div");
button3.style.position = "absolute";
button3.style.top = "85%";
button3.style.left = "17.5%";
button3.style.width = "30%";
button3.style.height = "10%";
button3.style.zIndex = "1";
button3.style.fontSize = "50px";
button3.style.fontFamily = "Arial";
button3.style.color = "white";
button3.style.border = "none";
button3.style.borderRadius = "10px";

button3.onclick = function(){
    window.location.replace("/aboutus.html");
}

//set button to invisible
//button.style.visibility = "hidden";
document.body.appendChild(button3);

//replace all div to pointer
let divs = document.getElementsByTagName("div");
for(let i = 0; i < divs.length; i++){
    divs[i].style.cursor = "pointer";
}
