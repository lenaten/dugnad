var BandwidthProbe = (function () {
    var self = this;

    var received = 0;
    var intervalLengthInSeconds = 3; // seconds per measurement

    var estimate = 0;

    this.feed = function (data) {
        received += 8 * data.length;
    }

    this.feedBytes = function (bytes) {
        received += bytes;
    }

    this.onMeasurement = function (value) {
    }

    this.getEstimate = function () {
        return (8*estimate / 1024).toFixed(2);
    }

    var probeInterval = window.setInterval(function () {
        var value = received / intervalLengthInSeconds;
        self.onMeasurement(self.getEstimate())

        estimate = 0.8*estimate + 0.2*value;
        received = 0;

    }, intervalLengthInSeconds * 1000);
});
