#!/bin/sh

APP_HOME=/home/ubuntu/dart-telegram-server

cd $APP_HOME

pid=`ps -ef| grep index |grep -v grep | awk '{print $2}'`
if [ ! -z "$pid" ];
then
  echo "kill $pid"
  kill $pid || kill -9 $pid
  sleep 2
fi

trap '' 1 2
npm start > $APP_HOME/output.log  2>&1 &