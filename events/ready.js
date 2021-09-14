const sql = require('sqlite');
const config = require('../config.json');

exports.run = (client) => {
    console.log("Opening database...");
    sql.open("./data/db.sqlite", {
        cached: true
    }).then(() => {
        console.log(' - Database opened.');
        sql.run("CREATE TABLE IF NOT EXISTS guilds (guildId VARCHAR(18), prefix VARCHAR(10) NOT NULL, lastSchedule TEXT,  PRIMARY KEY (guildId))")
            .catch(console.error);
    }).catch(console.error);
    console.log(` - Ready to serve in ${client.channels.size} channels on ${client.guilds.size} servers, for a total of ${client.users.size} users.`);
};