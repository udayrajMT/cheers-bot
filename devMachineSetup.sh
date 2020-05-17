#!/bin/sh
yarn add hotel
yarn install

hotel stop 
hotel start

networksetup -setautoproxyurl "Wi-Fi" "http://localhost:2000/proxy.pac"
# Turn Wifi Off and On, if not running this script for the first time

#change this to admin.* for admin side features
hotel add "node start_proxy.js" --name "admin.certificates2" --port 5021 -o proxy.log
hotel add "npm start" --name "certificates2-ui" --port 5021

hotel stop 
hotel start