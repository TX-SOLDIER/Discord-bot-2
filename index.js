// ========================================
// IMPORTS
// ========================================
const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder 
} = require('discord.js');
require('dotenv').config();
const express = require("express");

// ========================================
// CONFIG
// ========================================
const PREFIX = "★"; // Your custom prefix

// ========================================
// KEEP ALIVE SERVER (RENDER)
// ========================================
const app = express();
app.get("/", (req, res) => res.send("Bot 2 is alive!"));
app.listen(10000, () => console.log("Keep-alive server running"));

// ========================================
// CLIENT SETUP
// ========================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ========================================
// REGISTER SLASH COMMANDS
// ========================================
const commands = [
  new SlashCommandBuilder()
    .setName("hello")
    .setDescription("Replies with hello from Bot 2")
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

// ========================================
// READY EVENT
// ========================================
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    console.log("🔄 Registering slash commands...");

    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );

    console.log("✅ Slash commands registered globally.");
  } catch (error) {
    console.error(error);
  }
});

// ========================================
// PREFIX COMMAND HANDLER
// ========================================
client.on('messageCreate', message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "hello") {
    message.reply("Hello from Bot 2 (Prefix Version) 👋");
  }
});

// ========================================
// SLASH COMMAND HANDLER
// ========================================
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "hello") {
    await interaction.reply("Hello from Bot 2 (Slash Version) 👋");
  }
});

// ========================================
// LOGIN
// ========================================
client.login(process.env.BOT_TOKEN);
