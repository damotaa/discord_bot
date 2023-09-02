const Discord = require('discord.js');
const mcUtil = require('minecraft-server-util');
require("dotenv/config");

const {
  GatewayIntentBits,
  IntentsBitField,
} = require("discord.js");


const MINECRAFT_SERVER_IP = 8196; // Porta padrão para RCON
const MINECRAFT_SERVER_PORT = 'mineMine1.';


const client = new Discord.Client({
  intents: [
    GatewayIntentBits.Guilds,
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    GatewayIntentBits.Guilds,
  ],
});

client.once('ready', () => {
  console.log('Bot está online!');
});

// Função para enviar mensagens para o Discord
function sendToDiscord(message) {
  const channelID = '1131628609841410048'; // Troque pelo ID do canal onde deseja enviar as mensagens

  const channel = client.channels.cache.get(channelID);
  if (channel) {
    channel.send(message);
  } else {
    console.log(`Canal não encontrado: ${channelID}`);
  }
}

// Função para enviar mensagens do console do servidor Minecraft para o Discord
function sendServerConsoleToDiscord() {
  mcUtil.status(MINECRAFT_SERVER_IP, { port: MINECRAFT_SERVER_PORT })
    .then((response) => {
      const onlinePlayers = response.onlinePlayers;
      const maxPlayers = response.maxPlayers;
      const version = response.version;
      const motd = response.description.text;

      const message = `**Informações do servidor Minecraft:**\nOnline players: ${onlinePlayers}/${maxPlayers}\nVersão: ${version}\nMensagem do Dia: ${motd}`;

      sendToDiscord(message);
    })
    .catch((error) => {
      console.error('Erro ao obter informações do servidor Minecraft:', error);
    });
}

// Verificar a cada 1 minuto (60000 milissegundos)
setInterval(sendServerConsoleToDiscord, 60000);

console.log(sendToDiscord)
console.log(sendServerConsoleToDiscord)
console.error(sendServerConsoleToDiscord)

client.login(process.env.TOKEN);