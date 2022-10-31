//create canva into game_frame
let layer_1 = document.createElement("canvas");
layer_1.width = 7000;
layer_1.height = 7000
let ctx_1 = layer_1.getContext("2d");

let layer_2 = document.createElement("canvas");
layer_2.width = 7000;
layer_2.height = 7000;
let ctx_2 = layer_2.getContext("2d");

//layer_3
let layer_3 = document.createElement("canvas");
layer_3.width = 7000;
layer_3.height = 7000;
let ctx_3 = layer_3.getContext("2d");

//set game_frame canvas to transparant
document.getElementById("game_frame").style.backgroundColor = "transparent";

//canvas.width = 1000;
//canvas.height = 900;
//document.getElementById("game_frame").appendChild(canvas);
let simspeed = 100;
let player_speed = 1;
let precit_count = 100;
let star_mass = 5000
let planet_mass = 1000
let moon_mass = 5
G = 5;
dt = 1;

let paused_update = false;


// ------
// I HAVE TO DO IT MANUALLY CUZ YOU DONT LET ME USE LIBRARY OTHER THAN FONTAWESOME
// ------
// create list of assets name
let game_assets = [
    'spaceship1','spaceship2','spaceship3','star1','star2','star3','star4','star5','star6','star7'
    ,'star8','star9','star10','star11','star12','sun'
]

//create SpaceObject that thas mass, size, position ,velocity(x,y) and acceleration(x,y) class
class SpaceObject {
    constructor(mass, size, x, y, vx, vy) {
        this.mass = mass;
        this.size = size*3;
        this.heading = 0;
        //set color to random color
        this.color = "#" + Math.floor(Math.random() * 16777215).toString(16);
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.ax = 0;
        this.ay = 0;

        this.fixed_position = false;


        //store predicted position data
        this.predicted_x = [];
        this.predicted_y = [];
        this.predicted_vx = [];
        this.predicted_vy = [];
        this.predicted_ax = [];
        this.predicted_ay = [];
        this.predicted_heading = [];
        this.predicted_destroyed = [];
        this.destroyer = false;
        this.destroyed = false;
    }

    get_predict_data() {
        return [this.mass,this.predicted_x, this.predicted_y, this.predicted_vx, this.predicted_vy, this.predicted_heading];
    }

    //add predicted position
    add_predicted_position() {
        this.predicted_x.push(this.x);
        this.predicted_y.push(this.y);
        this.predicted_vx.push(this.vx);
        this.predicted_vy.push(this.vy);
        this.predicted_ax.push(this.ax);
        this.predicted_ay.push(this.ay);
        this.predicted_heading.push(this.heading);
        this.predicted_destroyed.push(this.destroyed);
        
    }

    add_predicted_position_from_worker(data) {
        this.predicted_x.push(data[0]);
        this.predicted_y.push(data[1]);
        this.predicted_vx.push(data[2]);
        this.predicted_vy.push(data[3]);
        this.predicted_ax.push(data[4]);
        this.predicted_ay.push(data[5]);
        this.predicted_heading.push(data[6]);
    }

    //move to first predicted position then remove the first predicted position
    move_to_predicted_position() {
        if (paused){
            return
        }
        this.x = this.predicted_x.shift();
        this.y = this.predicted_y.shift();
        this.vx = this.predicted_vx.shift();
        this.vy = this.predicted_vy.shift();
        this.ax = this.predicted_ax.shift();
        this.ay = this.predicted_ay.shift();
        this.heading = this.predicted_heading.shift();
        this.destroyed = this.predicted_destroyed.shift();
    }

    //reset predicted trajectory
    reset_predicted_trajectory() {
        this.predicted_x = [];
        this.predicted_y = [];
        this.predicted_vx = [];
        this.predicted_vy = [];
        this.predicted_ax = [];
        this.predicted_ay = [];
        this.predicted_heading = [];
        this.predicted_destroyed = [];
    }
    

    //backup all the data of the object
    backup() {
        this.bx = this.x;
        this.by = this.y;
        this.bvx = this.vx;
        this.bvy = this.vy;
        this.bax = this.ax;
        this.bay = this.ay;
        this.bheading = this.heading;
        this.bdestroyed = this.destroyed;
    }

    recover_backup() {
        this.x = this.bx;
        this.y = this.by;
        this.vx = this.bvx;
        this.vy = this.bvy;
        this.ax = this.bax;
        this.ay = this.bay;
        this.heading = this.bheading;
        this.destroyed = this.bdestroyed;
    }

    //add gravitational force to the object
    add_gravity(other) {
        let dx = other.x - this.x;
        let dy = other.y - this.y;
        let d2 = dx * dx + dy * dy;
        let d = Math.sqrt(d2);
        let F = other.mass / d2;
        this.ax += F * dx / d;
        this.ay += F * dy / d;

        //check if other in range
        if (this.destroyer && d < this.size + other.size) {
            other.destroyed = true;
        }
    }

    //update the position and velocity of the object
    update() {
        //if the object is going to out of the canvas then flip the velocity direction
        if (this.x < 0 || this.x > 7000 || this.y < 0 || this.y > 7000) {
            this.vx = -this.vx;
            this.vy = -this.vy;
            this.ax = 0;
            this.ay = 0;

            //move the object 

            //change reflex velocity 90 degree
            let theta = Math.atan2(this.vy, this.vx);
            theta += Math.PI / 2;
            this.vx = Math.cos(theta) * Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            this.vy = Math.sin(theta) * Math.sqrt(this.vx * this.vx + this.vy * this.vy);

            //reduce total magnitude of velocity to 0.5
            let v = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            this.vx = this.vx / v * 5
            ;
            this.vy = this.vy / v * 5;

            this.x += this.vx * 100;
            this.y += this.vy * 100;            
        }
        this.vx += this.ax * dt;
        this.vy += this.ay * dt;

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        //update the angle of total force
        this.heading = Math.atan2(this.ay, this.ax);

        this.ax = 0;
        this.ay = 0;
    }

    update_from_worker(data) {
        this.x = data[0];
        this.y = data[1];
        this.vx = data[2];
        this.vy = data[3];
        this.ax = data[4];
        this.ay = data[5];
        this.heading = data[6];
    }

    //set orbiter_component circulate around the object
    add_to_orbit(orbiter_component, distance, skew_constant = 0.0) {
        //calculate velocity and position of the orbiter_component need to stay in orbit
        let velocity = Math.sqrt(2 * (G - skew_constant) * this.mass / distance);
        //orbiter_component.x = this.x;
        //orbiter_component.y = this.y + distance;
        //set velocity to be zero relative to the object
        orbiter_component.vx = this.vx;
        orbiter_component.vy = this.vy;

        //orbiter_component.vx = velocity;

        //set the orbiter_component orbit with random phase
        let phase = Math.random() * 2 * Math.PI;
        orbiter_component.x = this.x + distance * Math.cos(phase);
        orbiter_component.y = this.y + distance * Math.sin(phase);
        orbiter_component.vx += velocity * Math.sin(phase);
        orbiter_component.vy += -velocity * Math.cos(phase);

    }
    
    draw_object() {
        ctx_1.beginPath();
        ctx_1.arc(this.x, this.y, this.size, 0, 2 * Math.PI);

        //set color
        ctx_1.fillStyle = this.color;

        ctx_1.fill();
        ctx_1.fillStyle = "black";
    }
}

//random assets path
let base_assets_path = "images/assets/";
function random_assets_path() {
    //name is random element form game_assets
    let name = game_assets[Math.floor(Math.random() * game_assets.length)];
    return base_assets_path + name + ".png";
}




//space Object With Image
class SpaceObjectWithImage extends SpaceObject {
    //receive image path
    constructor(mass, size, x, y, vx, vy, image_path) {
        super(mass, size, x, y, vx, vy);
        this.image = new Image();
        this.image.src = image_path;
    }

    draw_object() {
        //ctx_1.save(); // save current state
        //ctx_1.rotate(Math.PI); // rotate
        //this.rotate_image_to_direction();
        //ctx_1.drawImage(this.image, this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
        //ctx.drawImage(link,x,y,20,20); // draws a chain link or dagger
        //ctx_1.restore(); // restore original states (no rotation etc)
        //ctx_1.drawImage(this.image, this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);

        //draw rotated image
        //get heading direction

        let angle = Math.atan2(this.vy, this.vx);
        angle = (angle*180/Math.PI);



        ctx_1.save();
        ctx_1.translate(this.x, this.y);
        ctx_1.rotate(angle);
        ctx_1.drawImage(this.image, -this.size, -this.size, this.size * 2, this.size * 2);
        ctx_1.restore();
    }

    rotate_image_to_direction() {
        let angle = Math.atan2(this.vy, this.vx);
        angle = (angle*180/Math.PI)+90;

        if (angle < 0) {
            angle += 360;
        }
        ctx_1.save();
        //ctx_1.translate(this.x, this.y);
        ctx_1.rotate(angle-90);
        ctx_1.drawImage(this.image, this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
       //ctx_1.translate(-this.x, -this.y);
        ctx_1.restore();
    }
}

class SpaceObjectPlayer extends SpaceObjectWithImage {
    constructor(mass, size, x, y, vx, vy, image_path) {
        super(mass, size, x, y, vx, vy, image_path);
        this.set_up_input_function();
    }

    move_to_predicted_position() {
        // if paused then do not move
        super.move_to_predicted_position();
        update_position_x_graph(this.x);
        update_position_y_graph(this.y);
        update_speed_x_graph(this.vx);
        update_speed_y_graph(this.vy);
        update_force_angle_canvas(this.heading);
    }

    set_up_input_function() {
        document.addEventListener('keydown', async (event) => {
            //console.log("Down")
            //const keyName = event.key;
            //get key code
            let keyName = event.keyCode;
            if (keyName === 87) { // w key code is 87
                this.vy -= player_speed;
            }
            else if (keyName === 83) { // s key code is 83
                this.vy += player_speed;
            }
            else if (keyName === 65) { // a key code is 65
                this.vx -= player_speed;
            }
            else if (keyName === 68) { // d key code is 68
                this.vx += player_speed;
            }

            //zoom in viewport if +
            else if (keyName === 187) {
                viewport.scale += 0.1;
                document.getElementById("zoom_level").innerHTML = "Zoom Level: " + viewport.scale.toFixed(2);
            }

            //zoom out viewport if -
            else if (keyName === 189) {
                viewport.scale -= 0.1;
                //update zoom level
                document.getElementById("zoom_level").innerHTML = "Zoom Level: " + viewport.scale.toFixed(2);
            }

            //increase player speed by 0.1 if press shift
            else if (keyName === 16) {
                player_speed += 0.1;
                speed_indicator.innerHTML = "Power: " + player_speed.toFixed(2);
            }

            //decrease player speed by 0.1 if press ctrl
            else if (keyName === 17) {
                player_speed -= 0.1;
                //update player speed display
                speed_indicator.innerHTML = "Power: " + player_speed.toFixed(2);
            }

            //toggle god tool if space bar
            else if (keyName === 32) {
                if (current_god_tool_tab != 1) {
                    switch_god_tool_tab(1);
                }
                else {
                    switch_god_tool_tab(2);
                }
            }
            system.predict(precit_count);
            console.log(keyName)
        });
    }

    //rotate the player to velocity direction
}


//create Simulation System Class that Simulate All SpaceObject Gravity
class SimulationSystem {
    constructor() {
        this.objects = [];
        //player position store

    }

    //add SpaceObject to Simulation System
    add(object) {
        this.objects.push(object);
    }
    //reset all object predicted trajectory

    //Simulate Gravity
    simulate() {
        for (let i = 0; i < this.objects.length; i++) {
            let object = this.objects[i];
            if (object.fixed_position) {
                continue;
            }
            object.ax = 0;
            object.ay = 0;

            for (let j = 0; j < this.objects.length; j++) {
                if (i != j) {
                    let other = this.objects[j];
                    object.add_gravity(other);
                }
            }


        }
        for (let i = 0; i < this.objects.length; i++) {
            let object = this.objects[i];
            object.update();
        }
    }
    // Draw All SpaceObject function
    draw() {
        ctx_1.clearRect(0, 0, layer_1.width, layer_1.height);
        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].draw_object();
        }

        //draw 4 border of the canvas width of border is 10
        ctx_1.beginPath();
        ctx_1.fillStyle = "white";
        ctx_1.rect(0, 0, layer_1.width, 10);
        ctx_1.rect(0, 0, 10, layer_1.height);
        ctx_1.rect(0, layer_1.height - 10, layer_1.width, 10);
        ctx_1.rect(layer_1.width - 10, 0, 10, layer_1.height);
        ctx_1.fillStyle = "white";
        ctx_1.fill();

        ctx_1.stroke();

    }

    // predict SpaceObject Trajectories in next 100 frames
    async predict(n) {
        ctx_2.clearRect(0, 0, layer_1.width, layer_1.height);
        for (let i = 0; i < this.objects.length; i++) {
            let object = this.objects[i];
            object.reset_predicted_trajectory()
            object.backup();
        }
        for (let i = 0; i < n; i++) {
            this.simulate();
            for (let j = 0; j < this.objects.length; j++) {
                let object = this.objects[j];
                ctx_2.beginPath();
                object.add_predicted_position();
                // if object is player draw red line
                ctx_2.strokeStyle = 'white';
                if (object instanceof SpaceObjectPlayer) {
                    ctx_2.strokeStyle = 'red';
                }
                ctx_2.arc(object.x, object.y, 2, 0, 2 * Math.PI);
                ctx_2.stroke();
                ctx_2.strokeStyle = 'white';
            }
        }
        for (let i = 0; i < this.objects.length; i++) {
            let object = this.objects[i];
            object.recover_backup();
        }
    }

    new_predict(n){
        let data = []
        pred_worker.terminate()
        pred_worker = new Worker('js/predict.js');
        pred_worker.onmessage = function(e) {
            data = e.data;
            for (let i = 0; i < data.length; i++) {
                system.objects[i].add_predicted_position_from_worker(data[i]);
            }
        }
        for (let i = 0; i < system.objects.length; i++) {
            data.push(system.objects[i].get_predict_data())
        }
        pred_worker.postMessage([data, n]);

    }

    //simulate follow predicted trajectory
    simulate_object_followed_predicted_trajectory() {
        for (let i = 0; i < this.objects.length; i++) {
            let object = this.objects[i];
            object.move_to_predicted_position();
            //if object is destroyed remove it from system ignored if player
            if (object.destroyed && !(object instanceof SpaceObjectPlayer)) {
                this.objects.splice(i, 1);
            }
        }
    }
}

//create Solar System Simulation 
let system = new SimulationSystem();



let player
//function that Generate Random Galaxy
function generate_galaxy() {
    let center = new SpaceObject(100, 20, layer_1.width/2, layer_1.height/2, 0, 0);
    system.add(center);
    center.fixed_position = true;
    let center_distance = 500;

    for (let i = 0; i < 20; i++) {
        center_distance+=50;
        //for loop random count of stars 1 to 4
        let planet_count = Math.floor(Math.random() * 1) + 0;
        let initial_star_size = Math.floor(Math.random() * 10) + 4;
        let star = new SpaceObject(initial_star_size*10, initial_star_size, layer_1.width/2, layer_1.height/2, 0, 0);
        center.add_to_orbit(star, center_distance);
        system.add(star);
        let distance = Math.floor(Math.random() * 30) + 30;
        for (let j = 0; j < planet_count; j++) {
            //planet size 1 to 3
            //let distance = Math.floor(Math.random() * 300) + 50;
            let planet_size = Math.floor(Math.random() * 10) + 1;
            let planet = new SpaceObject(planet_size, planet_size, 500, 250, 0, 0);
            star.add_to_orbit(planet, distance);
            
            //increase distance 30 to 50 unit
            distance += Math.floor(Math.random() * 30) + 30;
            system.add(planet);
        }
        //center.add_to_orbit(star, center_distance);
    }
    player = new SpaceObjectPlayer(10, 10, layer_1.width/2, layer_1.height/2, 0, 0, 'images/blockman_head.png');
    system.add(player);
    center.add_to_orbit(player, 500);
}
/*
generate_galaxy()


//create function that randomly generate galaxy
function generate_galaxy() {
    let center = new SpaceObject(100, 20, layer_1.width/2, layer_1.height/2, 0, 0);
    system.add(center);
    //center.fixed_position = true;
    let center_distance = 500;

    for (let i = 0; i < 20; i++) {
        center_distance+=50;
        //for loop random count of stars 1 to 4
        let planet_count = Math.floor(Math.random() * 1) + 0;
        let initial_star_size = Math.floor(Math.random() * 10) + 4;
        let star = new SpaceObject(initial_star_size*10, initial_star_size, layer_1.width/2, layer_1.height/2, 0, 0);
        center.add_to_orbit(star, center_distance);
        system.add(star);
        let distance = Math.floor(Math.random() * 30) + 30;
        for (let j = 0; j < planet_count; j++) {
            //planet size 1 to 3
            //let distance = Math.floor(Math.random() * 300) + 50;
            let planet_size = Math.floor(Math.random() * 10) + 1;
            let planet = new SpaceObject(planet_size, planet_size, 500, 250, 0, 0);
            star.add_to_orbit(planet, distance);
            
            //increase distance 30 to 50 unit
            distance += Math.floor(Math.random() * 30) + 30;
            system.add(planet);
        }
        //center.add_to_orbit(star, center_distance);
    }
    player = new SpaceObjectPlayer(10, 10, layer_1.width/2, layer_1.height/2, 0, 0, 'images/blockman_head.png');
    system.add(player);
    center.add_to_orbit(player, 500);
}
*/
let sun;

//create random solar system

function solar(center_x, center_y) {
    sun = new SpaceObjectWithImage(star_mass, 20, center_x, center_y, 0, 0, 'images/assets/sun.png');
    system.add(sun);
    sun.fixed_position = true;
    let earth = new SpaceObjectWithImage(planet_mass, 15, layer_1.width/2, layer_1.height/2, 0, 0, "images/assets/star5.png");
    system.add(earth);
    sun.add_to_orbit(earth, 500);
    let moon = new SpaceObjectWithImage(moon_mass , 5, layer_1.width/2, layer_1.height/2, 0, 0, "images/assets/star3.png");
    system.add(moon);
    earth.add_to_orbit(moon, 50);

    //add jupiter
    let jupiter = new SpaceObjectWithImage(planet_mass*6, 10, layer_1.width/2, layer_1.height/2, 0, 0, "images/assets/star4.png");
    system.add(jupiter);
    sun.add_to_orbit(jupiter, 1500);

    //add 3 jupiter moons
    let jupiter_moon_1 = new SpaceObjectWithImage(moon_mass , 5, layer_1.width/2, layer_1.height/2, 0, 0, "images/assets/star2.png");
    system.add(jupiter_moon_1);
    jupiter.add_to_orbit(jupiter_moon_1, 50);

    let jupiter_moon_2 = new SpaceObjectWithImage(moon_mass , 5, layer_1.width/2, layer_1.height/2, 0, 0, "images/assets/star1.png");
    system.add(jupiter_moon_2);
    jupiter.add_to_orbit(jupiter_moon_2, 70);

    let jupiter_moon_3 = new SpaceObjectWithImage(moon_mass , 5, layer_1.width/2, layer_1.height/2, 0, 0, "images/assets/star5.png");
    system.add(jupiter_moon_3);
    jupiter.add_to_orbit(jupiter_moon_3, 100);



    //add mars
    let mars = new SpaceObjectWithImage(planet_mass, 10, layer_1.width/2, layer_1.height/2, 0, 0, "images/assets/star10.png");
    system.add(mars);
    sun.add_to_orbit(mars, 2000,0.2);


    //add 2 mars moons
    let mars_moon_1 = new SpaceObjectWithImage(moon_mass , 5, layer_1.width/2, layer_1.height/2, 0, 0, "images/assets/star8.png");
    system.add(mars_moon_1);
    mars.add_to_orbit(mars_moon_1, 100);

    let mars_moon_2 = new SpaceObjectWithImage(moon_mass , 5, layer_1.width/2, layer_1.height/2, 0, 0, "images/assets/star8.png");
    system.add(mars_moon_2);
    mars.add_to_orbit(mars_moon_2, 150);

    //add venus
    let venus = new SpaceObjectWithImage(moon_mass , 10, layer_1.width/2, layer_1.height/2, 0, 0, "images/assets/star6.png");
    system.add(venus);
    sun.add_to_orbit(venus, 2500);

    //add 2 venus moons
    let venus_moon_1 = new SpaceObjectWithImage(moon_mass , 5, layer_1.width/2, layer_1.height/2, 0, 0, "images/assets/star7.png");
    system.add(venus_moon_1);
    venus.add_to_orbit(venus_moon_1, 50);


    let venus_moon_2 = new SpaceObjectWithImage(moon_mass , 5, layer_1.width/2, layer_1.height/2, 0, 0, "images/assets/star7.png");
    system.add(venus_moon_2);
    venus.add_to_orbit(venus_moon_2, 100);

    //add mercury
    let mercury = new SpaceObjectWithImage(planet_mass , 10, layer_1.width/2, layer_1.height/2, 0, 0, "images/assets/star9.png");
    system.add(mercury);
    sun.add_to_orbit(mercury, 1259);

    //add 3 more planet 
    let planet_1 = new SpaceObject(planet_mass, 10, layer_1.width/2, layer_1.height/2, 0, 0);
    system.add(planet_1);
    sun.add_to_orbit(planet_1, 300);

    let planet_2 = new SpaceObject(planet_mass, 10, layer_1.width/2, layer_1.height/2, 0, 0);
    system.add(planet_2);
    sun.add_to_orbit(planet_2, 800);


    //add 4 more planet
    let planet_3 = new SpaceObject(planet_mass, 10, layer_1.width/2, layer_1.height/2, 0, 0);
    system.add(planet_3);
    sun.add_to_orbit(planet_3, 1000);

    let planet_4 = new SpaceObject(planet_mass, 10, layer_1.width/2, layer_1.height/2, 0, 0);
    system.add(planet_4);
    sun.add_to_orbit(planet_4, 1200);

    let planet_5 = new SpaceObject(planet_mass, 10, layer_1.width/2, layer_1.height/2, 0, 0);
    system.add(planet_5);
    sun.add_to_orbit(planet_5, 1300);

    let planet_6 = new SpaceObject(planet_mass, 10, layer_1.width/2, layer_1.height/2, 0, 0);
    system.add(planet_6);
    sun.add_to_orbit(planet_6, 1100);


    //add 3 more planet
    let planet_7 = new SpaceObjectWithImage(planet_mass , 10, layer_1.width/2, layer_1.height/2, 0, 0, "images/assets/star7.png");
    system.add(planet_7);
    sun.add_to_orbit(planet_7, 1400);

    let planet_8 = new SpaceObjectWithImage(planet_mass , 10, layer_1.width/2, layer_1.height/2, 0, 0, "images/assets/star3.png");
    system.add(planet_8);
    sun.add_to_orbit(planet_8, 1500);

    let planet_9 = new SpaceObject(planet_mass, 10, layer_1.width/2, layer_1.height/2, 0, 0);
    system.add(planet_9);
    sun.add_to_orbit(planet_9, 1600);

    //add 3 more planet
    let planet_10 = new SpaceObjectWithImage(planet_mass , 10, layer_1.width/2, layer_1.height/2, 0, 0, "images/assets/star8.png");
    system.add(planet_10);
    sun.add_to_orbit(planet_10, 1700);

    let planet_11 = new SpaceObject(planet_mass, 10, layer_1.width/2, layer_1.height/2, 0, 0);
    system.add(planet_11);
    sun.add_to_orbit(planet_11, 1800);

    let planet_12 = new SpaceObject(planet_mass, 10, layer_1.width/2, layer_1.height/2, 0, 0);
    system.add(planet_12);
    sun.add_to_orbit(planet_12, 1900);

}

solar(window.innerWidth/2, window.innerHeight/2)
solar(2500,2500)
solar(4000,4000)
//solar(1000,1000)
//solar(4000,1000)
//solar(5000,2000)
solar(4000,5500)
solar(1000,5000)
player = new SpaceObjectPlayer(0.0000000000001, 5, layer_1.width/2, layer_1.height/2, 0, 0, 'images/blockman_head.png');
player.destroyer = true;
system.add(player);
//sun.add_to_orbit(player, 1000);





//predict Trajectories
//system.predict();


//Class that handle rendering layer-1 and layer-2 to game_frame with viewport
class Viewport {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.scale = 1;

        //load game_frame canvas
        this.game_frame = document.getElementById('game_frame');
        this.game_frame_ctx = this.game_frame.getContext('2d');

        //set game_frame to window size
        this.game_frame.width = window.innerWidth;
        this.game_frame.height = window.innerHeight;
    }

    //render viewport tracking player
    update_2() {
        this.game_frame_ctx.clearRect(0, 0, this.game_frame.width, this.game_frame.height);
        this.game_frame_ctx.drawImage(layer_1, player.x - this.width / 2, player.y - this.height / 2, this.width, this.height, 0, 0, this.width, this.height);
        this.game_frame_ctx.drawImage(layer_2, player.x - this.width / 2, player.y - this.height / 2, this.width, this.height, 0, 0, this.width, this.height);
    }

    //render viewport tracking player scalable
    update() {
        this.game_frame_ctx.clearRect(0, 0, this.game_frame.width, this.game_frame.height);
        this.game_frame_ctx.drawImage(layer_2, player.x - this.width / 2 / this.scale, player.y - this.height / 2 / this.scale, this.width / this.scale, this.height / this.scale, 0, 0, this.width, this.height);
        this.game_frame_ctx.drawImage(layer_1, player.x - this.width / 2 / this.scale, player.y - this.height / 2 / this.scale, this.width / this.scale, this.height / this.scale, 0, 0, this.width, this.height);
        //layer 3
        this.game_frame_ctx.drawImage(layer_3, player.x - this.width / 2 / this.scale, player.y - this.height / 2 / this.scale, this.width / this.scale, this.height / this.scale, 0, 0, this.width, this.height);
        //document.getElementById('canva_holder')
        //document.getElementById('canva_holder').style.backgroundImage = "images/ezgif-4-384e5fa5d9.webp";
        //display webp to canvas (images/ezgif-4-384e5fa5d9.webp)
        document.getElementById('canva_holder').style.backgroundImage = "url('images/image0.jpg')";
        document.getElementById('canva_holder').style.backgroundSize = "cover";
        document.getElementById('canva_holder').style.backgroundRepeat = "no-repeat";
        document.getElementById('canva_holder').style.backgroundPosition = "center";
    }
}


viewport = new Viewport()
let pred_worker = new Worker('js/predict.js');
system.predict(precit_count);
//run simulation
let i = 0;
function run() {

    //clear canvas
    //system.simulate();
    system.simulate_object_followed_predicted_trajectory()

    //predict Trajectories every five i
    if (i % 50 == 0) {
        //create new worker that predict next 500 move
        //create data to send to worker
        /*
        let data = []
        for (let i = 0; i < system.objects.length; i++) {
            data.push(system.objects[i].get_predict_data())
        }
        pred_worker.postMessage(data,n);
        */
        //system.new_predict(5000)
        system.predict(precit_count);
        //worker run prediction
    }
    i+=1;
    system.draw();
    viewport.update()
}
console.log(system.objects.length)


//detect user clicking position in canvas
let mouse = {
    x: 0,
    y: 0
}
/*
document.getElementById("game_frame").addEventListener('click', function (event) {
    console.log("asdsd")
    mouse.x = event.offsetX;
    mouse.y = event.offsetY;
    
    //create div contain user input about properties of new object
    let div = document.createElement('div');
    //set dov id to new_object
    div.id = 'new_object';
    div.style.position = 'absolute';
    div.style.left = mouse.x + 50 + 'px';
    div.style.top = mouse.y + 50 + 'px';
    div.style.width = '200px';
    div.style.height = '200px';
    div.style.backgroundColor = 'white';
    div.style.border = '1px solid black';
    div.style.zIndex = '100';

    //create input for mass
    let mass_input = document.createElement('input');
    mass_input.type = 'number';
    mass_input.value = 100;
    mass_input.style.width = '100px';
    mass_input.style.height = '20px';
    mass_input.style.margin = '10px';
    mass_input.style.marginLeft = '50px';
    mass_input.style.marginTop = '10px';
    mass_input.style.border = '1px solid black';

    //create input for radius
    let radius_input = document.createElement('input');
    radius_input.type = 'number';
    radius_input.value = 10;
    radius_input.style.width = '100px';
    radius_input.style.height = '20px';
    radius_input.style.margin = '10px';
    radius_input.style.marginLeft = '50px';
    radius_input.style.marginTop = '10px';
    radius_input.style.border = '1px solid black';

    //create input for velocity_x
    let velocity_x_input = document.createElement('input');
    velocity_x_input.type = 'number';
    velocity_x_input.value = 0;
    velocity_x_input.style.width = '100px';
    velocity_x_input.style.height = '20px';
    velocity_x_input.style.margin = '10px';
    velocity_x_input.style.marginLeft = '50px';
    velocity_x_input.style.marginTop = '10px';
    velocity_x_input.style.border = '1px solid black';

    //create input for velocity_y
    let velocity_y_input = document.createElement('input');
    velocity_y_input.type = 'number';
    velocity_y_input.value = 0;
    velocity_y_input.style.width = '100px';
    velocity_y_input.style.height = '20px';
    velocity_y_input.style.margin = '10px';
    velocity_y_input.style.marginLeft = '50px';
    velocity_y_input.style.marginTop = '10px';
    velocity_y_input.style.border = '1px solid black';
    
    //create button to create new object
    let button = document.createElement('button');
    button.style.width = '100px';
    button.style.height = '20px';
    button.style.margin = '10px';
    button.style.marginLeft = '50px';
    button.style.marginTop = '10px';
    button.style.border = '1px solid black';
    button.innerHTML = 'Create';
    button.addEventListener('click', function () {
        //create new object
        system.add(new SpaceObject(mass_input.value, radius_input.value,mouse.x, mouse.y, velocity_x_input.value, velocity_y_input.value));
        system.predict(100);
        //remove div
        div.remove();
    })

    //add all element to div
    div.appendChild(mass_input);
    div.appendChild(radius_input);
    div.appendChild(velocity_x_input);
    div.appendChild(velocity_y_input);
    div.appendChild(button);
    //add div to body
    document.body.appendChild(div);
})*/

//create zoom level indicator display on screen top right
let zoom_level = document.createElement('div');
zoom_level.id = 'zoom_level';
zoom_level.innerText = 'Zoom Level: ' + viewport.scale;
zoom_level.style.position = 'absolute';
zoom_level.style.right = '20px';
zoom_level.style.top = '10px';
//white font
zoom_level.style.color = 'white';

//change font size
zoom_level.style.fontSize = '40px';

//background not transparent
zoom_level.style.backgroundColor = 'rgba(0,0,0,1)';

//add zoom level indicator to body
document.body.appendChild(zoom_level);

//add speed indicator to body
let speed_indicator = document.createElement('div');
speed_indicator.id = 'speed_indicator';
speed_indicator.innerText = 'Power: ' + player_speed;
speed_indicator.style.position = 'absolute';
speed_indicator.style.right = '20px';
speed_indicator.style.top = '60px';
//white font
speed_indicator.style.color = 'white';

//change font size
speed_indicator.style.fontSize = '40px';

//add speed indicator to body
document.body.appendChild(speed_indicator);

class PlanetThemeData {
    constructor(src) {
        this.src = src;
        //if src is color
        if (src[0] == '#' || src[0] == 'r') {
            this.color = true;
        }
        else {
            this.color = false;
        }
    }
}

let planet_theme = new PlanetThemeData('https://cdngarenanow-a.akamaihd.net/webth/cdn/garena/gamertocoder/bedwars/logo.png');



//add vertical button on screen
let vertical_button = document.createElement('button');
vertical_button.id = 'vertical_button';
vertical_button.innerText = 'stats';
vertical_button.style.position = 'absolute';

//rotate button
vertical_button.style.transform = 'rotate(90deg)';

//set button position on center right
vertical_button.style.right = '-30px';
vertical_button.style.top = '50%';

vertical_button.style.zIndex = '100';

//change font size
vertical_button.style.fontSize = '40px';

//add vertical button to body
document.body.appendChild(vertical_button);


//create stats tab
let stats_tab = document.createElement('div');
stats_tab.id = 'stats_tab';
stats_tab.style.position = 'absolute';
stats_tab.style.right = '0%';
stats_tab.style.top = '25%';
stats_tab.style.width = '20%';
stats_tab.style.height = '60%';
stats_tab.style.backgroundColor = 'white';
stats_tab.style.border = '1px solid black';
stats_tab.style.zIndex = '99';

//add tab to body
document.body.appendChild(stats_tab);

//hide stats tab



//when clicking vertical button expand or collapse stats tab
vertical_button.addEventListener('click', function () {
    if (stats_tab.style.display == 'none') {
        play_confirm_sound();
        stats_tab.style.display = 'block';
    } else {
        play_cancle_sound();
        stats_tab.style.display = 'none';
}
}
)

//create grid to handle 4 graphs
let grid = document.createElement('div');
grid.id = 'grid';
grid.style.display = 'grid';
grid.style.gridTemplateColumns = '1fr 1fr';
grid.style.gridTemplateRows = '1fr 1fr';
grid.style.width = '100%';
grid.style.height = '50%';
grid.style.margin = '0px';
grid.style.padding = '0px';

//add grid to stats tab
stats_tab.appendChild(grid);


//create position x graph in stats tab
let position_x_graph = document.createElement('canvas');
position_x_graph.id = 'position_x_graph';
position_x_graph.style.width = '100%';
position_x_graph.style.height = '100%';
position_x_graph.style.border = '1px solid black';
//add position x graph to grid
grid.appendChild(position_x_graph);

//create position y graph in stats tab
let position_y_graph = document.createElement('canvas');
position_y_graph.id = 'position_y_graph';
position_y_graph.style.width = '100%';
position_y_graph.style.height = '100%';
position_y_graph.style.border = '1px solid black';

//add position y graph to grid
grid.appendChild(position_y_graph);


//create speed x graph in stats tab
let speed_x_graph = document.createElement('canvas');
speed_x_graph.id = 'speed_x_graph';
speed_x_graph.style.width = '100%';
speed_x_graph.style.height = '100%';
speed_x_graph.style.border = '1px solid black';

//add speed x graph to grid
grid.appendChild(speed_x_graph);

//create speed y graph in stats tab
let speed_y_graph = document.createElement('canvas');
speed_y_graph.id = 'speed_y_graph';
speed_y_graph.style.width = '100%';
speed_y_graph.style.height = '100%';
speed_y_graph.style.border = '1px solid black';

//add speed y graph to grid
grid.appendChild(speed_y_graph);

//create menu button
let menu_button = document.createElement('button');
menu_button.id = 'menu_button';
menu_button.innerHTML = '<i class="fa fa-home"></i>';
menu_button.style.position = 'absolute';
menu_button.style.left = '10px';
menu_button.style.top = '10px';
menu_button.style.width = '64.5px';
menu_button.style.height = '52px';
menu_button.style.fontSize = '40px';

//on click
menu_button.addEventListener('click', function () {
    window.location.href = 'index.html';
})

//add menu button to body
document.body.appendChild(menu_button);

//create pause button
let pause_button = document.createElement('button');
pause_button.id = 'pause_button';
pause_button.innerHTML = '<i class="fa fa-pause"></i>';
pause_button.style.position = 'absolute';
pause_button.style.left = '74.5px';
pause_button.style.top = '10px';

//set pause_button to expand
pause_button.style.width = '64.5px';
pause_button.style.height = '52px';

//change font size
pause_button.style.fontSize = '40px';

//bind pause function to button
let paused = false;
pause_button.addEventListener('click', function () {
    paused = !paused;
    if (paused) {
        pause_button.innerHTML = '<i class="fa fa-play"></i>';
    }
    else {
        pause_button.innerHTML = '<i class="fa fa-pause"></i>';
    }
}
)
//add pause button to body
document.body.appendChild(pause_button);


let graph_y_data = []
let graph_x_data = []
let graph_x_speed_data = []
let graph_y_speed_data = []

const speed_graph_scale = 0.015
const speed_graph_intercept = 40

//function that update position x graph
function update_position_x_graph(new_x) {

    //get canvas context
    let ctx = position_x_graph.getContext('2d');

    //clear canvas
    ctx.clearRect(0, 0, position_x_graph.width, position_x_graph.height);

    //add new x to graph data
    graph_x_data.push(new_x);

    //if graph data is more than 1000 remove first element
    if (graph_x_data.length > position_x_graph.width) {
        graph_x_data.shift();
    }

    //draw scaled graph max 7000 min 0
    for (let i = 0; i < graph_x_data.length-2; i++) {
        ctx.fillRect(i, graph_x_data[i]/7000*position_x_graph.height, 1, 1);
    }

    //show value at top left
    //set text font
    ctx.font = '30px Arial';
    ctx.fillText(`x: ${new_x.toFixed(2)}`, 10, 30);
}

//function that update position y graph
function update_position_y_graph(new_y) {
    
    //get canvas context
    let ctx = position_y_graph.getContext('2d');

    //clear canvas
    ctx.clearRect(0, 0, position_y_graph.width, position_y_graph.height);

    //add new y to graph data
    graph_y_data.push(new_y);

    //if graph data is more than 1000 remove first element
    if (graph_y_data.length > position_y_graph.width) {
        graph_y_data.shift();
    }

    //draw scaled graph max 7000 min 0
    for (let i = 0; i < graph_y_data.length-2; i++) {
        ctx.fillRect(i, graph_y_data[i]/7000*position_y_graph.height, 1, 1);
    }

    //show value at top left
    //set text font
    ctx.font = '30px Arial';
    ctx.fillText(`y: ${new_y.toFixed(2)}`, 10, 30);
    
}

//function that update speed x graph
function update_speed_x_graph(new_speed_x) {
    //get canvas context
    let ctx = speed_x_graph.getContext('2d');

    //clear canvas
    ctx.clearRect(0, 0, speed_x_graph.width, speed_x_graph.height);

    //add new speed x to graph data
    graph_x_speed_data.push(new_speed_x);

    //if graph data is more than 1000 remove first element
    if (graph_x_speed_data.length > speed_y_graph.width) {
        graph_x_speed_data.shift();
    }

    //draw scaled graph max 7000 min 0
    for (let i = 0; i < graph_x_speed_data.length; i++) {
        ctx.fillRect(i, (graph_x_speed_data[i]+speed_graph_intercept)*speed_graph_scale*speed_x_graph.height, 1, 1);
    }

    //show value at top left
    //set text font
    ctx.font = '30px Arial';
    let speed = (graph_x_data[graph_x_data.length-1]-graph_x_data[graph_x_data.length-20]).toFixed(2);
    ctx.fillText(`Vx: ${speed}`, 10, 30);

}

//function that update y speed graph
function update_speed_y_graph(new_speed_y) {
    new_speed_y *= simspeed/100
    //get canvas context
    let ctx = speed_y_graph.getContext('2d');

    //clear canvas
    ctx.clearRect(0, 0, speed_y_graph.width, speed_y_graph.height);

    //add new speed y to graph data
    graph_y_speed_data.push(new_speed_y);

    //if graph data is more than 1000 remove first element
    if (graph_y_speed_data.length > speed_y_graph.width) {
        graph_y_speed_data.shift();
    }

    //draw scaled graph max 7000 min 0
    for (let i = 0; i < graph_y_speed_data.length; i++) {
        ctx.fillRect(i, (graph_y_speed_data[i]+speed_graph_intercept)*speed_graph_scale*speed_y_graph.height, 1, 1);
    }

    //show value at top left
    //set text font
    ctx.font = '30px Arial';
    let speed = (graph_y_data[graph_y_data.length-1]-graph_y_data[graph_y_data.length-20]).toFixed(2)
    ctx.fillText(`Vy: ${speed}`, 10, 30);
}

//create canva for showing player's force angle
let force_angle_canvas = document.createElement('canvas');
force_angle_canvas.id = 'force_angle_canvas';
force_angle_canvas.style.width = '100%';
force_angle_canvas.style.height = '50%';
force_angle_canvas.style.border = '1px solid black';

//add force angle canvas to grid
stats_tab.appendChild(force_angle_canvas);

//function to update force angle canvas
function update_force_angle_canvas(angle) {
    
    //create compass
    let ctx = force_angle_canvas.getContext('2d');

    //create arrow point at angle
    ctx.clearRect(0, 0, force_angle_canvas.width, force_angle_canvas.height);
    ctx.beginPath();
    ctx.moveTo(force_angle_canvas.width/2, force_angle_canvas.height/2);
    ctx.lineTo(force_angle_canvas.width/2+Math.cos(angle)*force_angle_canvas.width/2, force_angle_canvas.height/2+Math.sin(angle)*force_angle_canvas.height/2);
    ctx.stroke();

    //create angle number
    ctx.font = '15px Arial';
    //convert 2atan to degrees
    angle = (angle*180/Math.PI)+90;

    if (angle < 0) {
        angle += 360;
    }
    ctx.fillText(`Force Direction: ${angle.toFixed(2)}°`, 5, 15);
}

//function to convert atan2 angle to degrees


//remove scroll bar
document.body.style.overflow = 'hidden';

//create vertical button for god mode above stats button click to expand and show tools (the same size as stats button)
let god_mode_button = document.createElement('button');
god_mode_button.id = 'vertical_button';
god_mode_button.innerText = 'Setting Tool';
god_mode_button.style.position = 'absolute';

//rotate button
god_mode_button.style.transform = 'rotate(90deg)';

god_mode_button.style.left = '-60px';
god_mode_button.style.top = '65%';

god_mode_button.style.zIndex = '100';

//change font size
god_mode_button.style.fontSize = '30px';

//add button to body
document.body.appendChild(god_mode_button);

//god tools tab contain 4 block each block contail label and text input
let god_tools_tab = document.createElement('div');
god_tools_tab.id = 'god_tools_tab';
god_tools_tab.style.position = 'absolute';
god_tools_tab.style.left = '0%';
god_tools_tab.style.top = '30%';
god_tools_tab.style.width = '20%';
god_tools_tab.style.height = '70%';
god_tools_tab.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

//hide god tools tab
god_tools_tab.style.display = 'none';

//add god tools tab to body
document.body.appendChild(god_tools_tab);

function reset_all_switch(){
    //set all button background to white
    add_mode_button.style.backgroundColor = 'white';
    delete_mode_button.style.backgroundColor = 'white';
}

//bind god mode button to show god tools tab
god_mode_button.onclick = function() {
    if (god_tools_tab.style.display == 'none') {
        god_tools_tab.style.display = 'block';
        play_confirm_sound();
        //switch god tool to planet tool
                //set right to -2% and red color
        //god_mode_button.style.right = '0%';
        //god_mode_button.style.color = 'red';
        //reset_all_switch()
        //add_mode_button.style.backgroundColor = 'green';
        god_mode_button.style.backgroundColor = 'red';
        //shift planet tool to left
        god_mode_button.style.left = '-90px';
        //switch_god_tool_tab(1);

    } else {
        play_cancle_sound();
        //god_mode_button.style.right = '0%';
        //god_mode_button.style.color = 'black';
        god_mode_button.style.backgroundColor = 'white';
        //shift planet tool to right
        god_mode_button.style.left = '-60px';
        //reset_all_switch()
        god_tools_tab.style.display = 'none';
        //switch_god_tool_tab(0);
    }
}

//add 3 tabs change button on top of god tools tab
let god_tools_tab_change_button = document.createElement('div');
god_tools_tab_change_button.id = 'god_tools_tab_change_button';
god_tools_tab_change_button.style.position = 'absolute';
god_tools_tab_change_button.style.left = '0%';
god_tools_tab_change_button.style.top = '0%';
god_tools_tab_change_button.style.width = '100%';
god_tools_tab_change_button.style.height = '10%';
god_tools_tab_change_button.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
god_tools_tab_change_button.style.display = 'flex';
god_tools_tab_change_button.style.flexDirection = 'row';

//add god tools tab change button to god tools tab
god_tools_tab.appendChild(god_tools_tab_change_button);

//add 3 buttons to god tools tab change button
let god_tools_tab_change_button_1 = document.createElement('button');
god_tools_tab_change_button_1.id = 'god_tools_tab_change_button_1';
god_tools_tab_change_button_1.innerText = 'Planet Creation Setting';
god_tools_tab_change_button_1.style.width = '100%';
god_tools_tab_change_button_1.style.height = '100%';
god_tools_tab_change_button_1.style.border = 'none';
god_tools_tab_change_button_1.style.fontSize = '20px';
//set font to bold
god_tools_tab_change_button_1.style.fontWeight = 'bold';
//set selected color to blue
god_tools_tab_change_button_1.style.backgroundColor = 'rgba(255, 255, 255, 1)';
//border
god_tools_tab_change_button_1.style.border = '2px solid black';


//add button to god tools tab change button
god_tools_tab_change_button.appendChild(god_tools_tab_change_button_1);

let god_tools_tab_change_button_2 = document.createElement('button');
god_tools_tab_change_button_2.id = 'god_tools_tab_change_button_2';
god_tools_tab_change_button_2.innerText = 'Delete';
god_tools_tab_change_button_2.style.width = '33%';
god_tools_tab_change_button_2.style.height = '100%';
god_tools_tab_change_button_2.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
god_tools_tab_change_button_2.style.color = 'white';
god_tools_tab_change_button_2.style.border = 'none';
god_tools_tab_change_button_2.style.fontSize = '20px';

//add button to god tools tab change button
//god_tools_tab_change_button.appendChild(god_tools_tab_change_button_2);

let god_tools_tab_change_button_3 = document.createElement('button');
god_tools_tab_change_button_3.id = 'god_tools_tab_change_button_3';
god_tools_tab_change_button_3.innerText = 'View';
god_tools_tab_change_button_3.style.width = '33%';
god_tools_tab_change_button_3.style.height = '100%';
god_tools_tab_change_button_3.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
god_tools_tab_change_button_3.style.color = 'white';
god_tools_tab_change_button_3.style.border = 'none';
god_tools_tab_change_button_3.style.fontSize = '20px';

//add button to god tools tab change button
//god_tools_tab_change_button.appendChild(god_tools_tab_change_button_3);

//add 3 tabs to god tools tab
let god_tools_tab_1 = document.createElement('div');
god_tools_tab_1.id = 'god_tools_tab_1';
god_tools_tab_1.style.position = 'absolute';
god_tools_tab_1.style.left = '0%';
god_tools_tab_1.style.top = '10%';
god_tools_tab_1.style.width = '100%';
god_tools_tab_1.style.height = '90%';
god_tools_tab_1.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

//add god tools tab 1 to god tools tab
god_tools_tab.appendChild(god_tools_tab_1);

//add mass label and mass input inthe same line
let god_tools_tab_1_mass = document.createElement('div');
god_tools_tab_1_mass.id = 'god_tools_tab_1_mass';
god_tools_tab_1_mass.style.width = '100%';
god_tools_tab_1_mass.style.height = '10%';
god_tools_tab_1_mass.style.display = 'flex';
god_tools_tab_1_mass.style.flexDirection = 'row';

//add mass label and mass input in the same line to god tools tab 1
god_tools_tab_1.appendChild(god_tools_tab_1_mass);

let god_tools_tab_1_mass_label = document.createElement('label');
god_tools_tab_1_mass_label.id = 'god_tools_tab_1_mass_label';
god_tools_tab_1_mass_label.innerText = 'Mass: ';
god_tools_tab_1_mass_label.style.width = '50%';
god_tools_tab_1_mass_label.style.height = '100%';
god_tools_tab_1_mass_label.style.display = 'flex';
god_tools_tab_1_mass_label.style.alignItems = 'center';
god_tools_tab_1_mass_label.style.justifyContent = 'center';
god_tools_tab_1_mass_label.style.fontSize = '20px';
//set font color to white
god_tools_tab_1_mass_label.style.color = 'white';

//add mass label to mass label and mass input in the same line
god_tools_tab_1_mass.appendChild(god_tools_tab_1_mass_label);

let god_tools_tab_1_mass_input = document.createElement('input');
god_tools_tab_1_mass_input.id = 'god_tools_tab_1_mass_input';
god_tools_tab_1_mass_input.type = 'number';
god_tools_tab_1_mass_input.style.width = '50%';
god_tools_tab_1_mass_input.style.height = '100%';
god_tools_tab_1_mass_input.style.fontSize = '20px';
god_tools_tab_1_mass_input.value = 10000;

//add mass input to mass label and mass input in the same line
god_tools_tab_1_mass.appendChild(god_tools_tab_1_mass_input);

//add radius label and radius input in the same line below mass
let god_tools_tab_1_radius = document.createElement('div');
god_tools_tab_1_radius.id = 'god_tools_tab_1_radius';
god_tools_tab_1_radius.style.width = '100%';
god_tools_tab_1_radius.style.height = '10%';
god_tools_tab_1_radius.style.display = 'flex';
god_tools_tab_1_radius.style.flexDirection = 'row';

//add radius label and radius input in the same line below mass to god tools tab 1
god_tools_tab_1.appendChild(god_tools_tab_1_radius);

let god_tools_tab_1_radius_label = document.createElement('label');
god_tools_tab_1_radius_label.id = 'god_tools_tab_1_radius_label';
god_tools_tab_1_radius_label.innerText = 'Radius: ';
god_tools_tab_1_radius_label.style.width = '50%';
god_tools_tab_1_radius_label.style.height = '100%';
god_tools_tab_1_radius_label.style.display = 'flex';
god_tools_tab_1_radius_label.style.alignItems = 'center';
god_tools_tab_1_radius_label.style.justifyContent = 'center';
god_tools_tab_1_radius_label.style.fontSize = '20px';
//set font color to white
god_tools_tab_1_radius_label.style.color = 'white';

//add radius label to radius label and radius input in the same line
god_tools_tab_1_radius.appendChild(god_tools_tab_1_radius_label);

let god_tools_tab_1_radius_input = document.createElement('input');
god_tools_tab_1_radius_input.id = 'god_tools_tab_1_radius_input';
god_tools_tab_1_radius_input.type = 'number';
god_tools_tab_1_radius_input.style.width = '50%';
god_tools_tab_1_radius_input.style.height = '100%';
god_tools_tab_1_radius_input.style.fontSize = '20px';
god_tools_tab_1_radius_input.value = 50;

//add radius input to radius label and radius input in the same line
god_tools_tab_1_radius.appendChild(god_tools_tab_1_radius_input);

//add if fixed label and if fixed input in the same line below radius
let god_tools_tab_1_if_fixed = document.createElement('div');
god_tools_tab_1_if_fixed.id = 'god_tools_tab_1_if_fixed';
god_tools_tab_1_if_fixed.style.width = '100%';
god_tools_tab_1_if_fixed.style.height = '10%';
god_tools_tab_1_if_fixed.style.display = 'flex';
god_tools_tab_1_if_fixed.style.flexDirection = 'row';

//add if fixed label and if fixed input in the same line below radius to god tools tab 1
god_tools_tab_1.appendChild(god_tools_tab_1_if_fixed);

let god_tools_tab_1_if_fixed_label = document.createElement('label');
god_tools_tab_1_if_fixed_label.id = 'god_tools_tab_1_if_fixed_label';
god_tools_tab_1_if_fixed_label.innerText = 'Fixed Position: ';
god_tools_tab_1_if_fixed_label.style.width = '50%';
god_tools_tab_1_if_fixed_label.style.height = '100%';
god_tools_tab_1_if_fixed_label.style.display = 'flex';
god_tools_tab_1_if_fixed_label.style.alignItems = 'center';
god_tools_tab_1_if_fixed_label.style.justifyContent = 'center';
god_tools_tab_1_if_fixed_label.style.fontSize = '20px';
//set font color to white
god_tools_tab_1_if_fixed_label.style.color = 'white';

//add if fixed label to if fixed label and if fixed input in the same line
god_tools_tab_1_if_fixed.appendChild(god_tools_tab_1_if_fixed_label);

let god_tools_tab_1_if_fixed_input = document.createElement('input');
god_tools_tab_1_if_fixed_input.id = 'god_tools_tab_1_if_fixed_input';
god_tools_tab_1_if_fixed_input.type = 'checkbox';
god_tools_tab_1_if_fixed_input.style.width = '10%';
god_tools_tab_1_if_fixed_input.style.height = '50%';
god_tools_tab_1_if_fixed_input.style.fontSize = '20px';
god_tools_tab_1_if_fixed_input.style.marginTop = '4%';
god_tools_tab_1_if_fixed_input.style.marginLeft = '17%';

//add if fixed input to if fixed label and if fixed input in the same line
god_tools_tab_1_if_fixed.appendChild(god_tools_tab_1_if_fixed_input);

//add If Destroyer label and If Destroyer fixed input in the same line below if fixed
let god_tools_tab_1_if_destroyer = document.createElement('div');
god_tools_tab_1_if_destroyer.id = 'god_tools_tab_1_if_destroyer';
god_tools_tab_1_if_destroyer.style.width = '100%';
god_tools_tab_1_if_destroyer.style.height = '10%';
god_tools_tab_1_if_destroyer.style.display = 'flex';
god_tools_tab_1_if_destroyer.style.flexDirection = 'row';

//add If Destroyer label and If Destroyer fixed input in the same line below if fixed to god tools tab 1
god_tools_tab_1.appendChild(god_tools_tab_1_if_destroyer);

let god_tools_tab_1_if_destroyer_label = document.createElement('label');
god_tools_tab_1_if_destroyer_label.id = 'god_tools_tab_1_if_destroyer_label';
god_tools_tab_1_if_destroyer_label.innerText = 'If Destroyer: ';
god_tools_tab_1_if_destroyer_label.style.width = '50%';
god_tools_tab_1_if_destroyer_label.style.height = '100%';
god_tools_tab_1_if_destroyer_label.style.display = 'flex';
god_tools_tab_1_if_destroyer_label.style.alignItems = 'center';
god_tools_tab_1_if_destroyer_label.style.justifyContent = 'center';
god_tools_tab_1_if_destroyer_label.style.fontSize = '20px';
//set font color to white
god_tools_tab_1_if_destroyer_label.style.color = 'white';

//add If Destroyer label to If Destroyer label and If Destroyer fixed input in the same line
god_tools_tab_1_if_destroyer.appendChild(god_tools_tab_1_if_destroyer_label);

let god_tools_tab_1_if_destroyer_input = document.createElement('input');
god_tools_tab_1_if_destroyer_input.id = 'god_tools_tab_1_if_destroyer_input';
god_tools_tab_1_if_destroyer_input.type = 'checkbox';
god_tools_tab_1_if_destroyer_input.style.width = '10%';
god_tools_tab_1_if_destroyer_input.style.height = '50%';
god_tools_tab_1_if_destroyer_input.style.fontSize = '20px';
god_tools_tab_1_if_destroyer_input.style.marginTop = '4%';
god_tools_tab_1_if_destroyer_input.style.marginLeft = '17%';
//checked
god_tools_tab_1_if_destroyer_input.checked = true;

//add If Destroyer input to If Destroyer label and If Destroyer fixed input in the same line
god_tools_tab_1_if_destroyer.appendChild(god_tools_tab_1_if_destroyer_input);

//if push if destroyer input





//add theme label
let god_tools_tab_1_theme_label = document.createElement('Button');
god_tools_tab_1_theme_label.id = 'god_tools_tab_1_theme_label';
god_tools_tab_1_theme_label.innerText = 'Theme: ';
god_tools_tab_1_theme_label.style.width = '100%';
god_tools_tab_1_theme_label.style.height = '10%';
god_tools_tab_1_theme_label.style.paddingLeft = '0%';

//add theme label to god tools tab 1
god_tools_tab_1.appendChild(god_tools_tab_1_theme_label);
//set font color to white
god_tools_tab_1_theme_label.style.color = 'black';
//set font size to 20px
god_tools_tab_1_theme_label.style.fontSize = '20px';
//bold
god_tools_tab_1_theme_label.style.fontWeight = 'bold';

//create image display
let god_tools_tab_1_theme_image = document.createElement('img');
god_tools_tab_1_theme_image.id = 'god_tools_tab_1_theme_image';
god_tools_tab_1_theme_image.src = 'https://cdngarenanow-a.akamaihd.net/webth/cdn/garena/gamertocoder/bmg-characters/blueguys_02.png';
god_tools_tab_1_theme_image.style.width = '50%';
god_tools_tab_1_theme_image.style.height = '25%';
god_tools_tab_1_theme_image.style.marginLeft = '0%';
god_tools_tab_1_theme_image.style.marginTop = '0%';
//white background
god_tools_tab_1_theme_image.style.backgroundColor = 'white';

//add image display to god tools tab 1
god_tools_tab_1.appendChild(god_tools_tab_1_theme_image);

//add text select on right of image display
let god_tools_tab_1_theme_text_select = document.createElement('select');
god_tools_tab_1_theme_text_select.id = 'god_tools_tab_1_theme_text_select';
//set absolute position
god_tools_tab_1_theme_text_select.style.position = 'absolute';
god_tools_tab_1_theme_text_select.style.width = '50%';
god_tools_tab_1_theme_text_select.style.height = '10%';
god_tools_tab_1_theme_text_select.style.marginLeft = '0%';
god_tools_tab_1_theme_text_select.style.marginTop = '0%';
god_tools_tab_1_theme_text_select.style.fontSize = '20px';
god_tools_tab_1_theme_text_select.style.backgroundColor = 'white';

//add text select on right of image display to god tools tab 1
god_tools_tab_1.appendChild(god_tools_tab_1_theme_text_select);

//add text options to text select
let god_tools_tab_1_theme_text_select_option_1 = document.createElement('option');
god_tools_tab_1_theme_text_select_option_1.innerText = 'From API';

//add text options to text select
let god_tools_tab_1_theme_text_select_option_2 = document.createElement('option');
god_tools_tab_1_theme_text_select_option_2.innerText = 'Img. URL';

//add text options to text select
let god_tools_tab_1_theme_text_select_option_3 = document.createElement('option');
god_tools_tab_1_theme_text_select_option_3.innerText = 'Local Img';

let god_tools_tab_1_theme_text_select_option_4 = document.createElement('option');
god_tools_tab_1_theme_text_select_option_4.innerText = 'Random Color';

let god_tools_tab_1_theme_text_select_option_5 = document.createElement('option');
god_tools_tab_1_theme_text_select_option_5.innerText = 'Pick Color';

let god_tools_tab_1_theme_text_select_option_6 = document.createElement('option');
god_tools_tab_1_theme_text_select_option_6.innerText = 'Game Asset';

//add option to text select
god_tools_tab_1_theme_text_select.appendChild(god_tools_tab_1_theme_text_select_option_1);
god_tools_tab_1_theme_text_select.appendChild(god_tools_tab_1_theme_text_select_option_2);
god_tools_tab_1_theme_text_select.appendChild(god_tools_tab_1_theme_text_select_option_3);
god_tools_tab_1_theme_text_select.appendChild(god_tools_tab_1_theme_text_select_option_4);
god_tools_tab_1_theme_text_select.appendChild(god_tools_tab_1_theme_text_select_option_5);
god_tools_tab_1_theme_text_select.appendChild(god_tools_tab_1_theme_text_select_option_6);


//add widget holder below selecter
let god_tools_tab_1_theme_widget_holder = document.createElement('div');
god_tools_tab_1_theme_widget_holder.id = 'god_tools_tab_1_theme_widget_holder';
//set absolute position
god_tools_tab_1_theme_widget_holder.style.position = 'absolute';
god_tools_tab_1_theme_widget_holder.style.width = '49%';
god_tools_tab_1_theme_widget_holder.style.height = '10%';
god_tools_tab_1_theme_widget_holder.style.marginTop = '-23%';
god_tools_tab_1_theme_widget_holder.style.marginLeft = '50%';
god_tools_tab_1_theme_widget_holder.style.backgroundColor = 'white';
//border
god_tools_tab_1_theme_widget_holder.style.border = '1px solid black';


//add widget holder below selecter to god tools tab 1
god_tools_tab_1.appendChild(god_tools_tab_1_theme_widget_holder);


async function pull_all_url_from_api(){
    let api_link = "https://gamertocoder.garena.co.th/api/minigame/"
    let i = 1
    let all_link = [];

    
    while (true){
        try{
            const response = await fetch(api_link+i)
            const data = await response.json()
            all_link.push([data.icon, data.name])
            i++;
        }
        catch{
            return all_link;
        }
    }
    return all_link;
}

const all_url = (pull_all_url_from_api().then((data) => {return data}))

console.log(all_url.then((data) => {return data}));

//on option selection
god_tools_tab_1_theme_text_select.onchange = function() {
    //if option 1 is selected
    if (god_tools_tab_1_theme_text_select.value == 'From API') {
        //hide widget holder
        //set image display to api image

        //create text selection box in widget holder
        let god_tools_tab_1_theme_widget_holder_text_select = document.createElement('select');
        god_tools_tab_1_theme_widget_holder_text_select.id = 'god_tools_tab_1_theme_widget_holder_text_select';
        god_tools_tab_1_theme_widget_holder_text_select.style.width = '100%';
        god_tools_tab_1_theme_widget_holder_text_select.style.height = '100%';
        god_tools_tab_1_theme_widget_holder_text_select.style.fontSize = '20px';
        god_tools_tab_1_theme_widget_holder_text_select.style.backgroundColor = 'white';
        

        all_url.then((data) => {
            //create op
            for (let i = 0; i < data.length; i++){
                let god_tools_tab_1_theme_widget_holder_text_select_option = document.createElement('option');
                //god_tools_tab_1_theme_widget_holder_text_select_option.innerText = "Noob";
                //set option text to url
                god_tools_tab_1_theme_widget_holder_text_select_option.label = data[i][1];
                //set option value to url
                god_tools_tab_1_theme_widget_holder_text_select_option.value = data[i][0];
                god_tools_tab_1_theme_widget_holder_text_select.appendChild(god_tools_tab_1_theme_widget_holder_text_select_option);
            }
            god_tools_tab_1_theme_image.src = data[0];
            planet_theme = new PlanetThemeData(god_tools_tab_1_theme_image.src)
        })
        //clear widget holder
        god_tools_tab_1_theme_widget_holder.innerHTML = '';

        //add text selection box to widget holder
        god_tools_tab_1_theme_widget_holder.appendChild(god_tools_tab_1_theme_widget_holder_text_select);

        //on text selection update image
        god_tools_tab_1_theme_widget_holder_text_select.onchange = function() {
            //update image
            //console.log("adssd")
            god_tools_tab_1_theme_image.src = god_tools_tab_1_theme_widget_holder_text_select.value;
            planet_theme = new PlanetThemeData(god_tools_tab_1_theme_widget_holder_text_select.value)
        }

    }
    //if option 2 is selected
    if (god_tools_tab_1_theme_text_select.value == 'Img. URL') {
        //clear widget holder
        god_tools_tab_1_theme_widget_holder.innerHTML = '';
        //add text input to div
        let god_tools_tab_1_theme_widget_holder_text_input = document.createElement('input');
        god_tools_tab_1_theme_widget_holder_text_input.id = 'god_tools_tab_1_theme_widget_holder_text_input';
        god_tools_tab_1_theme_widget_holder_text_input.style.width = '100%';
        god_tools_tab_1_theme_widget_holder_text_input.style.height = '100%';
        god_tools_tab_1_theme_widget_holder_text_input.style.fontSize = '20px';
        god_tools_tab_1_theme_widget_holder_text_input.style.backgroundColor = 'white';
        god_tools_tab_1_theme_widget_holder_text_input.style.border = 'none';
        god_tools_tab_1_theme_widget_holder_text_input.placeholder = 'Image URL';
        god_tools_tab_1_theme_widget_holder.appendChild(god_tools_tab_1_theme_widget_holder_text_input);

        //on text input change set image display src to url
        god_tools_tab_1_theme_widget_holder_text_input.onchange = function() {
            god_tools_tab_1_theme_image.src = god_tools_tab_1_theme_widget_holder_text_input.value;
            planet_theme = new PlanetThemeData(god_tools_tab_1_theme_image.src)
        }
    }

    //if option 3 is selected
    if (god_tools_tab_1_theme_text_select.value == 'Local Img') {
        //clear widget holder
        god_tools_tab_1_theme_widget_holder.innerHTML = '';
        //add file input to widget holder
        let god_tools_tab_1_theme_widget_holder_file_input = document.createElement('input');
        god_tools_tab_1_theme_widget_holder_file_input.id = 'god_tools_tab_1_theme_widget_holder_file_input';
        god_tools_tab_1_theme_widget_holder_file_input.type = 'file';
        god_tools_tab_1_theme_widget_holder_file_input.style.width = '100%';
        god_tools_tab_1_theme_widget_holder_file_input.style.height = '100%';
        god_tools_tab_1_theme_widget_holder_file_input.style.fontSize = '20px';
        god_tools_tab_1_theme_widget_holder_file_input.style.backgroundColor = 'white';
        god_tools_tab_1_theme_widget_holder_file_input.style.border = 'none';
        god_tools_tab_1_theme_widget_holder.appendChild(god_tools_tab_1_theme_widget_holder_file_input);

        //on file input change set image display src to url
        god_tools_tab_1_theme_widget_holder_file_input.onchange = function() {
            god_tools_tab_1_theme_image.src = URL.createObjectURL(god_tools_tab_1_theme_widget_holder_file_input.files[0]);
            planet_theme = new PlanetThemeData(god_tools_tab_1_theme_image.src)
        }
    }

    //if option 4 is selected
    if (god_tools_tab_1_theme_text_select.value == 'Pick Color') {
        //clear widget holder
        god_tools_tab_1_theme_widget_holder.innerHTML = '';
        god_tools_tab_1_theme_image.src = "";
        god_tools_tab_1_theme_image.style.backgroundColor = "red";
        planet_theme = new PlanetThemeData("red")

        //add color picker to widget holder
        let god_tools_tab_1_theme_widget_holder_color_picker = document.createElement('input');
        god_tools_tab_1_theme_widget_holder_color_picker.id = 'god_tools_tab_1_theme_widget_holder_color_picker';
        god_tools_tab_1_theme_widget_holder_color_picker.type = 'color';
        god_tools_tab_1_theme_widget_holder_color_picker.style.width = '100%';
        god_tools_tab_1_theme_widget_holder_color_picker.style.height = '100%';
        god_tools_tab_1_theme_widget_holder_color_picker.style.fontSize = '20px';
        god_tools_tab_1_theme_widget_holder_color_picker.style.backgroundColor = 'white';
        god_tools_tab_1_theme_widget_holder_color_picker.style.border = 'none';
        //set value to red
        god_tools_tab_1_theme_widget_holder_color_picker.value = '#ff0000';
        god_tools_tab_1_theme_widget_holder.appendChild(god_tools_tab_1_theme_widget_holder_color_picker);

        //on color picker change set image display src to url
        god_tools_tab_1_theme_widget_holder_color_picker.onchange = function() {
            //console.log(god_tools_tab_1_theme_widget_holder_color_picker.value);
            god_tools_tab_1_theme_image.style.backgroundColor = god_tools_tab_1_theme_widget_holder_color_picker.value;
            god_tools_tab_1_theme_image.src = god_tools_tab_1_theme_image.style.backgroundColor;
            planet_theme = new PlanetThemeData(god_tools_tab_1_theme_widget_holder_color_picker.value)
            god_tools_tab_1_theme_image.style.opacity = 1;
        }
    }

    //if option Random Color
    if (god_tools_tab_1_theme_text_select.value == 'Random Color') {
        //clear widget holder
        god_tools_tab_1_theme_widget_holder.innerHTML = '';
        god_tools_tab_1_theme_image.src = "";
        god_tools_tab_1_theme_image.style.backgroundColor = "red";
        planet_theme = new PlanetThemeData("red")

        //add button
        let god_tools_tab_1_theme_widget_holder_button = document.createElement('button');
        god_tools_tab_1_theme_widget_holder_button.id = 'god_tools_tab_1_theme_widget_holder_button';
        god_tools_tab_1_theme_widget_holder_button.style.width = '100%';
        god_tools_tab_1_theme_widget_holder_button.style.height = '100%';
        god_tools_tab_1_theme_widget_holder_button.style.fontSize = '20px';
        god_tools_tab_1_theme_widget_holder_button.style.backgroundColor = 'white';
        god_tools_tab_1_theme_widget_holder_button.style.border = 'none';
        god_tools_tab_1_theme_widget_holder_button.innerHTML = 'Randomize';
        god_tools_tab_1_theme_widget_holder.appendChild(god_tools_tab_1_theme_widget_holder_button);

        //on button click set image display src to url
        god_tools_tab_1_theme_widget_holder_button.onclick = function() {
            //set color to random
            //god_tools_tab_1_theme_image.src = "";
            god_tools_tab_1_theme_image.style.backgroundColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
            god_tools_tab_1_theme_image.src = god_tools_tab_1_theme_image.style.backgroundColor;
            //set image to transparent
            planet_theme = new PlanetThemeData(god_tools_tab_1_theme_image.style.backgroundColor)
            god_tools_tab_1_theme_image.style.opacity = 1;
        }
    }
    //select Game Asset
    if (god_tools_tab_1_theme_text_select.value == 'Game Asset') {
        //loop for all file name images/assets folder
        //create text select
        let god_tools_tab_1_theme_widget_holder_text_select_game_asset = document.createElement('select');
        god_tools_tab_1_theme_widget_holder_text_select_game_asset.style.width = '100%';
        god_tools_tab_1_theme_widget_holder_text_select_game_asset.style.height = '100%';
        god_tools_tab_1_theme_widget_holder_text_select_game_asset.style.fontSize = '20px';
        god_tools_tab_1_theme_widget_holder_text_select_game_asset.style.backgroundColor = 'white';
        god_tools_tab_1_theme_widget_holder_text_select_game_asset.style.border = 'none';
        //create text option for each file name
        for (let i = 0; i < game_assets.length; i++) {
            let god_tools_tab_1_theme_text_option = document.createElement('option');
            god_tools_tab_1_theme_text_option.innerHTML = game_assets[i];
            god_tools_tab_1_theme_widget_holder_text_select_game_asset.appendChild(god_tools_tab_1_theme_text_option);
        }

        //add text select to widget holder
        god_tools_tab_1_theme_widget_holder.innerHTML = '';
        god_tools_tab_1_theme_widget_holder.appendChild(god_tools_tab_1_theme_widget_holder_text_select_game_asset);

        //change image of theme to selected game asset
        god_tools_tab_1_theme_widget_holder_text_select_game_asset.onchange = function() {
            god_tools_tab_1_theme_image.src = 'images/assets/' + god_tools_tab_1_theme_widget_holder_text_select_game_asset.value + '.png';
            planet_theme = new PlanetThemeData(god_tools_tab_1_theme_image.src)
        }


    }
}

let god_tools_tab_1_theme_widget_holder_text_select = document.createElement('select');
god_tools_tab_1_theme_widget_holder_text_select.id = 'god_tools_tab_1_theme_widget_holder_text_select';
god_tools_tab_1_theme_widget_holder_text_select.style.width = '100%';
god_tools_tab_1_theme_widget_holder_text_select.style.height = '100%';
god_tools_tab_1_theme_widget_holder_text_select.style.fontSize = '20px';
god_tools_tab_1_theme_widget_holder_text_select.style.backgroundColor = 'white';


all_url.then((data) => {
    //create op
    for (let i = 0; i < data.length; i++){
        let god_tools_tab_1_theme_widget_holder_text_select_option = document.createElement('option');
        //god_tools_tab_1_theme_widget_holder_text_select_option.innerText = "Noob";
        //set option text to url
        god_tools_tab_1_theme_widget_holder_text_select_option.label = data[i][1];
                //set option value to url
        god_tools_tab_1_theme_widget_holder_text_select_option.value = data[i][0];
        god_tools_tab_1_theme_widget_holder_text_select.appendChild(god_tools_tab_1_theme_widget_holder_text_select_option);
    }
    god_tools_tab_1_theme_image.src = data[0][0];
})
//clear widget holder
god_tools_tab_1_theme_widget_holder.innerHTML = '';

//add text selection box to widget holder
god_tools_tab_1_theme_widget_holder.appendChild(god_tools_tab_1_theme_widget_holder_text_select);

//on text selection update image
god_tools_tab_1_theme_widget_holder_text_select.onchange = function() {
    //update image
    //console.log("adssd")
    god_tools_tab_1_theme_image.src = god_tools_tab_1_theme_widget_holder_text_select.value;
    planet_theme = new PlanetThemeData(god_tools_tab_1_theme_image.src)
}



let current_god_tool_tab = 0;
let current_tab;
//calculate the position of the mouse point in main_canva to layer1
function get_mouse_position(event) {
    let rect = main_canva.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    //transform player coordinate to main_canva coordinate
    let x_scaled = player.x + (x - main_canva.width / 2)/viewport.scale
    let y_scaled = player.y + (y - main_canva.height / 2)/viewport.scale

    //convert to layer1 coordinate

    return [x_scaled, y_scaled]
}
abs = Math.abs

let main_canva = document.getElementById('game_frame');
let start_position;
let space_object;
let x;
let y;
let width;
let height;


function create_space_object_mousedown(event) {

    if (current_god_tool_tab != 1) {
        return;
    }

    paused = true;
    start_position = get_mouse_position(event);
    //create space object
    let mass = document.getElementById('god_tools_tab_1_mass_input').value;
    let radius = document.getElementById('god_tools_tab_1_radius_input').value;
    let if_fixed = document.getElementById('god_tools_tab_1_if_fixed_input').checked;
    // convert mass to number
    mass = Number(mass);
    // convert radius to number
    radius = Number(radius);
    //god_tools_tab_1_theme_image.src = "";
    //if god_tools_tab_1_theme_image.src not started with #
    if (!planet_theme.color) {
        space_object = new SpaceObjectWithImage(mass,radius,start_position[0],start_position[1],0,0,planet_theme.src);
    }
    else {
        space_object = new SpaceObject(mass,radius,start_position[0],start_position[1],0,0);
        space_object.color = planet_theme.src
    }
    space_object.destroyer = god_tools_tab_1_if_destroyer_input.checked;
    space_object.fixed_position = Boolean(if_fixed);

    system.add(space_object);
    pause_button.innerHTML = '<i class="fa fa-play"></i>';
}

function create_space_object_mouseup(event) {
    if (current_god_tool_tab != 1) {
        return;
    }
    end_position = get_mouse_position(event);
    system.predict(100);
    pause_button.innerHTML = '<i class="fa fa-pause"></i>';
    paused = false;
    start_position = null;

}

function create_space_object_mousemove(event) {
    if (current_god_tool_tab != 1) {
        return;
    }
    if (!start_position) {
        return;
    }
    //if fixed mode skip
    if (document.getElementById('god_tools_tab_1_if_fixed_input').checked) {
        return;
    }
    current_position = get_mouse_position(event);
    //system.predict(100)
    
    let dx = current_position[0] - start_position[0];
    let dy = current_position[1] - start_position[1];

    space_object.vx = -dx / 100;
    space_object.vy = -dy / 100;
}

//switch current god tool tab
function switch_god_tool_tab(tab_number) {
    reset_all_switch()
    let ctx = layer_1.getContext('2d');
    //hide current god tool tab
    try {
        //document.getElementById('god_tools_tab_' + current_god_tool_tab).style.display = 'none';
    } catch (error) {
        
    }
    //show new god tool tab
    current_god_tool_tab = tab_number;
    try{
        //document.getElementById('god_tools_tab_' + current_god_tool_tab).style.display = 'block';
    }
    catch (error) {

    }
    //set current god tool tab to new god tool tab


    // remove all event listeners


    if (current_god_tool_tab == 1){
        add_mode_button.style.backgroundColor = 'green';
        //on mouse down in canvas set start position to mouse position
        main_canva.addEventListener('mousedown', create_space_object_mousedown);
        //calculate distance between start position and current mouse position
        main_canva.addEventListener('mousemove', create_space_object_mousemove);

        //on mouse up set end position to mouse position
        main_canva.addEventListener('mouseup', create_space_object_mouseup)
    }
    if (current_god_tool_tab == 2){
        //delete mode to green
        delete_mode_button.style.backgroundColor = 'green';
        main_canva.addEventListener('mousedown', (event)=>{
            if (current_god_tool_tab != 2) {
                return;
            }
            paused = true;
            //<i class="fa fa-play"></i>
            //set pause button to pause
            pause_button.innerHTML = '<i class="fa fa-play"></i>';
            //start position is mouse position\
            start_position = get_mouse_position(event);

        });
        //calculate distance between start position and current mouse position
        main_canva.addEventListener('mousemove', (event)=>{
            //hilight objects rectangle from start_position to current_mouse position
            if (current_god_tool_tab != 2) {
                return;
            }
            if (!start_position) {
                return;
            }
            current_position = get_mouse_position(event);
            // get mouse position relative to main_canva

            //get upper left corner of rectangle
            x = Math.min(start_position[0], current_position[0]);
            y = Math.min(start_position[1], current_position[1]);

            //get width and height of rectangle
            width = Math.abs(start_position[0] - current_position[0]);
            height = Math.abs(start_position[1] - current_position[1]);

            //draw rectangle on layer 2

            //get layer 2 context
            //draw rectangle
            ctx_3.clearRect(0, 0, layer_2.width, layer_2.height);
            ctx_3.beginPath();
            ctx_3.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx_3.rect(x, y, width, height);
            //fill transparent rectangle
            ctx_3.fill();
            ctx_3.stroke()
            
            console.log(x, y, width, height);
            //draw rectangle with line
        });

        //on mouse up set end position to mouse position
        main_canva.addEventListener('mouseup', (event)=>{
            if (current_god_tool_tab != 2) {
                return
            }
            
            current_position = get_mouse_position(event);

            //loop check if space object is in rectangle
            for (let i = 0; i < system.objects.length; i++) {
                let space_object = system.objects[i];
                // skip if space object is player
                if (space_object == player) {
                    continue;
                }
                if (space_object.x > x && space_object.x < x + width && space_object.y > y && space_object.y < y + height) {
                    system.objects.splice(i, 1);
                    i--;
                }
            }

            system.predict(100);
            paused = false;
            pause_button.innerHTML = '<i class="fa fa-pause"></i>';

            start_position = null;
            current_position = null;
            ctx_3.clearRect(0, 0, layer_2.width, layer_2.height);
        })
    }
    if (current_god_tool_tab == 3){
        main_canva.addEventListener('mousedown', (event)=>{});
        //calculate distance between start position and current mouse position
        main_canva.addEventListener('mousemove', (event)=>{});

        //on mouse up set end position to mouse position
        main_canva.addEventListener('mouseup', (event)=>{})
    }
}

//bind god tool tab buttons to switch god tool tab function
document.getElementById('god_tools_tab_change_button_1').onclick = function() {
    switch_god_tool_tab(1);
};
/*
document.getElementById('god_tools_tab_change_button_2').onclick = function() {
    switch_god_tool_tab(2);
};

document.getElementById('god_tools_tab_change_button_3').onclick = function() {
    switch_god_tool_tab(3);
};*/


//create square button with delete icon on top left next to pause button
let delete_mode_button = document.createElement('button');
delete_mode_button.id = 'delete_mode_button';
delete_mode_button.innerHTML = '<i class="fa fa-trash"></i>';
delete_mode_button.onclick = function() {
    //if button already green
    if (delete_mode_button.style.backgroundColor == 'green') {
        reset_all_switch()
        //delete_mode_button.style.backgroundColor = 'white';
        switch_god_tool_tab(0);
    }
    else{//set bg to light green
        reset_all_switch()
        //delete_mode_button.style.backgroundColor = 'green';
        switch_god_tool_tab(2);
    }
};
delete_mode_button.style.position = 'absolute';
delete_mode_button.style.left = '139px';
delete_mode_button.style.top = '10px';
delete_mode_button.style.width = '53px';
delete_mode_button.style.height = '53px';
//font size 
delete_mode_button.style.fontSize = '40px';
//to bold font
delete_mode_button.style.fontWeight = 'bold';

//add planet info button
let planet_info_button = document.createElement('button');
planet_info_button.id = 'planet_info_button';
planet_info_button.innerHTML = "<i class='fa fa-question-circle'></i>"
planet_info_button.onclick = function() {
//if button already green
    //create popup display image
    let popup = document.createElement('div');
    popup.id = 'popup';
    popup.style.position = 'absolute';
    popup.style.left = '0px';
    popup.style.top = '0px';
    popup.style.width = '100%';
    popup.style.height = '100%';
    popup.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    popup.style.zIndex = '100';
    popup.style.display = 'flex';
    popup.style.justifyContent = 'center';
    popup.style.alignItems = 'center';
    popup.style.flexDirection = 'column';
    popup.style.color = 'white';
    popup.style.fontSize = '30px';
    popup.style.fontWeight = 'bold';
    popup.style.textAlign = 'center';
    popup.style.padding = '20px';
    popup.style.boxSizing = 'border-box';
    popup.style.cursor = 'pointer';
    //popup.innerHTML = 'Click to close';
    paused = true;
    //add image
    let image = document.createElement('img');
    image.src = 'images/Planet_Creation_Setting.png';
    image.style.width = '100%';
    //image.style.maxWidth = '1500px';
    image.style.height = '100%';
    image.style.marginBottom = '20px';
    popup.appendChild(image);

    let flag = false;
    // if god_tab display is none
    if (document.getElementById('god_tools_tab').style.display == 'none') {
        //set god tab display to block

        god_mode_button.click();
        flag = true;
    }

    //add image next on left 2% width 14%
    //top 50% height 10%

    popup.onclick = function() {
        paused = false;
        document.body.removeChild(popup);
        if (flag) {
            god_mode_button.click();
        }
    }
    document.body.appendChild(popup);
};

planet_info_button.style.position = 'absolute';
planet_info_button.style.left = '245px';
planet_info_button.style.top = '10px';
planet_info_button.style.width = '53px';
planet_info_button.style.height = '53px';
//font size
planet_info_button.style.fontSize = '40px';
//to bold font
planet_info_button.style.fontWeight = 'bold';

//add buttons to main div
document.body.appendChild(planet_info_button);




//add delete mode button to main div
document.body.appendChild(delete_mode_button);


//create add button next to delete button
let add_mode_button = document.createElement('button');
add_mode_button.id = 'add_mode_button';
add_mode_button.innerHTML = '<i class="fa fa-plus"></i>';
//font size
add_mode_button.style.fontSize = '40px';
add_mode_button.onclick = function() {
    //if button already green
    if (add_mode_button.style.backgroundColor == 'green') {
        //add_mode_button.style.backgroundColor = 'white';

        //hide stats tab
        //god_tools_tab_1.style.display = 'none';
        //document.getElementById('god').style.display = 'none';

        reset_all_switch()

        switch_god_tool_tab(0);
    }
    else{//set bg to light green
        reset_all_switch()
        //add_mode_button.style.backgroundColor = 'green';

        switch_god_tool_tab(1);
    }
};

//set position on right of delete button
add_mode_button.style.position = 'absolute';
add_mode_button.style.left = '192px';
add_mode_button.style.top = '10px';
add_mode_button.style.width = '53px';
add_mode_button.style.height = '53px';
//to bold font
add_mode_button.style.fontWeight = 'bold';

//add add mode button to main div
document.body.appendChild(add_mode_button);


//add game setting label in god mode tab
let game_setting_label = document.createElement('Button');
game_setting_label.id = 'game_setting_label';
game_setting_label.innerHTML = 'Game Setting';
//game_setting_label.style.position = 'absolute';
//game_setting_label.style.top = '40%';
game_setting_label.style.left = '0%';
game_setting_label.style.width = '100%';
game_setting_label.style.height = '10%';
game_setting_label.style.fontWeight = 'bold';
game_setting_label.style.fontSize = '20px';

//add game setting label to god mode tab
//god_tools_tab_1.appendChild(game_setting_label);

switch_god_tool_tab(1);




setInterval(run, 1000/simspeed);


//set all button to pointer
let buttons = document.getElementsByTagName('button');
for (let i = 0; i < buttons.length; i++) {
    buttons[i].style.cursor = 'pointer';
}

//function to play confirm sound
function play_confirm_sound(link = 'images/confirmMenu.mp3') {
    let audio = new Audio(link);
    audio.volume = 0.2;
    audio.play();
}

function play_cancle_sound() {
    let audio = new Audio('images/cancelMenu.ogg');
    audio.volume = 0.5;
    audio.play();
}
