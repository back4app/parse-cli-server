#!/bin/bash

npm run build
cp -r lib ../back4app-cli-server/node_modules/parse-cli-server
