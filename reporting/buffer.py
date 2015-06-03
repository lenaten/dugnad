#!/usr/bin/python

import sys
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import numpy as np
import json

def get_t0(events):
    return events[0]['t']

def event_time(event, t0):
    return ((event['t'] - t0) % 100000000)*1.0/1000


def gather_buffer_lifetimes(events, client_id):
    t0 = get_t0(events)
    buffer_size = []
    timestamp = []
    for event in events:
        if event['type'] == "receive" and event['id'] == client_id:
            buffer_size.append(event['b'])
            timestamp.append(event_time(event, t0))
        elif event['type'] == "playback" and event['id'] == client_id and event['s'] == "BUFFERING":
            buffer_size.append(0)
            timestamp.append(event_time(event, t0))
    return timestamp, buffer_size

def get_client_ids(events):
    ids = []
    for event in events:
        if event['type'] == "join":
            ids.append(event['id'])
    return ids[1::]


def main(inputfile):

    with open(inputfile) as rawdata:
        events = json.load(rawdata)

    cliend_ids = get_client_ids(events)
    print cliend_ids

    # add data series
    # linestyle [ls]: '-', '--', '-.', ':' )
    # linewidth [lw]: <float>
    # color [c]: [b]lue, [g]reen, [r]ed, [c]yan, [m]agenta, [y]ellow, [k]black, [w]hite, hex: '#ffaa32'


    for cid in cliend_ids:
        x, y = gather_buffer_lifetimes(events, cid)
        plt.plot(x, y, ls=":")
    plt.show()



if __name__ == "__main__":
    if len(sys.argv) == 2:
        main(sys.argv[1])
    else:
        print "Usage: %s <data file>" % sys.argv[0]
