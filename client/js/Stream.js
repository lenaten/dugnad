var Stream = (function (onData, config) {
    var onData = onData || function () {};
    var config = config || {};

    var canvas = document.getElementById('canvas');
    var video = document.getElementById('video');

    var options = {
        fps: 30,
        secondsPerBlock: 3,
        encodingQuality: 1.0,
    }

    if (config.dummy_stream && config.bit_rate) {
        setInterval(function () {
            var duration = options.secondsPerBlock;
            var bit_rate = config.bit_rate * 1024 / 8; // (kbps) 720p HD stream
            onData(new Uint8Array(bit_rate * duration));
        }, options.secondsPerBlock*1000);
    }
    else {
        var encoder = new Encoder(options.fps, options.fps*options.secondsPerBlock, options.quality);
        var camera;
        // Create Video Sources
        new Animation(canvas);
        getUserMedia(
            {video: true, audio: true},
            function (stream) {
                canvas.classList.add("hidden");
                video.classList.remove("hidden");
                video.src = window.URL.createObjectURL(stream);
                video.volume = "0";
                video.play();
                camera = new Camera(video, options.fps);
                camera.onFrame = function (frame) {
                    encoder.consume(frame); // collect frames then convert into Block
                }
                camera.record();
            },
            function (error) {
                //throw error
                console.log("getUserMedia failed. Using animation as video source.");
                camera = new Camera(canvas, options.fps);
                camera.onFrame = function (frame) {
                    encoder.consume(frame); // collect frames then convert into Block
                }
                camera.record();
            }
        );

        encoder.onBlob = function (blob) {
            var reader = new FileReader(blob);
            reader.onload = function (event) {
                onData(new Uint8Array(this.result));
            }
            reader.readAsArrayBuffer(blob);
        }
    }
});
