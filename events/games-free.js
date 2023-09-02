const Discord = require("discord.js");
const axios = require("axios");
const cron = require("node-cron");

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});
const TOKEN = process.env.TOKEN; // Substitua pelo seu token do bot
const channelId = "1147218408228790343"; // Substitua pelo ID do canal de texto

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    bot.on("ready", () => {
      console.log(`games-free carregado com sucesso! ${bot.user.tag}`);

      // Iniciar a tarefa agendada para exibir os jogos automaticamente (a cada 24 horas neste exemplo)
      cron.schedule("0 0 * * *", async () => {
        const channel = bot.channels.cache.get(channelId);

        if (!channel) {
          console.error(`Canal com ID ${channelId} não encontrado.`);
          return;
        }

        try {
          const [epicGames, gog, steam] = await Promise.all([
            getEpicGamesFreeGames(),
            getGOGFreeGames(),
            getSteamFreeGames(),
          ]);

          const embed = new Discord.MessageEmbed()
            .setTitle("Jogos Gratuitos com Desconto de 100%")
            .addField("Epic Games", epicGames.join("\n"), true)
            .addField("GOG.com", gog.join("\n"), true)
            .addField("Steam", steam.join("\n"), true);

          channel.send(embed);
        } catch (error) {
          console.error(error);
          channel.send("Ocorreu um erro ao buscar os jogos gratuitos.");
        }
      });
    });

    bot.login(TOKEN);

    // Resto do código, incluindo as funções getEpicGamesFreeGames, getGOGFreeGames e getSteamFreeGames

    // Função para obter jogos gratuitos da Epic Games
    async function getEpicGamesFreeGames() {
      const response = await axios.get(
        "https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions"
      );
      const data = response.data;

      const games = data.data.Catalog.searchStore.elements
        .filter(
          (game) =>
            game.promotions && game.promotions.promotionalOffers.length > 0
        )
        .map((game) => {
          const { title, price } = game.price.totalPrice;
          return `${title} - Preço: R$ ${price.toFixed(2)}`;
        });

      return games;
    }

    // Função para obter jogos gratuitos da GOG.com
    async function getGOGFreeGames() {
      const response = await axios.get(
        "https://www.gog.com/games/ajax/filtered?mediaType=game&sortBy=popularity"
      );
      const data = response.data;

      const games = data.products
        .filter((game) => game.price.isFree && game.title)
        .map((game) => {
          const { title, price } = game;

          return `${title} - Preço: R$ ${price.amount.toFixed(2)}`;
        });

      return games;
    }

    // Função para obter jogos gratuitos da Steam
    async function getSteamFreeGames() {
      const response = await axios.get(
        "https://store.steampowered.com/api/featuredcategories"
      );
      const data = response.data;

      const freeGames = data.find(
        (category) => category.tag === "Free to Play"
      ).items;

      const games = freeGames.map((game) => {
        const { name, final_price } = game;
        const priceInBRL = (final_price / 100).toFixed(2);

        return `${name} - Preço: R$ ${priceInBRL}`;
      });

      return games;
    }
  },
};
