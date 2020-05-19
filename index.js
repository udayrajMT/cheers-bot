require('dotenv').config()
const { App, LogLevel } = require('@slack/bolt');
const events = require('events');
const eventHandler = new events.EventEmitter();
const { InstallProvider } = require('@slack/oauth');

const https = require("http"),
    url = require("url"),
    httpProxy = require("http-proxy"),
    HttpProxyRules = require("http-proxy-rules");

const CLIENT_PORT = process.env.CLIENT_PORT || 3002;
const SERVER_PORT = process.env.SERVER_PORT || 3001;
const BOT_PORT = process.env.BOT_PORT || 3000;

/* BOT SERVER */
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    logLevel: LogLevel.INFO
});
const withAuth = api_method => (obj) => api_method({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    ...obj
});

app.event('reaction_added', async ({ context, event }) => {
    console.log('\n Added Reaction: ', event.reaction, event.event_ts);
    eventHandler.emit('cheered', event);
});

app.event('reaction_removed', async ({ context, event }) => {
    console.log('\n Removed Reaction: ', event.reaction, event.event_ts);
    eventHandler.emit('cheered', event);
});


eventHandler.on('cheered', function ({ reaction }) {
    // let only supported reactions pass through -
    if (!cheerCollection[reaction])
        return;

    // get server time
    const server_ts = Date.now();
    cheerTimes[reaction] = cheerTimes[reaction] || [];
    // Nope -  need mutex lock here?
    // > JS is single-threaded and it won't switch between function bodies without reaching its return statement :
    cheerTimes[reaction].push(server_ts);
});

(async () => {
    // Start your app
    await app.start(BOT_PORT);
    console.log('⚡️ Bolt app is running!');
})();



/* CHEER SERVER */
const CHEER_UPDATE_INTERVAL = 250;


// No need! timestamp should be the only criterion - // How to get most recent message -

/**
 // How to render sound based on a reaction count

 // M1 : run a timestamp window every second and update the volume until the window has less than trigger count
 Actually, it will[THINK!] > Will not take account for multiple clapping
    Nope -> then allow multiple reactions to keep clapping
    Yeah means better > allow removing and adding again to trigger it

Okay how to implement it?
    We're already in the Event system, let's continue with it.
    > (saga subconsciously)Logically it seems correct to have a separate thread(read-only) to check time windows on reactions which runs at regular intervals
    // > emit an event on add/remove of the reaction
    // > on that event, its timestamp is added to the array.   
    // Nope, server time would be diff > Now the fact that this is an epoch time, we can check for current epoch
    > So basis for current time is most recent event?
        > think - we're calculating a duration of n seconds on server i.e. server's timestamp is in use here.
            // nope, see below > maybe find the offset on each new request? on server init?
                > find offset on first event(when list has gotten/is empty)
                    > that event shall disappear after n seconds _//
                >> No need to use event_ts, current ts should suffice and is correct approach(doesn't depend on errors in event_ts)
    > Need to use real time api then!
        > change to it later. First make a prototype to see it for yourself
            > COZ DELAY WILL MATTER. 

        > Webpage to display each update - this server should return data on a request?!
        > webpage itself would play the sounds
            firstly do it for a trigger(>5) and volume(scaled in decibles)
                >
 */


// This object will be shared by client and server
const cheerCollection = {
    "clap": {
        "name": "Applause",
        // "file": applauseFile,
        "time_window": 10000,
        "trigger_count": 1,
        "scale": "linear"
    },
    "joy": {
        "name": "Laughter",
        // "file": laughterFile,
        "time_window": 10000,
        "trigger_count": 1,
        "scale": "linear"
    }
};

const cheerTimes = Object.keys(cheerCollection).reduce((obj, key) => { obj[key] = []; return obj }, {});

const isInWindow = (reaction, ref_ts, event_ts) => {
    const diff = ref_ts - event_ts;
    return diff < cheerCollection[reaction]["time_window"];
}

const updateCheerTimes = () => {
    const ref_ts = Date.now();
    for (let reaction in cheerCollection) {
        cheerTimes[reaction] = cheerTimes[reaction].filter((event_ts) => isInWindow(reaction, ref_ts, event_ts));
    }
}

setInterval(updateCheerTimes, CHEER_UPDATE_INTERVAL);

const getCheerCounts = () => {
    const cheerCounts = {};
    for (let reaction in cheerCollection) {
        cheerCounts[reaction] = cheerTimes[reaction].length;
        console.log(reaction, cheerCounts[reaction]);
    }
    return cheerCounts;
}

// initialize the installProvider
const installer = new InstallProvider({
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    stateSecret: 'my-state-secret'
});
// also listen to /cheers to return cheer counts per reaction
https
    .createServer((req, res) => {
        const path = url.parse(req.url).pathname;
        if (path === "/slack/oauth_redirect"){
            console.log("Handling oauth callback");
            installer.handleCallback(req, res);
            return;
        }
        console.log("Cheer server received request: ", path);
        res.writeHead(200, { 'Content-Type': 'Application/json' });
        res.write(JSON.stringify(getCheerCounts(), null, 2));
        res.end();
    }).listen(SERVER_PORT, err => {
        if (err) {
            return console.log("something bad happened", err);
        }
        console.log(`cheer server is listening on ${SERVER_PORT}`);
    });



/* PROXY SERVER */
const HOTEL_PORT = 5017;
const proxy = httpProxy.createProxy();
const proxyRules = new HttpProxyRules({
    rules: {
        "/slack/events": `http://localhost:${BOT_PORT}/slack/events`,
        "/slack/oauth_redirect": `http://localhost:${SERVER_PORT}/slack/oauth_redirect`,
        "/cheers": `http://localhost:${SERVER_PORT}/cheers`,
        "/": `http://localhost:${CLIENT_PORT}/`
    },
    default: `http://localhost:${BOT_PORT}`
});

https
    .createServer((req, res) => {
        let target = proxyRules.match(req);
        console.log("------------------------------------------");
        console.log(`target:--- ${target}`);
        return proxy.web(req, res, {
            changeOrigin: true,
            target: target,
            secure: false
        });
    })
    .listen(HOTEL_PORT, err => {
        if (err) {
            return console.log("something bad happened", err);
        }
        console.log(`proxy server is listening on ${HOTEL_PORT}`);
    });
