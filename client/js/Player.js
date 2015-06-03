var Player = (function (container, width, height, buffer) {
    var self = this;
    var buffer = buffer;
    var container = container;
    var width = width;
    var height = height;

    this.state = "INITIAL";
    this.transitionToState = function (state) {
        var prev_state = this.state;
        this.state = state;
        if (prev_state != state) this.notifyStateChange();
    }
    this.notifyChunkConsumed = function () {};
    this.notifyStateChange = function () {};
    this.getBufferSize = function () {
        return container.childNodes.length;
    }


    this.notifyChunkAvailable = function () {
        while (true) {
            var chunk = buffer.getNext();
            if (chunk === null) return;
            bufferChunk(chunk);
        }
    }

    function bufferChunk (chunk) {
        var video = createVideoElement();
        video.addEventListener('error', function () {
            // ignore dummy blob which is not a real video
            URL.revokeObjectURL(video.src);
            container.removeChild(video);
        })
        video.src = URL.createObjectURL(chunk.toBlob());

        self.notifyChunkConsumed();
        if (container.childNodes.length === 1) {
            container.firstChild.classList.remove("hidden");
            container.firstChild.play();
            self.transitionToState("PLAYING");
        }
    }

    function createVideoElement () {
        var v = document.createElement('video');
        v.width = width;
        v.height = height;
        v.onended = onBlockPlaybackEnded;
        v.classList.add("hidden");
        container.appendChild(v);
        return v;
    }

    function onBlockPlaybackEnded(e) {
        var video = e.srcElement || e.target;
        URL.revokeObjectURL(video.src);
        container.removeChild(video);
        if (container.firstChild) {
            container.firstChild.classList.remove("hidden");
            container.firstChild.play();
        } else if (container.childNodes.length === 0) {
            self.transitionToState("BUFFERING");
        }
    };

})
