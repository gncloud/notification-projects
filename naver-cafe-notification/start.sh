#!/bin/bash



trap '' 2 1
node src/index.js > stdout.txt 2> stderr.txt &

