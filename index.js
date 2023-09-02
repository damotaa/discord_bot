require("dotenv/config");
const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  Collection,
  GatewayIntentBits,
  IntentsBitField,
  EmbedBuilder,
} = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Commands Handling //

client.commands = new Collection();
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

//Event Listener

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

//----------------------------Chat GPT -------------------//

const configuration = new Configuration({
  apiKey: process.env.API_KEY,
});

const openai = new OpenAIApi(configuration);

const MAX_MESSAGE_LENGTH = 1999;

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== process.env.CHANNEL_ID) return;
  if (message.content.startsWith("!")) return;

  let conversationLog = [
    { role: "system", content: "You are a friendly chatbot." },
  ];

  try {
    await message.channel.sendTyping();
    let prevMessages = await message.channel.messages.fetch({ limit: 15 });
    prevMessages.reverse();

    prevMessages.forEach((msg) => {
      if (msg.content.startsWith("!")) return;
      if (msg.author.id !== client.user.id && message.author.bot) return;
      if (msg.author.id == client.user.id) {
        conversationLog.push({
          role: "assistant",
          content: msg.content,
          name: msg.author.username
            .replace(/\s+/g, "_")
            .replace(/[^\w\s]/gi, ""),
        });
      }

      if (msg.author.id == message.author.id) {
        conversationLog.push({
          role: "user",
          content: msg.content,
          name: message.author.username
            .replace(/\s+/g, "_")
            .replace(/[^\w\s]/gi, ""),
        });
      }
    });

    const result = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: conversationLog,
      // max_tokens: 256, // limit token usage
    });

    let response = result.data.choices
      .map((choice) => choice.message.content)
      .join("\n")
      .trim();

    while (response.length > MAX_MESSAGE_LENGTH) {
      const chunk = response.substring(0, MAX_MESSAGE_LENGTH);
      response = response.substring(MAX_MESSAGE_LENGTH);

      message.reply(chunk);
    }

    // Check if there's any remaining text to send
    if (response.length > 0) {
      message.reply(response);
    }
  } catch (error) {
    console.log(`ERR: ${error}`);
  }
});




//----------------------------Chat GPT End -------------------//

client.login(process.env.TOKEN);
