/*
Background image:
«PM5544 with non-PAL signals» av Zacabeb - Eget verk. Lisensiert under Offentlig eiendom via Wikimedia Commons - http://commons.wikimedia.org/wiki/File:PM5544_with_non-PAL_signals.png#/media/File:PM5544_with_non-PAL_signals.png
*/

var Animation = (function (canvas) {
    var timeStep = 0

    var NUM_BALL = 27 // 20 for 240p
    var BALL_HEIGHT = 320 // 100 for 240p
    var BALL_THICKNESS = 8 // 4 for 240p

    var t0 = parseInt(Date.now() / 100) % 100000;

    var background = new Image();
    background.src = "/assets/images/PM5544_with_non-PAL_signals.png";

    function now() {
        return ((parseInt(Date.now() / 100) % 100000 - t0)/10).toFixed(1);
    }

    var hex = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];


    var context = canvas.getContext('2d');

    function animate() {
        animateBalls();
        setTimeout(animate, 20);
    }

    function animateBalls() {
        clearGraphics();
        //context.fillStyle = "#0B5F95"
        context.fillStyle = getColor(timeStep);
        for (var i = 0; i < NUM_BALL; i++) {
            //var x = 40 + 30*i; // 240p
            var x = 35 + 22*i; // 40 + 30i in 240p
            var y = 60 + getY(i, timeStep);
            context.beginPath();
            context.arc(x, y, BALL_THICKNESS, 2*Math.PI, false);
            context.fill();
        }
        timeStep++;
    }

    function clearGraphics() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        //context.rect(0,0, canvas.width, canvas.height);

        context.drawImage(background, 0, 0, canvas.width, canvas.height);
        //context.fillStyle = "#ffffff";
        //context.fill();

        context.font="200px times";
        context.fillStyle = "#fff";
        //context.fillStyle = getColor(timeStep);
        context.fillText(now(), 50, 300);
    }

    function getY(i, t) {
        return 10 + BALL_HEIGHT/2 * (1 + Math.sin((timeStep * (i/500 + 0.02)) % 2*Math.PI));
    }

    function getColor(t) {
        var color = "#";
        for (var i = 0; i < 6; i++) {
            var index = parseInt(Math.abs( Math.sin( i*(Math.PI / 6) + t * 2*Math.PI / 200 ) )*15);
            color += hex[index];
        }
        return color
    }


    background.onload = function () {
        animate();
    }

});
