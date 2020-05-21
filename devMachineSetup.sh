#!/bin/sh
npm install

hotel stop 
hotel start

# networksetup -se"tautoproxyurl "Wi-Fi" "http://localhost:2000/proxy.pac"
# Turn Wifi Off and On, if not running this script for the first time

hotel rm --name "cheers-bot.mindtickle"
hotel rm --name "cheer-forwarder"
hotel rm --name "cheer-client"

#change this to admin.* for admin side features
hotel add "node index.js" --name "cheers-bot.mindtickle" --port 5017 -o proxy.log
hotel add "npm run start" --name "cheer-forwarder" --port 5018
cd client/ 
hotel add "npm run start" --name "cheer-client" --port 5019

hotel stop 
hotel start