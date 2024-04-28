const express = require('express');
const axios = require('axios');
const path = require('path');
const DiscordOAuth2 = require('discord-oauth2');
const functions = require("../util/functions/functions.js");
const User = require("../models/user.js");
const log = require("../util/structs/log.js")
require('dotenv').config({ path: path.resolve(__dirname, 'config', '.env') });


const app = express();
const oauth = new DiscordOAuth2();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'resources', 'registerweb'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('../resources/registerweb'));

app.get('/', function(req, res) {
    const authorizeUrl = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_AUTH_URL)}&response_type=code&scope=identify+guilds+guilds.join`;
    res.render('index', { authorizeUrl });
});

app.get('/auth/callback', async (req, res) => {
    const code = req.query.code;

    try {
        const tokenResponse = await oauth.tokenRequest({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            code,
            scope: 'identify+guilds+email+guilds.join',
            grantType: 'authorization_code',
            redirectUri: process.env.DISCORD_AUTH_URL,
        });

        const { access_token } = tokenResponse;
        const userResponse = await axios.get('https://discord.com/api/v10/users/@me', {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const { id, username, avatar } = userResponse.data;
        const profilePictureUrl = `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`;

        const guildsResponse = await axios.get('https://discord.com/api/v10/users/@me/guilds', {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        const userGuildIds = guildsResponse.data.map(guild => guild.id);
        const desiredGuildId = '1130704742113357834';

        if (!userGuildIds.includes(desiredGuildId)) {
            const addGuildMemberResponse = await axios.put(`https://discord.com/api/v10/guilds/${desiredGuildId}/members/${id}`, {
                access_token,
                roles: [],
            }, {
                headers: { Authorization: `Bot ${process.env.VERIFY_TOKEN}` },
            });

        //    log.web(`User ${username} added to the guild.`);
        }

        const userExists = await checkUserExists(id);

        if (userExists) {
          //  log.web("User exists:", username);
            return res.render('account', {
                username,
                profilePictureUrl,
                email: userExists.email,
                discordId: id
            });
        } else {
          //  log.web("User does not exist:", username);
            res.render('register', { id, username, profilePictureUrl, discordUsername: username });
        }

    } catch (error) {
        return res.render('error', { error: error.message });
    }
});

async function checkUserExists(discordId) {
    try {
        const user = await User.findOne({ discordId });
        return user; 
    } catch (error) {
        log.debug(error);
        throw new Error('Error checking user existence.');
    }
}

module.exports = app;
