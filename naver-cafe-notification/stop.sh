#!/bin/bash


echo kill -9 $(ps -ef| grep -v grep | grep "node src/index.js" | awk '{print $2}') 
echo kill -9 $(ps -ef| grep -v grep | grep chrome | awk '{print $2}') 

kill -9 $(ps -ef| grep -v grep | grep "node src/index.js" | awk '{print $2}')
kill -9 $(ps -ef| grep -v grep | grep chrome | awk '{print $2}')
