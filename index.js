require('dotenv').config()
const { App, LogLevel } = require('@slack/bolt');

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
const slackUtil = new SlackUtil(withAuth(app.client.conversations.history), withAuth(app.client.users.list), 10000, 10000);

const reactionToSounds = {
    "clap" : {
        "file" : "applause.mp3",
        "trigger_count" : 5,
        "timespan_ms" : 3000,
        "scale" : "linear"
    }
};

// The echo command simply echoes on command
app.command('/echo', async ({ command, ack, say }) => {
    // Acknowledge command request
    await ack();

    await say(`${command.text}`);
});

// How to get most recent message -

app.event('reaction_added', async ({ context, event }) => {
    console.log('\n Added Reaction: ', event, event.reaction, event.ts);

});
app.event('reaction_removed', async ({ context, event }) => {
    console.log('\n Removed Reaction: ', event, event.reaction, event.ts);
});

(async () => {
    // Start your app
    await app.start(process.env.PORT || 3000);

    console.log('⚡️ Bolt app is running!');
})();