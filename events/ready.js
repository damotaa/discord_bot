const { Events } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Event handler Ready! Logged in as ${client.user.tag} \n`);
  },
};
