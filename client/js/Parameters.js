var Parameters = (function (args) {
    var args = args || {};
    return {
        room: args.room || "default",
        role: args.role || "viewer",

        // broadcaster fanout
        fanout: args.fanout || 3,


        pull_interval:     args.pull_interval || 500,
        patch_interval:     args.patch_interval || 30000,
        ideal_peer_count:   args.ideal_peer_count || 14,

        connection_timeout:                 args.connection_timeout || 15000,
        connection_heartbeat_interval:      args.connection_heartbeat_interval || 4000,
        connection_recycle_interval:        args.connection_recycle_interval || 10000,
        connection_score_decay_interval:    args.score_decay_interval || 10000,

        upload_delay: args.upload_delay || 0,

        bit_rate: args.bit_rate || 2500,
        dummy_stream: args.dummy_stream || false,
    };
});
