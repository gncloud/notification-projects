#!/bin/bash

#cd /Users/joonwookim/Projects/notification-projects/naver-cafe-notification

echo $(date) ' Restart! ' >> restart.log
sleep 2
sh stop.sh
sleep 2

echo $(date) 'Start New Process!' >> restart.log
sh start.sh
sleep 2

echo $(date) ' Done! ' >> restart.log
