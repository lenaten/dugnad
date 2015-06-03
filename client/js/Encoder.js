var Encoder = (function (fps, framesPerBlock, quality) {
    var self = this;

    this.fps            = fps;
    this.framesPerBlock = framesPerBlock || fps * 3;
    this.quality        = quality || 0.5

    var encoder = new Whammy.Video(this.fps, this.quality);

    this.onBlob = function () {};

    this.consume = function (frame) {
        encoder.add(frame);
        if (encoder.frames.length >= this.framesPerBlock) {
            var tmp = encoder;
            encoder = new Whammy.Video(this.fps, this.quality);
            this.compile(tmp);
        }
    }

    this.compile = function (encoder) {
        self.onBlob(encoder.compile());
    }
});
