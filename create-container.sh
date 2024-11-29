#!/bin/bash

NAME=naverpay-developer-notice-feed
WORKING_PATH=/home/ubuntu/data/gilchris.github.io
GIT_PATH=/data/gilchris.github.io

sudo docker container stop $NAME
sudo docker container rm $NAME
sudo docker container create \
    -e GIT_PATH=$GIT_PATH \
    -v $WORKING_PATH:$GIT_PATH \
    --name $NAME  \
    $NAME:latest