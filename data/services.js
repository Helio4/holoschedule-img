const sql = require('sqlite');
const config = require('../config.json');

module.exports = {

    //#region Guild
    getGuild: async function (guild) {
        var row = await sql.get(`SELECT * FROM guilds WHERE guildId = ${guild.id}`).catch(console.error);
        if (!row) {
            await this.addGuild(guild).catch(() => {
                console.error;
                return;
            });
            row = this.getGuild(guild);
        }
        return row;
    },

    addGuild: async function (guild, prefix) {
        if (prefix === undefined) prefix = config.prefix;
        await sql.run(`INSERT INTO guilds (guildId, prefix) VALUES (?, ?)`, [guild.id, prefix]);
        var members = guild.members.array();
        for (var m of members) {
            if (!m.user.bot) this.addUser(m.user, guild);
        }
    },

    delGuild: function (guild) {
        sql.run(`DELETE FROM guilds WHERE guildId = ${guild.id}`).catch(console.error);
    },

    updateGuild: function (row) {
        sql.run(`UPDATE guilds SET prefix = "${row.prefix}", lastSchedule = '${row.lastSchedule}' WHERE guildId = ${row.guildId}`).catch(console.error);
    }
    //#endregion
}