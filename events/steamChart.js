const { Events } = require("discord.js");
const axios = require("axios");
const SteamAPI = require("steamapi");
require("dotenv/config");
const steamApiKey = process.env.SteamApiKey;
const steam = new SteamAPI(steamApiKey);

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    const { EmbedBuilder } = require("discord.js");

    const prefix = "!";

    client.on("ready", () => {
      console.log(`Evento ${"Steam Updates! Carregado com Sucesso!"}!`);

      updateChannel(); // Atualiza o canal no início para ter a lista atual disponível

      // Atualiza o canal a cada 20 minutos (1200000ms)
      setInterval(updateChannel, 600000);
    });

    async function getTop10GameIDs() {
      try {
        const response = await axios.get("https://steamcharts.com/top");
        const gameList = response.data.substr(
          response.data.indexOf("<tbody>") + 7
        );
        const topGameIDs = gameList
          .split("</tr>")
          .slice(0, 10)
          .map((row) => {
            const columns = row.split("</td>");
            const gameID = columns[1].split('">')[1].split("/app/")[1];
            return gameID;
          });
        return topGameIDs;
      } catch (error) {
        console.error("Erro ao obter os top 10 jogos da Steam:", error);
        return [];
      }
    }

    async function getGameDetails(gameID) {
      try {
        const game = await steam.getGameDetails(gameID);
        return {
          name: game.name,
          logoURL: game.header_image, // Steam logo image URL
        };
      } catch (error) {
        console.error(
          "Erro ao obter detalhes do jogo com ID",
          gameID,
          ":",
          error
        );
        return null;
      }
    }

    // ...

    // ...

    async function getPlayerCount(gameID) {
      try {
        const response = await axios.get(
          `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${gameID}`
        );
        const playerCount = response.data.response.player_count;
        return playerCount;
      } catch (error) {
        console.error(
          "Erro ao obter o número de jogadores para o jogo com ID",
          gameID,
          ":",
          error
        );
        return null;
      }
    }

    // ...

    async function getTop10Games() {
      const topGameIDs = await getTop10GameIDs();
      const gamesWithDetails = await Promise.all(
        topGameIDs.map(async (gameID, index) => {
          const details = await getGameDetails(gameID);
          if (details !== null) {
            const { name, logoURL } = details;
            const players = await getPlayerCount(gameID);
            const gameName = name || "Nome do jogo não disponível";
            return {
              index: index + 1,
              name: gameName,
              logoURL,
              players: players || "Não disponível",
            };
          }
          return null;
        })
      );

      return gamesWithDetails.filter((details) => details !== null);
    }

    // ...

    // ...

    // ...

    // Keep track of the message IDs of the previous status messages
    const previousStatusMessageIDs = [];

    // ...

    let lastUpdateMessageID = null;

    async function updateChannel() {
      // Delete the previous status messages if there are any
      if (previousStatusMessageIDs.length > 0) {
        const channel = client.channels.cache.get("1131624217780170863"); // Replace with the ID of the channel where you sent the previous status messages.

        if (channel) {
          try {
            await channel.bulkDelete(previousStatusMessageIDs);
          } catch (error) {
            console.error("Erro ao deletar as mensagens anteriores:", error);
          }
        }
      }

      const top10Games = await getTop10Games();
      const channel = client.channels.cache.get("1131624217780170863"); // Replace with the ID of the channel where you want to send the updates.

      if (channel) {
        // Send the new update message
        try {
          for (const gameDetails of top10Games) {
            const gameImageEmbed = new EmbedBuilder()
              .setTitle(`**${gameDetails.index}. ${gameDetails.name}**`)
              .setImage(gameDetails.logoURL)
              .setDescription(`Jogadores: ${gameDetails.players}`);

            const newMessage = await channel.send({ embeds: [gameImageEmbed] });
            previousStatusMessageIDs.push(newMessage.id);
          }
        } catch (error) {
          console.error("Erro ao enviar a mensagem de atualização:", error);
        }
      }
    }

    // ...

    client.on("messageCreate", async (message) => {
      if (!message.content.startsWith(prefix) || message.author.bot) return;

      const args = message.content.slice(prefix.length).trim().split(/ +/);
      const command = args.shift().toLowerCase();

      if (command === "atualizar") {
        if (!message.member.permissions.has("ADMINISTRATOR")) {
          return message.reply(
            "Você não tem permissão para executar esse comando."
          );
        }

        await updateChannel();
        message.reply("Canal atualizado com os jogos mais jogados da Steam:");
      }
    });

    client.login(process.env.TOKEN);
  },
};
