#!/bin/sh

./duckygen.py $1 > tmp.ducky
java -jar /Users/martme/Code/RubberDuckey/encoder.jar -i tmp.ducky -o /Volumes/RUBBERDUCKY/inject.bin -l no
rm tmp.ducky
