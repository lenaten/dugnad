
var Camera = (function (src, fps) {
    var self = this;
    init(src, fps);

    function init(src, fps) {
        self.src = src;
        self.fps = fps;
        if (src.nodeName === "CANVAS" || src.nodeName === "VIDEO") {
            this.captureFrame = captureFrame;
        }
        else {
            throw "Incompatible src element for camera: Must be <canvas> or <video>.";
        }
    }

    this.stop = function () {
        if (this.captureTimer) window.clearInterval(this.captureTimer);
    }

    this.onFrame = function (frame) {
    }

    function captureFrame() {

        var canvas = document.createElement('canvas');
        var w = self.src.width || self.src.videoWidth;
        var h = self.src.height || self.src.videoHeight;
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(self.src, 0, 0, w, h);
        self.onFrame(canvas);
    }

    this.record = function () {
        if (this.captureTimer) throw "Already recording";
        this.captureTimer = setInterval(captureFrame, Math.round( 1000/ self.fps ));
    }
});
