
onmessage = function (e){
    let [system_data,n] = e.data;
    //system_data is list of planet data(mass,x,y,vx,vy)

    //predict next x,y for each planet in system_data
    //return list of predicted planet data(x,y,vx,vy)
    //return [[x,y,vx,vy],[x,y,vx,vy],...]
    for (var i = 0; i < n; i++){

        var G = 0.5; //gravitational constant
        var dt = 1; //seconds
        var new_system_data = [];

        for(var i=0;i<system_data.length;i++){
            var x = system_data[i][1];
            var y = system_data[i][2];
            var vx = system_data[i][3];
            var vy = system_data[i][4];
            var m = system_data[i][0];
            var ax = 0;
            var ay = 0;

            for(var j=0;j<system_data.length;j++){
                if(i!=j){
                    var dx = system_data[j][1] - x;
                    var dy = system_data[j][2] - y;
                    var r = Math.sqrt(dx*dx+dy*dy);
                    var a = G*system_data[j][0]*m/(r*r);
                    ax += a*dx/r;
                    ay += a*dy/r;
                }
            }

            vx += ax*dt;
            vy += ay*dt;
            x += vx*dt;
            y += vy*dt;

            new_system_data.push([x,y,vx,vy,ax,ay]);
        }
        this.postMessage(new_system_data);
    }
}