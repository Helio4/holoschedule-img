const Discord = require("discord.js");
const config = require("./config.json");
const fs = require("fs");
const client = new Discord.Client();
const services = require("./data/services.js");

//Reads the events at the ./events/ folder
fs.readdir("./events/", (err, files) => {
  if (err) return console.error(err);
  files.forEach(file => {
    let eventFunction = require(`./events/${file}`);
    let eventName = file.split(".")[0];
    client.on(eventName, (...args) => eventFunction.run(client, ...args));
  });
});

//Message manager
client.on("message", async function (message) {
  if (message.author.bot) return;
  if (message.channel.type === "dm") return;
  let guildConfig = await services.getGuild(message.guild); //Gets the guildConfig from the database
  if (!message.content.startsWith(guildConfig.prefix)) return;
  let args = message.content.substring(guildConfig.prefix.length).split(" ");
  let command = args.shift().toLowerCase();
  try {
    let commandFile = require(`./commands/${command}.js`);
    commandFile.run(client, message, args, guildConfig);
  } catch (err) {
    console.log(err);
    return;
  }
});

const scrapTest = function () {

};

client.login(config.token);