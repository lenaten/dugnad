#!/usr/bin/python

import sys
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import numpy as np
import json

def rel_time(event, t0):
    return (event['t'] / 1000.0 - t0)

def parse_inputfile(inputfile):
    with open(inputfile) as rawdata:
        events = json.load(rawdata)
    t0 = rel_time(events[0], 0)
    return events, t0

def gather_spawned_chunks(events, t0):
    t = []
    chunk_num = []
    for event in events:
        if event['type'] == "spawn":
            t.append(rel_time(event, t0))
            chunk_num.append(event['n'])
    return chunk_num, t


def gather_viewer_data(events, t0):
    cnt = 0
    viewers = []

    for event in events[1:]:
        if event['type'] == "join":
            cnt += 1
        elif event['type'] == "leave":
            cnt -= 1
        elif event['type'] == "spawn":
            viewers.append(cnt)

    data = []

    for i in range(1, len(events)):
        event = events[i]
        node_id = event['id']
        if event['type'] == "join":
            tmp = {
                'chunks': [],
                'times': [],
                'hops': []
            }
            for event in events[i+1:]:
                if (event['type'] == 'receive' and event['id'] == node_id):
                    tmp['chunks'].append(event['n'])
                    tmp['times'].append(rel_time(event, t0))
                    tmp['hops'].append(event['hc'])
            data.append(tmp)
    return {
        'count': viewers,
        'joins': data,
    }



def gather_receive_data(events, chunks, spawn_times, t0):
    tmp = {}

    for chunk in chunks:
        tmp[chunk] = { 'hops': [], 't': [], 'rel_t': [], 'ul': [], 'dl': [] }

    for event in events:
        if event['type'] == "receive":
            tmp[event['n']]['t'].append( rel_time(event, t0) )
            tmp[event['n']]['rel_t'].append( rel_time(event, t0) - spawn_times[event['n'] - chunks[0]] )
            tmp[event['n']]['hops'].append(event['hc'])
            tmp[event['n']]['ul'].append(float(event['ul']))
            tmp[event['n']]['dl'].append(float(event['dl']))

    data = {
        #'hops': [],
        'max_hops': [],
        'mean_hops': [],
        'median_hops': [],
        'x75_hops': [],
        'x95_hops': [],
        #'receive_times': [],
        'max_receive_time': [],
        'mean_receive_time': [],
        'median_receive_time': [],

        'max_rel_receive_time': [],
        'mean_rel_receive_time': [],
        'median_rel_receive_time': [],
        'x95_rel_receive_time': [],
        'x75_rel_receive_time': [],
        'num_receive': [],

        'mean_ul': [],
        'x75_ul': [],
        'x95_ul': [],

        'mean_dl': [],
        'x75_dl': [],
        'x95_dl': [],
    }

    for chunk in chunks:
        if not tmp[chunk]['hops']:
            tmp[chunk]['hops'].append(0)

        data['max_hops'].append(np.max(tmp[chunk]['hops']))
        data['mean_hops'].append(np.mean(tmp[chunk]['hops']))
        data['median_hops'].append(np.median(tmp[chunk]['hops']))
        data['x75_hops'].append(np.percentile(tmp[chunk]['hops'], 75))
        data['x95_hops'].append(np.percentile(tmp[chunk]['hops'], 95))

        if not tmp[chunk]['t']:
            tmp[chunk]['t'].append(0)
            tmp[chunk]['rel_t'].append(0)
        data['max_receive_time'].append(np.max(tmp[chunk]['t']))
        data['mean_receive_time'].append(np.mean(tmp[chunk]['t']))
        data['median_receive_time'].append(np.median(tmp[chunk]['t']))

        data['max_rel_receive_time'].append(np.max(tmp[chunk]['rel_t']))
        data['mean_rel_receive_time'].append(np.mean(tmp[chunk]['rel_t']))
        data['median_rel_receive_time'].append(np.median(tmp[chunk]['rel_t']))
        data['x95_rel_receive_time'].append(np.percentile(tmp[chunk]['rel_t'], 95))
        data['x75_rel_receive_time'].append(np.percentile(tmp[chunk]['rel_t'], 75))
        data['num_receive'].append(len(tmp[chunk]['t']))

        if not tmp[chunk]['ul']:
            tmp[chunk]['ul'].append(0)
        if not tmp[chunk]['dl']:
            tmp[chunk]['dl'].append(0)

        data['mean_ul'].append(np.mean(tmp[chunk]['ul']))
        data['x75_ul'].append(np.percentile(tmp[chunk]['ul'], 75))
        data['x95_ul'].append(np.percentile(tmp[chunk]['ul'], 95))

        data['mean_dl'].append(np.mean(tmp[chunk]['dl']))
        data['x75_dl'].append(np.percentile(tmp[chunk]['dl'], 75))
        data['x95_dl'].append(np.percentile(tmp[chunk]['dl'], 95))
    return data


def main(inputfile, plt_type):
    events, t0 = parse_inputfile(inputfile)

    chunks, spawn_times = gather_spawned_chunks(events, t0)
    receive_data = gather_receive_data(events, chunks, spawn_times, t0)
    viewer_data = gather_viewer_data(events, t0)


    if plt_type == "hop-count":
        plt.plot(chunks, receive_data['max_hops'], c='r', ls='-.')
        #plt.plot(chunks, receive_data['x95_hops'], c='k')
        plt.plot(chunks, receive_data['x75_hops'], c='b', ls='--')
        plt.plot(chunks, receive_data['mean_hops'], c='g', ls='-')
        plt.ylabel("hops")
        plt.xlabel("chunk")

        print ",".join(['chunk', 'hc-max', 'hc-x95', 'hc-x75', 'hc-median', 'hc-mean'])
        for i in range(len(chunks)):
            print "%d, %d, %d, %d, %d, %d" % (chunks[i], receive_data['max_hops'][i], receive_data['x95_hops'][i], receive_data['x75_hops'][i], receive_data['median_hops'][i], receive_data['mean_hops'][i])


    elif plt_type == "bandwidth":
        plt.plot(chunks, receive_data['mean_ul'], c='r', ls='-')
        plt.plot(chunks, receive_data['x75_ul'], c='r', ls='--')
        plt.plot(chunks, receive_data['x95_ul'], c='r', ls='-.')

        plt.plot(chunks, receive_data['mean_dl'], c='b', ls='-')
        plt.plot(chunks, receive_data['x75_dl'], c='b', ls='--')
        plt.plot(chunks, receive_data['x95_dl'], c='b', ls='-.')

        plt.xlabel("chunk")
        plt.ylabel("estimated bandwidth [kbps]")

        print ",".join(['chunk', 'ul-mean', 'ul-x75', 'ul-x95', 'dl-mean', 'dl-x75', 'dl-x95'])
        for i in range(len(chunks)):
            print "%d, %f, %f, %f, %f, %f, %f" % (chunks[i], receive_data['mean_ul'][i], receive_data['x75_ul'][i], receive_data['x95_ul'][i], receive_data['mean_dl'][i], receive_data['x75_dl'][i], receive_data['x95_dl'][i])

    elif plt_type == "diffusion":
        plt.plot(chunks, receive_data['max_rel_receive_time'], c='r', ls=':', label="max")
        plt.plot(chunks, receive_data['median_rel_receive_time'], c='g', ls='-', label="median")
        plt.plot(chunks, receive_data['x95_rel_receive_time'], c='purple', ls='-.', label="95 percentile")
        plt.plot(chunks, receive_data['x75_rel_receive_time'], c='b', ls='--', label="75 percentile")

        print ",".join(['chunk', 'max-recv', 'median-recv', 'x75-recv', 'x95-recv'])
        for i in range(len(chunks)):
            print "%d, %f, %f, %f, %f" % (chunks[i], receive_data['max_rel_receive_time'][i], receive_data['median_rel_receive_time'][i], receive_data['x75_rel_receive_time'][i], receive_data['x95_rel_receive_time'][i])

        plt.xlabel("chunk")
        plt.ylabel("time [sec]")

    elif plt_type == "viewers":
        plt.plot(chunks, viewer_data['count'], c='r', ls='-', label="viewers")
        plt.plot(chunks, receive_data['num_receive'], 'b', ls='--', label="receivers")

        print ",".join(['chunk', 'viewers', 'receivers'])
        for i in range(len(chunks)):
            print "%d, %d, %d" % (chunks[i], viewer_data['count'][i], receive_data['num_receive'][i])


    plt.legend()
    plt.show()





if __name__ == "__main__":
    if len(sys.argv) == 2:
        print "Usage: %s [--hop-count] <data file>" % sys.argv[0]

    elif len (sys.argv) == 3 and (sys.argv[1] == "--hop-count" or sys.argv[1] == "-hc"):
        main(sys.argv[2], "hop-count")

    elif len (sys.argv) == 3 and (sys.argv[1] == "--bandwidth" or sys.argv[1] == "-bw"):
        main(sys.argv[2], "bandwidth")

    elif len (sys.argv) == 3 and (sys.argv[1] == "--diffusion" or sys.argv[1] == "-d"):
        main(sys.argv[2], "diffusion")

    elif len (sys.argv) == 3 and (sys.argv[1] == "--viewers" or sys.argv[1] == "-v"):
        main(sys.argv[2], "viewers")


    else:
        print "Usage: %s [ --hop-count[-hc] | --bandwidth[-bw] ] <data file>" % sys.argv[0]
