'use strict';

// ★ SOLDIER² — Ultimate Mod & Rank Authority System ★ \\
//  TX-SOLDIER | Prefix: × \\

// ============================================================
// ☆ SECTION 1 START: IMPORTS & CLIENT SETUP ☆
// ============================================================
//GOOGLE GEMINI\\
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
// AI memory: stores last 4 exchanges per user { userId: [{role, parts}] }
const aiMemory = new Map();
const AI_MEMORY_LIMIT = 4;

const AI_SYSTEM_PROMPT = `You are SOLDIER², a Discord bot assistant. 
TX_SOLDIER is your creator — always refer to them with respect. 
Keep all responses SHORT (2-4 sentences max). Never write long paragraphs. 
Be helpful, direct, concise and with a military attitude willing to protect `;
//IMPORTS\\
const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    Partials,
    AttachmentBuilder,
} = require('discord.js');
require('dotenv').config();
const express = require('express');
const fs      = require('fs');
const { createCanvas, loadImage } = require('canvas');

//DISCORD CLIENT\\
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.GuildMember,
        Partials.User,
        Partials.ThreadMember
    ]
});

// ☆ END: IMPORTS & CLIENT SETUP ☆ \\

// ============================================================
// ☆ SECTION 2 START: CONSTANTS & RANKS ☆ \\
// ============================================================

const JSONBIN_ID  = process.env.JSONBIN_ID;
const JSONBIN_KEY = process.env.JSONBIN_KEY;
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_ID}`;
const PREFIX    = '×';
const OWNER_ID  = '782155864134909952';
const SYM_GENERAL  = '★';
const SYM_OFFICER  = '●';
const SYM_ENLISTED = '◆';
const GENERAL_RANKS = [
    '★★★★★ FIVE STAR GENERAL',
    '★★★★ General',
    '★★★ Lieutenant General',
    '★★ Major General',
    '★ Brigadier General',
];

const OFFICER_RANKS = [
    '●●●●●● Colonel',
    '●●●●● Lieutenant Colonel',
    '●●●● Major',
    '●●● Captain',
    '●● First Lieutenant',
    '● Second Lieutenant',
];

const ENLISTED_RANKS = [
    '◆◆◆◆◆◆◆◆◆◆ Command Sergeant Major',
    '◆◆◆◆◆◆◆◆◆ Sergeant Major',
    '◆◆◆◆◆◆◆◆ Master Sergeant',
    '◆◆◆◆◆◆◆ Sergeant First Class',
    '◆◆◆◆◆◆ Staff Sergeant',
    '◆◆◆◆◆ Sergeant',
    '◆◆◆◆ Corporal',
    '◆◆◆ Private First Class',
    '◆◆ Private',
];

const GIVEAWAY_GIF_BOTTOM = "https://media4.giphy.com/media/v1.Y2lkPTZjMDliOTUyNWpkMTNtcnBteWhtZHN4eWNoZmJpYTFpN2NqMnBhbWZ6d3Q2bDFvaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/JqTZqf0HTAy9yOo38W/giphy.gif";
const GIVEAWAY_GIF_SIDE = "https://media4.giphy.com/media/v1.Y2lkPTZjMDliOTUyNm5wdW0xYmhqenZ2OHhkeDMxNjFwYjlxd3g1b21odzR4aDM1OWZrayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/1sPNdGsGsiPV9Tyf5F/giphy.gif";
const GIVEAWAY_WINNER_GIF = "https://media2.giphy.com/media/v1.Y2lkPTZjMDliOTUyOHlpaTBhNDdidGY2eWcxbXZ0eHMzaWVjb3UzdXNucmxyNm05bXJ4diZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Z2XIQz9AXISznANAbB/giphy.gif";


const CSM_RANK     = '◆◆◆◆◆◆◆◆◆◆ Command Sergeant Major';
const SGM_RANK     = '◆◆◆◆◆◆◆◆◆ Sergeant Major';
const COLONEL_RANK = '●●●●●● Colonel';
const GOLD_SYMBOL = '​☉';
const XP_SYMBOL = '✰';
const PRESTIGE_SYMBOL = '☠';
const MAX_LEVEL = 100;
const MAX_PRESTIGE = 10;
const XP_PER_LEVEL = 500;
const XP_COOLDOWN = 10000; //10 seconds between XP gains\\
const MASTER_LOG_CHANNELS = [
    '1355199085631508641',
    'PUT_CHANNEL_ID_2_HERE'
];
// ============================================================
//  POKÉ STORE — ITEM DEFINITIONS
// ============================================================
const POKE_ITEMS = {
    pokeballs: {
        'poke-ball':       { price: 200,    catchMult: 1,    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',        label: 'Poké Ball',       desc: 'A basic Ball for catching wild Pokémon.' },
        'great-ball':      { price: 600,    catchMult: 1.5,  sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png',       label: 'Great Ball',      desc: 'Higher catch rate than a Poké Ball.' },
        'ultra-ball':      { price: 1200,   catchMult: 2,    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png',       label: 'Ultra Ball',      desc: 'Excellent catch rate.' },
        'master-ball':     { price: 100000, catchMult: 255,  sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png',      label: 'Master Ball',     desc: 'Catches any Pokémon without fail.' },
        'safari-ball':     { price: 500,    catchMult: 1.5,  sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/safari-ball.png',      label: 'Safari Ball',     desc: 'Used in the Safari Zone.' },
        'fast-ball':       { price: 800,    catchMult: 4,    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/fast-ball.png',        label: 'Fast Ball',       desc: '4× catch rate on fast Pokémon.' },
        'level-ball':      { price: 800,    catchMult: 2,    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/level-ball.png',       label: 'Level Ball',      desc: 'Better for lower level Pokémon.' },
        'lure-ball':       { price: 800,    catchMult: 3,    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lure-ball.png',        label: 'Lure Ball',       desc: '3× on Pokémon caught while fishing.' },
        'heavy-ball':      { price: 800,    catchMult: 2,    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/heavy-ball.png',       label: 'Heavy Ball',      desc: 'Better for heavier Pokémon.' },
        'love-ball':       { price: 800,    catchMult: 8,    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/love-ball.png',        label: 'Love Ball',       desc: '8× if opposite gender.' },
        'friend-ball':     { price: 1000,   catchMult: 1,    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/friend-ball.png',      label: 'Friend Ball',     desc: 'Raises caught Pokémon friendship.' },
        'moon-ball':       { price: 1000,   catchMult: 4,    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/moon-ball.png',        label: 'Moon Ball',       desc: '4× on Moon Stone evolvers.' },
        'sport-ball':      { price: 300,    catchMult: 1.5,  sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/sport-ball.png',       label: 'Sport Ball',      desc: 'Used in Bug-Catching Contests.' },
        'net-ball':        { price: 1000,   catchMult: 3.5,  sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/net-ball.png',         label: 'Net Ball',        desc: '3.5× on Water and Bug types.' },
        'dive-ball':       { price: 1000,   catchMult: 3.5,  sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dive-ball.png',        label: 'Dive Ball',       desc: '3.5× on Pokémon while diving.' },
        'nest-ball':       { price: 1000,   catchMult: 3,    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/nest-ball.png',        label: 'Nest Ball',       desc: 'Better for lower level Pokémon.' },
        'repeat-ball':     { price: 1000,   catchMult: 3.5,  sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/repeat-ball.png',      label: 'Repeat Ball',     desc: '3.5× on previously caught species.' },
        'timer-ball':      { price: 1000,   catchMult: 4,    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/timer-ball.png',       label: 'Timer Ball',      desc: 'Gets better the more turns pass.' },
        'luxury-ball':     { price: 1500,   catchMult: 1,    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/luxury-ball.png',      label: 'Luxury Ball',     desc: 'Raises friendship of caught Pokémon fast.' },
        'premier-ball':    { price: 200,    catchMult: 1,    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/premier-ball.png',     label: 'Premier Ball',    desc: 'A rare Ball made for special occasions.' },
        'dusk-ball':       { price: 1000,   catchMult: 3.5,  sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dusk-ball.png',        label: 'Dusk Ball',       desc: '3.5× at night or in caves.' },
        'heal-ball':       { price: 300,    catchMult: 1,    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/heal-ball.png',        label: 'Heal Ball',       desc: 'Fully restores caught Pokémon.' },
        'quick-ball':      { price: 1000,   catchMult: 5,    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/quick-ball.png',       label: 'Quick Ball',      desc: '5× catch rate on the first turn.' },
        'cherish-ball':    { price: 5000,   catchMult: 1,    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/cherish-ball.png',     label: 'Cherish Ball',    desc: 'A very rare Ball used for events.' },
        'park-ball':       { price: 300,    catchMult: 255,  sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/park-ball.png',        label: 'Park Ball',       desc: 'Guaranteed catch in the Pal Park.' },
        'dream-ball':      { price: 3000,   catchMult: 4,    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dream-ball.png',       label: 'Dream Ball',      desc: '4× on sleeping Pokémon.' },
        'beast-ball':      { price: 5000,   catchMult: 5,    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/beast-ball.png',       label: 'Beast Ball',      desc: '5× on Ultra Beasts.' },
    },
    healing: {
        'potion':          { price: 300,    heal: 20,   sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png',               label: 'Potion',          desc: 'Restores 20 HP to one Pokémon.' },
        'super-potion':    { price: 700,    heal: 50,   sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/super-potion.png',         label: 'Super Potion',    desc: 'Restores 50 HP to one Pokémon.' },
        'hyper-potion':    { price: 1200,   heal: 120,  sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/hyper-potion.png',         label: 'Hyper Potion',    desc: 'Restores 120 HP to one Pokémon.' },
        'max-potion':      { price: 2500,   heal: 9999, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/max-potion.png',           label: 'Max Potion',      desc: 'Fully restores HP to one Pokémon.' },
        'full-restore':    { price: 3000,   heal: 9999, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/full-restore.png',         label: 'Full Restore',    desc: 'Fully restores HP and cures status.' },
        'revive':          { price: 1500,   revive: true, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/revive.png',             label: 'Revive',          desc: 'Revives a fainted Pokémon to half HP.' },
        'max-revive':      { price: 4000,   revive: true, full: true, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/max-revive.png', label: 'Max Revive', desc: 'Revives a fainted Pokémon to full HP.' },
        'antidote':        { price: 200,    cures: 'poison',   sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/antidote.png',      label: 'Antidote',        desc: 'Cures poison.' },
        'burn-heal':       { price: 200,    cures: 'burn',     sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/burn-heal.png',      label: 'Burn Heal',       desc: 'Cures a burn.' },
        'ice-heal':        { price: 200,    cures: 'freeze',   sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ice-heal.png',       label: 'Ice Heal',        desc: 'Cures a frozen Pokémon.' },
        'awakening':       { price: 200,    cures: 'sleep',    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/awakening.png',      label: 'Awakening',       desc: 'Wakes up a sleeping Pokémon.' },
        'paralyze-heal':   { price: 200,    cures: 'paralysis',sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/paralyze-heal.png', label: 'Paralyze Heal',   desc: 'Cures paralysis.' },
        'full-heal':       { price: 600,    cures: 'all',      sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/full-heal.png',      label: 'Full Heal',       desc: 'Cures all status conditions.' },
        'ether':           { price: 1200,   pp: 10,    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ether.png',                  label: 'Ether',           desc: 'Restores 10 PP to one move.' },
        'max-ether':       { price: 2000,   pp: 9999,  sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/max-ether.png',              label: 'Max Ether',       desc: 'Fully restores PP to one move.' },
        'elixir':          { price: 3000,   ppAll: 10, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/elixir.png',                 label: 'Elixir',          desc: 'Restores 10 PP to all moves.' },
        'max-elixir':      { price: 4500,   ppAll: 9999, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/max-elixir.png',           label: 'Max Elixir',      desc: 'Fully restores all move PP.' },
    },
    berries: {
        'oran-berry':      { price: 150,    heal: 10,  sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/oran-berry.png',             label: 'Oran Berry',      desc: 'Restores 10 HP when held.' },
        'sitrus-berry':    { price: 400,    heal: 25,  sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/sitrus-berry.png',           label: 'Sitrus Berry',    desc: 'Restores 25 HP when held.' },
        'lum-berry':       { price: 500,    cures: 'all', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lum-berry.png',           label: 'Lum Berry',       desc: 'Cures any status condition.' },
        'chesto-berry':    { price: 200,    cures: 'sleep',    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/chesto-berry.png',   label: 'Chesto Berry',    desc: 'Cures sleep.' },
        'pecha-berry':     { price: 200,    cures: 'poison',   sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/pecha-berry.png',    label: 'Pecha Berry',     desc: 'Cures poison.' },
        'rawst-berry':     { price: 200,    cures: 'burn',     sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rawst-berry.png',    label: 'Rawst Berry',     desc: 'Cures a burn.' },
        'aspear-berry':    { price: 200,    cures: 'freeze',   sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/aspear-berry.png',   label: 'Aspear Berry',    desc: 'Cures a frozen Pokémon.' },
        'cheri-berry':     { price: 200,    cures: 'paralysis',sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/cheri-berry.png',    label: 'Cheri Berry',     desc: 'Cures paralysis.' },
        'leppa-berry':     { price: 600,    pp: 10,    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/leppa-berry.png',            label: 'Leppa Berry',     desc: 'Restores 10 PP to one move.' },
        'figy-berry':      { price: 300,    heal: 'third', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/figy-berry.png',         label: 'Figy Berry',      desc: 'Restores 1/3 max HP in battle.' },
        'razz-berry':      { price: 100,    catchBoost: 1.5, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/razz-berry.png',       label: 'Razz Berry',      desc: '1.5× catch rate when used during a catch.' },
        'nanab-berry':     { price: 100,    catchBoost: 1.3, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/nanab-berry.png',      label: 'Nanab Berry',     desc: 'Calms wild Pokémon slightly.' },
        'pinap-berry':     { price: 200,    catchBoost: 2,   sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/pinap-berry.png',      label: 'Pinap Berry',     desc: '2× catch rate on next throw.' },
        'golden-razz-berry': { price: 800,  catchBoost: 2.5, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/golden-razz-berry.png', label: 'Golden Razz',   desc: '2.5× catch rate when used.' },
    },
};

//SLASH COMMANDS\\
const slashCommands = [
    new SlashCommandBuilder().setName('hello').setDescription('Say hello to SOLDIER²'),
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

// ☆ END: CONSTANTS & RANKS ☆ \\

// ============================================================
// ☆ SECTION 3 START: DATA PERSISTENCE ☆ \\
// ============================================================

let botData = {
    generals:           {},
    officers:           {},
    enlisted:           {},
    warnings:           {},
    modlog:             {},
    notes:              {},
    watchlist:          {},
    flaggedUsers:       {},
    trackedUsers:       {},
    blacklistedUsers:   {},
    blacklistedServers: {},
    automod:            {},
    giveaways:          {},
    birthdays:          {},  
    birthdayChannels:   {},  
    birthdayEnabled:    {},  
    birthdayConfig:     {},   
    antiraidSnapshot:   {},
    xpCooldowns:        {},
    logChannels:        {},
    qotd:               {},
    mutedRoles:         {},
    verifyRoles:        {},
    reactionRoles:      {},
    staffList:          {},
    dutyStatus:         {},
    autoDeleteTargets:  {},
    counting:           {},
    timedBans:          [],
    timedMutes:         [],
    cardSettings:       {},
    commandLog:         {},
    disabledCommands:   {},
    serverPrefixes:     {},
    catchBerryBoost:    {},
    pokeBags:           {},
    pokemon:            {},
    pokemonSpawnChannels: {},
    pokemonCache:       {},
    activeSpawns:       {},
    activeBattles:      {},
    welcomeMessages:    {},   // { guildId: { channelId, color, message, gif } }
    leaveMessages:      {},   // { guildId: { channelId, color, message, gif } }
    currency:           {},      // { userId: { balance: 1000, lastUpdated: timestamp } }
    xp:                 {},      // { guildId: { userId: { xp, level, prestige } } }
    xpCooldowns:        {},      // { guildId: { userId: timestamp } }
    levelupChannels:    {},      // { guildId: channelId }
    };

let isDirty   = false;
let saveTimer = null;

async function loadData() {
    try {
        const res  = await fetch(`${JSONBIN_URL}/latest`, {
            headers: { 'X-Master-Key': JSONBIN_KEY }
        });
        const json = await res.json();
        if (json.record) {
            botData = { ...botData, ...json.record };
            console.log('✅ Bot data loaded from JSONBin.');
        }
    } catch (e) { console.error('❌ JSONBin load error:', e); }
}

function markDirty() { isDirty = true; }

function getCleanData() {
    const clean = { ...botData };
    delete clean.xpCooldowns;
    delete clean.commandLog;
    delete clean.dutyStatus;
    delete clean.gameCooldowns;
    delete clean.antiraidSnapshot;
    return clean;
}

function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
        if (!isDirty) return;
        try {
            await fetch(JSONBIN_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_KEY
                },
                body: JSON.stringify(getCleanData())
            });
            isDirty = false;
            console.log('💾 Saved to JSONBin.');
        } catch (e) { console.error('❌ JSONBin save error:', e); }
    }, 2000);
}

async function forceSaveNow() {
    try {
        const res = await fetch(JSONBIN_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_KEY
            },
            body: JSON.stringify(getCleanData())
        });
        isDirty = false;
        const json = await res.json();
        const bytes = JSON.stringify(getCleanData()).length;
        const kb = (bytes / 1024).toFixed(2);
        return { success: true, kb };
    } catch (e) {
        console.error('❌ Force save error:', e);
        return { success: false };
    }
}

// ☆ END: DATA PERSISTENCE ☆ \\

// ============================================================
// ☆SECTION 4 START: HELPER FUNCTIONS & LOGIC ENGINES ☆ \\
// ============================================================

//UTILITY FUNCTIONS\\
function getRankValue(rank) {
    const all = [...GENERAL_RANKS, ...OFFICER_RANKS, ...ENLISTED_RANKS];
    const idx = all.indexOf(rank);
    return idx === -1 ? 9999 : idx;
    }

function parseDuration(str) {
    if (!str) return null;
    const match = str.match(/^(\d+)(s|m|h|d)$/i);
    if (!match) return null;
    const val  = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    const map  = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return val * map[unit];
    }

function formatDuration(ms) {
    const s = Math.floor(ms / 1000);
    if (s < 60)    return `${s}s`;
    if (s < 3600)  return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
    }

async function resolveUser(client, arg) {
    if (!arg) return null;
    const id = arg.replace(/[<@!>]/g, '');
    return client.users.fetch(id).catch(() => null);
    }

async function resolveMember(guild, arg) {
    if (!arg) return null;
    const id = arg.replace(/[<@!>]/g, '');
    return guild.members.fetch(id).catch(() => null);
    }
//MASTERLOG ENGINE\\
async function sendMasterLog(embed) {
    for (const channelId of MASTER_LOG_CHANNELS) {
        const channel = client.channels.cache.get(channelId);
        if (!channel) continue;

        channel.send({ embeds: [embed] }).catch(() => {});
    }
}

function buildMasterEmbed(title, color, fields) {
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .addFields(fields)
        .setTimestamp()
        .setFooter({ text: 'Global MasterLog System' });
}
//BIRTHDAY HELPER\\
function parseBirthday(str) {
    const parts = str.trim().split('/');
    if (parts.length < 2) return null;
    const month = parseInt(parts[0], 10);
    const day   = parseInt(parts[1], 10);
    const year  = parts[2] ? parseInt(parts[2], 10) : null;
    if (isNaN(month) || isNaN(day)) return null;
    if (month < 1 || month > 12)    return null;
    if (day   < 1 || day   > 31)    return null;
    if (year !== null && (isNaN(year) || year < 1900 || year > new Date().getFullYear())) return null;
    return { month, day, year };
}

function formatBirthday(bd) {
    const m = String(bd.month).padStart(2, '0');
    const d = String(bd.day).padStart(2, '0');
    return bd.year ? `${m}/${d}/${bd.year}` : `${m}/${d}`;
}

function buildBirthdayEmbed(client, gid, mentionStr) {
    const cfg   = botData.birthdayConfig?.[gid] || {};
    const color = cfg.color   || 0xFF69B4;
    const msg   = (cfg.message || '🎂 Happy Birthday {user}! Wishing you an amazing day! 🎉')
                    .replace('{user}', mentionStr);

    return new EmbedBuilder()
        .setColor(color)
        .setTitle('🎂 Happy Birthday!')
        .setDescription(msg)
        .setImage('https://media.giphy.com/media/g5R9dok94mrIvplmZd/giphy.gif')
        .setThumbnail('https://media.giphy.com/media/3KC2jD2QcBOSc/giphy.gif')
        .setTimestamp();
}

function scheduleBirthdayCheck() {
    function getMsUntilMidnightCentral() {
        const now      = new Date();
        const ctString = now.toLocaleString('en-US', { timeZone: 'America/Chicago' });
        const ctNow    = new Date(ctString);
        const ctMidnight = new Date(ctNow);
        ctMidnight.setHours(24, 0, 0, 0);
        return ctMidnight - ctNow;
    }

    async function runBirthdayCheck() {
        const now        = new Date();
        const ctStr      = now.toLocaleString('en-US', { timeZone: 'America/Chicago' });
        const ctDate     = new Date(ctStr);
        const todayMonth = ctDate.getMonth() + 1;
        const todayDay   = ctDate.getDate();

        for (const [gid, guildBirthdays] of Object.entries(botData.birthdays || {})) {
            if (botData.birthdayEnabled?.[gid] === false) continue;
            const channelId = botData.birthdayChannels?.[gid];
            if (!channelId) continue;
            const channel = client.channels.cache.get(channelId);
            if (!channel) continue;

            for (const [userId, bd] of Object.entries(guildBirthdays)) {
                if (bd.month === todayMonth && bd.day === todayDay) {
                    const mention = `<@${userId}>`;
                    const embed   = buildBirthdayEmbed(client, gid, mention);
                    await channel.send({ content: mention, embeds: [embed] }).catch(() => {});
                }
            }
        }
        setTimeout(runBirthdayCheck, 24 * 60 * 60 * 1000);
    }

    setTimeout(runBirthdayCheck, getMsUntilMidnightCentral());
}
//GIVEAWAY HELPERS\\

function canManageGiveaways(guildId, userId) {
    return (
        isFiveStar(userId) ||
        isGeneral(userId) ||
        isOfficer(userId) ||
        isCSM(guildId, userId) ||
        isEnlisted(guildId, userId)
    );
}


function buildGiveawayEmbed(data, remaining) {

    const embed = new EmbedBuilder()
        .setColor(data.color)
        .setTitle("🎉 GIVEAWAY")
        .setDescription(`${data.text}

**Prize**
${data.prize}

**Winners**
${data.winners}

**Ends In**
<t:${Math.floor((Date.now()+remaining)/1000)}:R>

React with 🎉 to enter!`)
        .setFooter({ text: "SOLDIER² Giveaway System" })
        .setTimestamp();

    if (data.gifBottom) embed.setImage(data.gifBottom);
    if (data.gifSide) embed.setThumbnail(data.gifSide);

    return embed;
}

function buildWinnerEmbed(data, winners) {

    const embed = new EmbedBuilder()
        .setColor(data.color)
        .setTitle("🎉 GIVEAWAY ENDED")
        .setDescription(`**Prize**
${data.prize}

🎊 **Winner(s)**
${winners}

Congratulations!`)
        .setFooter({ text: "SOLDIER² Giveaway System" })
        .setTimestamp();

    if (data.winnerGif) embed.setImage(data.winnerGif);
    if (data.gifSide) embed.setThumbnail(data.gifSide);

    return embed;
}
async function endGiveaway(client, guildId) {

    const data = botData.giveaways?.[guildId];
    if (!data || data.ended) return;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;

    const channel = guild.channels.cache.get(data.channelId);
    if (!channel) return;

    const msg = await channel.messages.fetch(data.messageId).catch(()=>null);
    if (!msg) return;

    const reaction = msg.reactions.cache.get('🎉');
    const users = reaction ? await reaction.users.fetch() : [];

    const entries = users
        .filter(u => !u.bot)
        .map(u => u.id);

    if (entries.length === 0) {
        data.ended = true;
        markDirty();
        scheduleSave();
        return;
    }

    const winners = [];

    for (let i=0;i<data.winners;i++) {
        const rand = entries[Math.floor(Math.random()*entries.length)];
        winners.push(`<@${rand}>`);
    }

    const embed = buildWinnerEmbed(data, winners.join(", "));

    await msg.edit({ embeds:[embed] });

    data.ended = true;

    markDirty();
    scheduleSave();
}
//COUNTING GAME HELPER\\

function getCountingData(guildId) {
    if (!botData.counting) botData.counting = {};
    if (!botData.counting[guildId]) {
        botData.counting[guildId] = {
            channelId:           null,
            currentNumber:       0,
            highestNumber:       0,
            lastCounter:         null,
            participants:        {},
            doubleCountWarnings: {},
        };
    }
    return botData.counting[guildId];
}

function canSetCountingChannel(guildId, userId) {
    return (
        isFiveStar(userId)     ||
        isGeneral(userId)      ||
        isOfficer(userId)      ||
        isCSM(guildId, userId) ||
        isEnlisted(guildId, userId)
    );
}

function canSetNextCount(userId) {
    return isFiveStar(userId) || isGeneral(userId) || isOfficer(userId);
}

function isCountingExempt(userId) {
    return isFiveStar(userId) || isGeneral(userId);
}

function resetCount(guildId) {
    const cd = getCountingData(guildId);
    cd.currentNumber       = 0;
    cd.lastCounter         = null;
    cd.participants        = {};
    cd.doubleCountWarnings = {};
    markDirty(); scheduleSave();
}

async function handleMilestoneReward(guildId, currentNumber) {
    if (currentNumber % 100 !== 0) return undefined;
    const cd = getCountingData(guildId);
    const participantIds = Object.keys(cd.participants);
    for (const uid of participantIds) {
        addCoins(uid, 100);
    }
    cd.participants = {};
    markDirty(); scheduleSave();
    return participantIds.length;
}
//QUESTION OF THE DAY HELPER\\

const QOTD_QUESTIONS = [
    'If you could have dinner with anyone in history, who would it be and why?',
    'What is one skill you wish you had learned earlier in life?',
    'If you could live in any time period, past or future, which would you choose?',
    'What is the best piece of advice you have ever received?',
    'If you could instantly master any instrument, which would you pick?',
    'What movie or book has had the biggest impact on how you see the world?',
    'If you could wake up tomorrow with one new ability, what would it be?',
];

//QOTD placeholder GIF\\
const QOTD_GIF = 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif';

function getQotdData(guildId) {
    if (!botData.qotd) botData.qotd = {};
    if (!botData.qotd[guildId]) {
        botData.qotd[guildId] = {
            channelId:    null,
            enabled:      false,
            pingEveryone: false,
            currentIndex: 0,
            nextSendAt:   null,
        };
    }
    return botData.qotd[guildId];
}

function canManageQotd(guildId, userId) {
    return (
        isFiveStar(userId)     ||
        isGeneral(userId)      ||
        isOfficer(userId)      ||
        isCSM(guildId, userId) ||
        isEnlisted(guildId, userId)
    );
}

async function sendQotd(guildId) {
    const qd = getQotdData(guildId);
    if (!qd.channelId || !qd.enabled) return;

    const channel = client.channels.cache.get(qd.channelId);
    if (!channel) return;

    const question = QOTD_QUESTIONS[qd.currentIndex % QOTD_QUESTIONS.length];
    const questionNumber = qd.currentIndex + 1;

    const embed = new EmbedBuilder()
        .setColor(0x24c718)
        .setTitle('❓ Question of the Day')
        .setDescription(`**${question}**`)
        .setThumbnail(QOTD_GIF)
        .setFooter({ text: `Question ${questionNumber} of ${QOTD_QUESTIONS.length} • SOLDIER²` })
        .setTimestamp();

    const content = qd.pingEveryone ? '@everyone' : null;
    await channel.send({ content, embeds: [embed] }).catch(() => {});

    // Advance to next question, loop back when list ends\\
    qd.currentIndex = (qd.currentIndex + 1) % QOTD_QUESTIONS.length;
    qd.nextSendAt   = Date.now() + 24 * 60 * 60 * 1000;
    markDirty(); scheduleSave();

    // Schedule next question\\
    scheduleQotd(guildId);
}

// In-memory timer map so we can cancel/reschedule\\
const qotdTimers = {};

function scheduleQotd(guildId) {
    // Clear any existing timer for this guild\\
    if (qotdTimers[guildId]) {
        clearTimeout(qotdTimers[guildId]);
        delete qotdTimers[guildId];
    }

    const qd = getQotdData(guildId);
    if (!qd.enabled || !qd.channelId) return;

    const now   = Date.now();
    const delay = Math.max((qd.nextSendAt || now) - now, 1000);

    qotdTimers[guildId] = setTimeout(() => sendQotd(guildId), delay);
}

// Called on bot startup to resume any active QOTD schedules\\
function resumeAllQotd() {
    if (!botData.qotd) return;
    for (const guildId of Object.keys(botData.qotd)) {
        const qd = botData.qotd[guildId];
        if (qd.enabled && qd.channelId) {
            // If the scheduled time already passed while bot was offline, send immediately\\
            if (qd.nextSendAt && qd.nextSendAt <= Date.now()) {
                sendQotd(guildId);
            } else {
                scheduleQotd(guildId);
            }
        }
    }
}
//WELCOME / LEAVE HELPER FUNCTIONS\\


function canManageWelcome(guildId, userId) {
    return (
        isFiveStar(userId) ||
        isGeneral(userId) ||
        isOfficer(userId) ||
        isCSM(guildId, userId) ||
        isEnlisted(guildId, userId)
    );
}

function buildWelcomeEmbed(member, config) {
    const msg = config.message.replace('{user}', `<@${member.id}>`);

    const embed = new EmbedBuilder()
        .setColor(config.color || 0x2ECC71)
        .setTitle(`👋 Welcome to ${member.guild.name}`)
        .setDescription(msg)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setFooter({ text: 'SOLDIER² Welcome System' });

    if (config.gif) embed.setImage(config.gif);

    return embed;
}

function buildLeaveEmbed(user, guild, config) {
    const msg = config.message.replace('{user}', `<@${user.id}>`);

    const embed = new EmbedBuilder()
        .setColor(config.color || 0xE74C3C)
        .setTitle(`📤 Member Left`)
        .setDescription(msg)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setFooter({ text: 'SOLDIER² Leave System' });

    if (config.gif) embed.setImage(config.gif);

    return embed;
}

//CURRENCY AND XP HELPERS\\

// Coin rewards per level achieved\\
function getCoinRewardForLevel(level) {
    return 50 * level; // 50 coins per level
    }

//Currency Getters & Setters\\
function getUserBalance(userId) {
    if (!botData.currency) botData.currency = {};
    if (!botData.currency[userId]) {
        botData.currency[userId] = { balance: 0, lastUpdated: Date.now() };
    }
    return botData.currency[userId].balance || 0;
    }

function setUserBalance(userId, amount) {
    if (!botData.currency) botData.currency = {};
    botData.currency[userId] = { balance: Math.max(0, amount), lastUpdated: Date.now() };
        markDirty(); scheduleSave();
    }

function addCoins(userId, amount) {
    const current = getUserBalance(userId);
    setUserBalance(userId, current + amount);
    }

function removeCoins(userId, amount) {
    const current = getUserBalance(userId);
    if (current < amount) return false;
    setUserBalance(userId, current - amount);
    return true;
    }

//XP Getters & Data Functions\\
function getUserXPData(guildId, userId) {
    if (!botData.xp) botData.xp = {};
    if (!botData.xp[guildId]) botData.xp[guildId] = {};
    if (!botData.xp[guildId][userId]) {
        botData.xp[guildId][userId] = { xp: 0, level: 1, prestige: 0 };
    }
    return botData.xp[guildId][userId];
    }

function calculateLevelFromXP(totalXP, prestige) {
    //Calculate level based on prestige count and total XP\\
    if (prestige < 0 || prestige > MAX_PRESTIGE) prestige = Math.min(Math.max(prestige, 0), MAX_PRESTIGE);
    
    const xpFromPrestige = prestige * (MAX_LEVEL * XP_PER_LEVEL);
    if (totalXP < xpFromPrestige) return 1;
    
    const remainingXP = totalXP - xpFromPrestige;
    const levelGain = Math.floor(remainingXP / XP_PER_LEVEL);
    return Math.min(1 + levelGain, MAX_LEVEL);
    }

function canGainXP(guildId, userId) {
    //Check cooldown for XP gains (10 seconds)\\
    if (!botData.xpCooldowns) botData.xpCooldowns = {};
    if (!botData.xpCooldowns[guildId]) botData.xpCooldowns[guildId] = {};
    
    const lastGain = botData.xpCooldowns[guildId][userId] || 0;
        const now = Date.now();
    
    if (now - lastGain < XP_COOLDOWN) {
        return false;
    }
    
    botData.xpCooldowns[guildId][userId] = now;
    return true;
    }

function addXP(guildId, userId, amount) {
    if (!botData.xp) botData.xp = {};
    if (!botData.xp[guildId]) botData.xp[guildId] = {};
    
    const data = getUserXPData(guildId, userId);
    const oldLevel = data.level;
    
    data.xp += amount;
    const newLevel = calculateLevelFromXP(data.xp, data.prestige);
    data.level = newLevel;
    
    //Award coins for leveling up\\
    const levelUpAmount = newLevel - oldLevel;
    if (levelUpAmount > 0) {
        for (let i = oldLevel + 1; i <= newLevel; i++) {
            addCoins(userId, getCoinRewardForLevel(i));
    }
    }
    
        markDirty(); scheduleSave();
    return { levelUp: levelUpAmount > 0, newLevel, oldLevel };
    }

function removeXP(guildId, userId, amount) {
    const data = getUserXPData(guildId, userId);
    data.xp = Math.max(0, data.xp - amount);
    data.level = calculateLevelFromXP(data.xp, data.prestige);
        markDirty(); scheduleSave();
    }

function resetXP(guildId, userId) {
    if (!botData.xp) botData.xp = {};
    if (botData.xp[guildId]) {
        delete botData.xp[guildId][userId];
    }
        markDirty(); scheduleSave();
    }

function prestigeUser(guildId, userId) {
    const data = getUserXPData(guildId, userId);
    
    if (data.prestige >= MAX_PRESTIGE) {
        return { success: false, reason: `Already at max prestige (${MAX_PRESTIGE})` };
    }
    
    if (data.level !== MAX_LEVEL) {
        return { success: false, reason: `Must be level ${MAX_LEVEL}` };
    }
    
    const oldPrestige = data.prestige;
    data.prestige++;
    data.level = 1;
    data.xp = 0;
    
    //Award coins for prestige milestone\\
    addCoins(userId, 500 * data.prestige);
    
        markDirty(); scheduleSave();
    return { success: true, prestige: data.prestige, oldPrestige };
    }

//Leaderboard Functions\\
function getServerLeaderboard(guildId, type = 'coins', limit = 10) {
    const entries = [];
    
    if (type === 'coins') {
        if (!botData.xp?.[guildId]) return [];
        
        for (const [userId, xpData] of Object.entries(botData.xp[guildId])) {
            const balance = getUserBalance(userId);
            if (balance > 0) {
                entries.push({ userId, balance, level: xpData.level, prestige: xpData.prestige });
    }
    }
        entries.sort((a, b) => b.balance - a.balance);
    } else if (type === 'level') {
        if (!botData.xp?.[guildId]) return [];
        
        for (const [userId, xpData] of Object.entries(botData.xp[guildId])) {
                    entries.push({
                        userId,
                level: xpData.level,
                prestige: xpData.prestige,
                        balance: getUserBalance(userId)
});
    }
            entries.sort((a, b) => {
            if (b.prestige !== a.prestige) return b.prestige - a.prestige;
            return b.level - a.level;
});
    }
    
    return entries.slice(0, limit);
    }

function getGlobalLeaderboard(type = 'coins', limit = 10) {
    const entries = [];
    
    if (type === 'coins') {
        for (const [userId, data] of Object.entries(botData.currency || {})) {
            if (data.balance > 0) {
                entries.push({ userId, balance: data.balance });
    }
    }
        entries.sort((a, b) => b.balance - a.balance);
    } else if (type === 'level') {
        for (const [guildId, guildData] of Object.entries(botData.xp || {})) {
            for (const [userId, xpData] of Object.entries(guildData)) {
                const existing = entries.find(e => e.userId === userId);
                if (existing) {
                    existing.totalPrestige = Math.max(existing.totalPrestige, xpData.prestige);
                    existing.maxLevel = Math.max(existing.maxLevel, xpData.level);
    } else {
                    entries.push({
                        userId,
                        totalPrestige: xpData.prestige,
                        maxLevel: xpData.level,
                        balance: getUserBalance(userId)
});
    }
    }
    }
        
        if (type === 'level') {
            entries.sort((a, b) => {
                if (b.totalPrestige !== a.totalPrestige) return b.totalPrestige - a.totalPrestige;
                return b.maxLevel - a.maxLevel;
});
    }
    }
    
    return entries.slice(0, limit);
    }

//Permission & Hierarchy Functions\\
function canManageCurrency(actorId, targetId, guildId) {
    // Owner can manage everyone
    if (isFiveStar(actorId)) return { allowed: true };
    
    //Generals can manage everyone except owner\\
    if (isGeneral(actorId)) {
        if (isFiveStar(targetId)) return { allowed: false, reason: '❌ Cannot manage Owner.' };
            return { allowed: true };
    }
    
    //Officers can manage enlisted and other officers\\
    if (isOfficer(actorId)) {
        if (isFiveStar(targetId) || isGeneral(targetId)) {
            return { allowed: false, reason: '❌ Cannot manage Generals or Owner.' };
    }
            return { allowed: true };
    }
    
    //Enlisted can only manage lower enlisted in same server\\
    if (isEnlisted(guildId, actorId)) {
        if (isFiveStar(targetId) || isGeneral(targetId) || isOfficer(targetId)) {
            return { allowed: false, reason: '❌ Insufficient rank.' };
    }
        if (isCSM(guildId, actorId)) {
            return { allowed: true };
    }
        return { allowed: false, reason: '❌ Only CSM can manage currency in this server.' };
    }
    
    return { allowed: false, reason: '❌ You need a rank to manage currency.' };
    }

function isGlobalXPUser(uid) {
    //Only Owner, Generals, and Officers get global XP\\
    return isFiveStar(uid) || isGeneral(uid) || isOfficer(uid);
    }


//DATA FUNCTIONS — Getters, Setters, Removers\\

//Getters\\
function getGeneralRank(uid)       { return botData.generals?.[uid]?.rank || null; }
function getOfficerRank(uid)       { return botData.officers?.[uid]?.rank || null; }
function getEnlistedRank(gid, uid) { return botData.enlisted?.[gid]?.[uid]?.rank || null; }
function getPrefix(gid)            { return botData.serverPrefixes?.[gid] || PREFIX; }

function getHighestRank(gid, uid) {
    if (uid === OWNER_ID) return GENERAL_RANKS[0];
    return getGeneralRank(uid) || getOfficerRank(uid) || getEnlistedRank(gid, uid) || null;
    }

//Role checks\\
function isFiveStar(uid)      { return uid === OWNER_ID; }
function isGeneral(uid)       { return isFiveStar(uid) || !!getGeneralRank(uid); }
function isOfficer(uid)       { return !!getOfficerRank(uid); }
function isCSM(gid, uid)      { return getEnlistedRank(gid, uid) === CSM_RANK; }
function isEnlisted(gid, uid) { return !!getEnlistedRank(gid, uid); }
function isStaff(gid, uid)    { return isGeneral(uid) || isOfficer(uid) || isCSM(gid, uid); }

function getCSMOfServer(gid) {
    const e = botData.enlisted?.[gid];
    if (!e) return null;
    for (const [uid, d] of Object.entries(e)) if (d.rank === CSM_RANK) return uid;
    return null;
    }

//Setters\\
function setGeneralRank(uid, rank, actor) {
    if (!botData.generals) botData.generals = {};
    botData.generals[uid] = { rank, assignedBy: actor, assignedAt: Date.now() };
        markDirty(); scheduleSave();
    }
function setOfficerRank(uid, rank, actor) {
    if (!botData.officers) botData.officers = {};
    botData.officers[uid] = { rank, assignedBy: actor, assignedAt: Date.now() };
        markDirty(); scheduleSave();
    }
function setEnlistedRank(gid, uid, rank, actor) {
    if (!botData.enlisted) botData.enlisted = {};
    if (!botData.enlisted[gid]) botData.enlisted[gid] = {};
    botData.enlisted[gid][uid] = { rank, assignedBy: actor, assignedAt: Date.now() };
        markDirty(); scheduleSave();
    }

//Removers\\
function removeGeneral(uid) {
    if (botData.generals?.[uid]) { delete botData.generals[uid]; markDirty(); scheduleSave(); }
    }
function removeOfficer(uid) {
    if (botData.officers?.[uid]) { delete botData.officers[uid]; markDirty(); scheduleSave(); }
    }
function removeEnlisted(gid, uid) {
    if (botData.enlisted?.[gid]?.[uid]) { delete botData.enlisted[gid][uid]; markDirty(); scheduleSave(); }
    }

//Auto-assign CSM\\
async function autoAssignCSM(guild) {
    const gid = guild.id;
    if (getCSMOfServer(gid)) return;
    const hasAnyRank = Object.keys(botData.generals || {}).length > 0 ||
                       Object.keys(botData.officers || {}).length > 0 ||
                       Object.keys(botData.enlisted?.[gid] || {}).length > 0;
    if (!hasAnyRank) {
        const owner = await guild.fetchOwner().catch(() => null);
        if (owner && !isFiveStar(owner.id)) {
            setEnlistedRank(gid, owner.id, CSM_RANK, 'AUTO');
            console.log(`🤖 Auto-CSM: ${owner.user.tag} in ${guild.name}`);
    }
    }
    }

//Mod case logger\\
function addModCase(gid, type, targetId, reason, actorId) {
    if (!botData.modlog[gid]) botData.modlog[gid] = { cases: [] };
    const id = botData.modlog[gid].cases.length + 1;
    botData.modlog[gid].cases.push({ id, type, userId: targetId, reason: reason || 'No reason provided', by: actorId, at: Date.now() });
        markDirty(); scheduleSave();
    return id;
    }

//Command logger\\
function logCommand(gid, uid, tag, command, args) {
    if (!botData.commandLog[gid]) botData.commandLog[gid] = [];
    botData.commandLog[gid].push({ command, by: uid, byTag: tag, args, at: Date.now() });
    if (botData.commandLog[gid].length > 500) botData.commandLog[gid].shift();
        markDirty(); scheduleSave();
    }

//Send embed to log channel\\
async function sendLog(client, gid, embed) {
    const cid = botData.logChannels?.[gid];
    if (!cid) return;
    const ch = client.channels.cache.get(cid);
    if (ch) ch.send({ embeds: [embed] }).catch(() => {});
    }

//AUTHORITY ENGINE\\

//canAct — checks if actor has authority over target\\
function canAct(actorId, targetId, guildId) {
    if (isFiveStar(actorId))  return { allowed: true,  reason: 'ok' };
    if (isFiveStar(targetId)) return { allowed: false, reason: '❌ Nobody can act on the **5-Star General**.' };

    const aG = getGeneralRank(actorId),  aO = getOfficerRank(actorId),  aE = getEnlistedRank(guildId, actorId);
    const tG = getGeneralRank(targetId), tO = getOfficerRank(targetId), tE = getEnlistedRank(guildId, targetId);

    if (aG) {
        if (tG) return { allowed: false, reason: '❌ Generals cannot act on other **Generals**.' };
        return { allowed: true, reason: 'ok' };
    }
    if (aO) {
        if (tG) return { allowed: false, reason: '❌ Officers cannot act on **Generals**.' };
        if (tO) {
            if (aO === COLONEL_RANK && getRankValue(aO) < getRankValue(tO)) return { allowed: true, reason: 'ok' };
            return { allowed: false, reason: '❌ Only a **Colonel** can act on lower-ranked Officers.' };
    }
        return { allowed: true, reason: 'ok' };
    }
    if (aE) {
        if (tG || tO) return { allowed: false, reason: '❌ Enlisted cannot act on **Generals** or **Officers**.' };
        if (!tE)      return { allowed: false, reason: '❌ Target has no rank in this server.' };
        if (aE === CSM_RANK) {
            if (tE === CSM_RANK) return { allowed: false, reason: '❌ CSM cannot act on another **CSM**.' };
        return { allowed: true, reason: 'ok' };
    }
        if (getRankValue(tE) <= getRankValue(aE)) return { allowed: false, reason: '❌ You can only act on ranks **below** yours.' };
        if (tE === CSM_RANK) return { allowed: false, reason: '❌ Only Officers or Generals can act on the **CSM**.' };
        return { allowed: true, reason: 'ok' };
    }
    return { allowed: false, reason: '❌ You have no rank and cannot perform this action.' };
    }

//canPromoteTo — checks if actor can assign a specific rank\\
function canPromoteTo(actorId, targetRank, guildId) {
    if (isFiveStar(actorId)) return { allowed: true, reason: 'ok' };
    const aG = getGeneralRank(actorId), aO = getOfficerRank(actorId), aE = getEnlistedRank(guildId, actorId);
    if (GENERAL_RANKS.includes(targetRank))
        return { allowed: false, reason: '❌ Only the **5-Star General** can assign General ranks.' };
    if (OFFICER_RANKS.includes(targetRank)) {
        if (aG) return { allowed: true, reason: 'ok' };
        return { allowed: false, reason: '❌ Only **Generals** can assign Officer ranks.' };
    }
    if (ENLISTED_RANKS.includes(targetRank)) {
        if (targetRank === CSM_RANK) {
        if (aG || aO) return { allowed: true, reason: 'ok' };
            return { allowed: false, reason: '❌ Only Officers/Generals can assign CSM.' };
    }
        if (aG || aO) return { allowed: true, reason: 'ok' };
        if (aE === CSM_RANK) return { allowed: true, reason: 'ok' };
        if (aE && getRankValue(targetRank) > getRankValue(aE)) return { allowed: true, reason: 'ok' };
        return { allowed: false, reason: '❌ You can only promote to ranks **below** yours.' };
    }
    return { allowed: false, reason: '❌ No permission to assign this rank.' };
    }

//REACTION ROLE HELPER FUNCTIONS\\

function addReactionRole(guildId, messageId, emoji, roleId) {
    if (!botData.reactionRoles) botData.reactionRoles = {};
    if (!botData.reactionRoles[guildId]) botData.reactionRoles[guildId] = {};
    if (!botData.reactionRoles[guildId][messageId]) botData.reactionRoles[guildId][messageId] = {};
    
    botData.reactionRoles[guildId][messageId][emoji] = roleId;
        markDirty(); scheduleSave();
    }

function getReactionRoles(guildId, messageId) {
    return botData.reactionRoles?.[guildId]?.[messageId] || null;
    }

function deleteReactionRoleMessage(guildId, messageId) {
    if (botData.reactionRoles?.[guildId]?.[messageId]) {
        delete botData.reactionRoles[guildId][messageId];
        markDirty(); scheduleSave();
    }
    }

function getAllReactionRoles(guildId) {
    return botData.reactionRoles?.[guildId] || {};
    }

//HELPER FUNCTIONS\\

//Rank promotion handler\\
async function handlePromote(targetUser, rankInput, guild, actorId, reply) {
    const gid = guild.id;
    if (!rankInput)                return reply('❌ Please specify a rank.');
    if (targetUser.bot)            return reply('❌ Cannot promote bots.');
    if (targetUser.id === actorId) return reply('❌ Cannot promote yourself.');

        const resolved =
            GENERAL_RANKS.find(r => r.toLowerCase() === rankInput.toLowerCase()) ||
            OFFICER_RANKS.find(r => r.toLowerCase() === rankInput.toLowerCase()) ||
            ENLISTED_RANKS.find(r => r.toLowerCase() === rankInput.toLowerCase());

    if (!resolved) return reply(
        `❌ Invalid rank.\n**Generals:** \`${GENERAL_RANKS.join('`, `')}\`\n` +
        `**Officers:** \`${OFFICER_RANKS.join('`, `')}\`\n` +
        `**Enlisted:** \`${ENLISTED_RANKS.join('`, `')}\``
            );

        const p = canPromoteTo(actorId, resolved, gid);
        if (!p.allowed) return reply(p.reason);
    const a = canAct(actorId, targetUser.id, gid);
    if (!a.allowed) return reply(a.reason);

    if (resolved === CSM_RANK) {
        const ex = getCSMOfServer(gid);
        if (ex && ex !== targetUser.id) return reply(`❌ Server already has a CSM (<@${ex}>). Use \`×csmtransfer\`.`);
    }

    let prev     = null;
    const isEnl  = ENLISTED_RANKS.includes(resolved);
    const isOff  = OFFICER_RANKS.includes(resolved);

    if (GENERAL_RANKS.includes(resolved))  { prev = getGeneralRank(targetUser.id);     setGeneralRank(targetUser.id, resolved, actorId); }
    else if (isOff)                         { prev = getOfficerRank(targetUser.id);      setOfficerRank(targetUser.id, resolved, actorId); }
    else                                    { prev = getEnlistedRank(gid, targetUser.id); setEnlistedRank(gid, targetUser.id, resolved, actorId); }

    const embed = new EmbedBuilder().setColor(0x00FF7F).setTitle('🪖 Promotion')
            .addFields(
            { name: '👤 User',         value: `<@${targetUser.id}> (${targetUser.tag})`,          inline: true },
            { name: '🎖️ New Rank',     value: `**${resolved}**`,                                  inline: true },
            { name: '📈 Previous',     value: prev ? `**${prev}**` : '*(none)*',                  inline: true },
            { name: '🔑 Promoted By',  value: `<@${actorId}>`,                                    inline: true },
            { name: '📍 Server',       value: guild.name,                                          inline: true }
        ).setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setTimestamp().setFooter({ text: 'SOLDIER²' });
    await reply({ embeds: [embed] });
    targetUser.send(`🎖️ Promoted to **${resolved}**${isEnl ? ` in **${guild.name}**` : ' (globally)'}!`).catch(() => {});
    }

//Rank demotion handler\\
async function handleDemote(targetUser, rankInput, guild, actorId, reply) {
    const gid = guild.id;
    if (targetUser.bot)            return reply('❌ Cannot demote bots.');
    if (targetUser.id === actorId) return reply('❌ Cannot demote yourself.');

    const a = canAct(actorId, targetUser.id, gid);
    if (!a.allowed) return reply(a.reason);

    const curG = getGeneralRank(targetUser.id);
    const curO = getOfficerRank(targetUser.id);
    const curE = getEnlistedRank(gid, targetUser.id);
    const cur  = curG || curO || curE;
    if (!cur) return reply(`❌ <@${targetUser.id}> has no rank.`);
    if ((curG && !isGeneral(actorId) && !isFiveStar(actorId)) ||
        (curO && !isGeneral(actorId) && !isFiveStar(actorId))) {
        return reply('❌ Only Generals or the 5-Star can strip General/Officer ranks.');
    }

    if (rankInput) {
        const resolved =
            GENERAL_RANKS.find(r => r.toLowerCase() === rankInput.toLowerCase()) ||
            OFFICER_RANKS.find(r => r.toLowerCase() === rankInput.toLowerCase()) ||
            ENLISTED_RANKS.find(r => r.toLowerCase() === rankInput.toLowerCase());
        if (!resolved) return reply('❌ Invalid rank.');
        if (getRankValue(resolved) <= getRankValue(cur)) return reply('❌ New rank must be lower. Use `×promote` to upgrade.');
        const p = canPromoteTo(actorId, resolved, gid);
        if (!p.allowed) return reply(p.reason);
        if (GENERAL_RANKS.includes(resolved))      setGeneralRank(targetUser.id, resolved, actorId);
        else if (OFFICER_RANKS.includes(resolved)) setOfficerRank(targetUser.id, resolved, actorId);
        else                                       setEnlistedRank(gid, targetUser.id, resolved, actorId);

        const embed = new EmbedBuilder().setColor(0xFF4500).setTitle('📉 Demotion')
            .addFields(
                { name: '👤 User',        value: `<@${targetUser.id}> (${targetUser.tag})`, inline: true },
                { name: '🎖️ New Rank',    value: `**${resolved}**`,                        inline: true },
                { name: '📉 Was',         value: `**${cur}**`,                              inline: true },
                { name: '🔑 Demoted By',  value: `<@${actorId}>`,                          inline: true }
        ).setTimestamp().setFooter({ text: 'SOLDIER²' });
    await reply({ embeds: [embed] });
        targetUser.send(`📉 Demoted to **${resolved}**.`).catch(() => {});
    } else {
        if (curG)      removeGeneral(targetUser.id);
        else if (curO) removeOfficer(targetUser.id);
        else           removeEnlisted(gid, targetUser.id);

        const embed = new EmbedBuilder().setColor(0xFF0000).setTitle('❌ Rank Removed')
            .addFields(
                { name: '👤 User',         value: `<@${targetUser.id}> (${targetUser.tag})`, inline: true },
                { name: '����️ Rank Removed', value: `**${cur}**`,                              inline: true },
                { name: '🔑 Action By',    value: `<@${actorId}>`,                           inline: true }
        ).setTimestamp().setFooter({ text: 'SOLDIER²' });
    await reply({ embeds: [embed] });
        targetUser.send(`❌ Rank **${cur}** removed.`).catch(() => {});
    }
    }

//CSM transfer handler\\
async function handleCSMTransfer(targetUser, guild, actorId, reply) {
    const gid = guild.id;
    if (targetUser.bot)            return reply('❌ Cannot transfer CSM to a bot.');
    if (targetUser.id === actorId) return reply('❌ You are already the CSM.');
    if (!isCSM(gid, actorId) && !isGeneral(actorId) && !isOfficer(actorId))
        return reply('❌ Only CSM, Generals, Officers, or 5-Star can transfer CSM.');

    const curCSM = getCSMOfServer(gid);
    if (curCSM && curCSM !== targetUser.id) {
        setEnlistedRank(gid, curCSM, SGM_RANK, actorId);
        const old = await client.users.fetch(curCSM).catch(() => null);
        if (old) old.send(`📉 Your CSM rank in **${guild.name}** was transferred. You are now Sergeant Major.`).catch(() => {});
    }
    setEnlistedRank(gid, targetUser.id, CSM_RANK, actorId);

    const embed = new EmbedBuilder().setColor(0xFFD700).setTitle('👑 CSM Transfer')
            .addFields(
            { name: '👑 New CSM',        value: `<@${targetUser.id}> (${targetUser.tag})`,                inline: true },
            { name: '📉 Old CSM',        value: curCSM ? `<@${curCSM}> *(now SGM)*` : '*(none)*',        inline: true },
            { name: '🔑 Transferred By', value: `<@${actorId}>`,                                         inline: false },
            { name: '📍 Server',         value: guild.name,                                               inline: false }
        ).setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setTimestamp().setFooter({ text: 'SOLDIER²' });
    await reply({ embeds: [embed] });
    targetUser.send(`👑 Appointed **Command Sergeant Major** of **${guild.name}**!`).catch(() => {});
    }

//EMBED BUILDERS\\

//Global rank list embed\\
function buildGlobalRankEmbed() {
    const gL = Object.entries(botData.generals || {}).map(([id, d]) => `• <@${id}> — **${d.rank}**`);
    const oL = Object.entries(botData.officers || {}).map(([id, d]) => `• <@${id}> — **${d.rank}**`);
    return new EmbedBuilder().setColor(0xFFD700).setTitle('🌐 Global Rank List')
            .addFields(
            { name: `${SYM_GENERAL} Generals (${gL.length})`, value: gL.length ? gL.join('\n') : '*(none)*', inline: false },
            { name: `${SYM_OFFICER} Officers (${oL.length})`,  value: oL.length ? oL.join('\n') : '*(none)*', inline: false }
        ).setTimestamp().setFooter({ text: 'SOLDIER²' });
    }

//Server rank list embed\\
function buildServerRankEmbed(gid, gname) {
    const e      = botData.enlisted?.[gid] || {};
    const sorted = Object.entries(e).sort(([, a], [, b]) => getRankValue(a.rank) - getRankValue(b.rank));
    const lines  = sorted.map(([id, d]) => `• <@${id}> — **${d.rank}**${d.rank === CSM_RANK ? ' 👑' : ''}`);
    return new EmbedBuilder().setColor(0x1E90FF).setTitle(`${SYM_ENLISTED} Server Ranks — ${gname}`)
        .setDescription(lines.length ? lines.join('\n') : '*(none)*')
        .setTimestamp().setFooter({ text: `SOLDIER² — ${sorted.length} enlisted` });
    }
// ============================================================
//  POKÉMON SYSTEM — CONSTANTS & HELPERS
// ============================================================

const POKEDEX_URL        = 'https://pokeapi.co/api/v2';
const SHINY_ODDS         = 4096;
const SPAWN_MIN_MINUTES  = 15;
const SPAWN_MAX_MINUTES  = 45;
const SPAWN_DESPAWN_MINS = 10;
const BATTLE_MOVE_TIMEOUT = 120000; // 2 minutes to pick a move

const SPAWN_POOL = [
    ...Array.from({ length: 1025 }, (_, i) => i + 1),
    ...Array.from({ length: 277 },  (_, i) => i + 10001),
];

// ── XP formula ──
function xpForLevel(level) {
    return Math.floor(0.8 * Math.pow(level, 3));
}

// ── Check and apply level ups ──
function checkLevelUp(pkm) {
    const levels = [];
    while (pkm.xp >= xpForLevel(pkm.level + 1) && pkm.level < 100) {
        pkm.level++;
        levels.push(pkm.level);
    }
    return levels;
}

// ── Async post-levelup handler ──
async function handleLevelUps(pkm, levels, channel, userId) {
    for (const lvl of levels) {
        await checkNewMoves(pkm, lvl, channel, userId);
    }
    if (levels.length > 0) {
        await checkAndTriggerEvolution(pkm, channel, userId);
    }
}

// ── Fetch Pokémon from PokéAPI with cache ──
async function fetchPokemon(nameOrId) {
    const key = String(nameOrId).toLowerCase();
    if (botData.pokemonCache[key]) return botData.pokemonCache[key];
    try {
        const res = await fetch(`${POKEDEX_URL}/pokemon/${key}`);
        if (!res.ok) return null;
        const data = await res.json();
        const levelUpMoves = data.moves
            .filter(m => m.version_group_details.some(v => v.move_learn_method.name === 'level-up'))
            .map(m => ({
                level: Math.max(...m.version_group_details
                    .filter(v => v.move_learn_method.name === 'level-up')
                    .map(v => v.level_learned_at)),
                name: m.move.name,
            }))
            .sort((a, b) => a.level - b.level);

        const parsed = {
            id:          data.id,
            name:        data.name,
            types:       data.types.map(t => t.type.name),
            stats: {
                hp:             data.stats.find(s => s.stat.name === 'hp').base_stat,
                attack:         data.stats.find(s => s.stat.name === 'attack').base_stat,
                defense:        data.stats.find(s => s.stat.name === 'defense').base_stat,
                specialAttack:  data.stats.find(s => s.stat.name === 'special-attack').base_stat,
                specialDefense: data.stats.find(s => s.stat.name === 'special-defense').base_stat,
                speed:          data.stats.find(s => s.stat.name === 'speed').base_stat,
            },
            moves:        data.moves.slice(0, 4).map(m => m.move.name),
            levelUpMoves,
            sprite:       data.sprites.front_default,
            spriteShiny:  data.sprites.front_shiny,
            catchRate:    100,
            evolvesTo:    null,
            ability:      data.abilities?.[0]?.ability?.name || null,
        };
        try {
            const specRes = await fetch(`${POKEDEX_URL}/pokemon-species/${key}`);
            if (specRes.ok) {
                const specData   = await specRes.json();
                parsed.catchRate = specData.capture_rate;
                const evoUrl = specData.evolution_chain?.url;
                if (evoUrl) {
                    const evoRes = await fetch(evoUrl);
                    if (evoRes.ok) {
                        const evoData = await evoRes.json();
                        const findEvo = (chain, targetName) => {
                            if (chain.species.name === targetName) {
                                for (const next of chain.evolves_to) {
                                    const det = next.evolution_details[0];
                                    if (det?.trigger?.name === 'level-up' && det?.min_level) {
                                        return { name: next.species.name, minLevel: det.min_level };
                                    }
                                }
                            }
                            for (const next of chain.evolves_to) {
                                const found = findEvo(next, targetName);
                                if (found) return found;
                            }
                            return null;
                        };
                        parsed.evolvesTo = findEvo(evoData.chain, parsed.name);
                    }
                }
            }
        } catch {}
        botData.pokemonCache[key] = parsed;
        markDirty(); scheduleSave();
        return parsed;
    } catch { return null; }
}

// ── Fetch move data with cache ──
async function fetchMove(moveName) {
    const key = `move_${moveName.toLowerCase()}`;
    if (botData.pokemonCache[key]) return botData.pokemonCache[key];
    try {
        const res = await fetch(`${POKEDEX_URL}/move/${moveName.toLowerCase()}`);
        if (!res.ok) return null;
        const data = await res.json();
        const parsed = {
            name:     data.name,
            power:    data.power || 0,
            accuracy: data.accuracy || 100,
            pp:       data.pp || 10,
            type:     data.type.name,
            category: data.damage_class.name,
            effect:   data.effect_entries.find(e => e.language.name === 'en')?.short_effect || '',
        };
        botData.pokemonCache[key] = parsed;
        markDirty(); scheduleSave();
        return parsed;
    } catch { return null; }
}

// ── Roll for shiny ──
function rollShiny() {
    return Math.floor(Math.random() * SHINY_ODDS) === 0;
}

// ── Format name nicely ──
function formatPokeName(name) {
    return name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ============================================================
//  PP HELPERS
// ============================================================
async function getPP(pkm, moveName) {
    if (!pkm.pp) pkm.pp = {};
    if (pkm.pp[moveName] !== undefined) return pkm.pp[moveName];
    const data = await fetchMove(moveName);
    const max  = data?.pp || 10;
    pkm.pp[moveName] = max;
    return max;
}

async function usePP(pkm, moveName) {
    if (!pkm.pp) pkm.pp = {};
    if (pkm.pp[moveName] === undefined) {
        const data = await fetchMove(moveName);
        pkm.pp[moveName] = data?.pp || 10;
    }
    if (pkm.pp[moveName] <= 0) return false;
    pkm.pp[moveName]--;
    return true;
}

async function restoreAllPP(pkm) {
    if (!pkm.pp) pkm.pp = {};
    for (const move of (pkm.moves || [])) {
        const data = await fetchMove(move);
        pkm.pp[move] = data?.pp || 10;
    }
}

// ============================================================
//  EVOLUTION SYSTEM
// ============================================================
async function checkAndTriggerEvolution(pkm, channel, userId) {
    if (!pkm.evolvesTo) return false;
    const { name: evoName, minLevel } = pkm.evolvesTo;
    if (pkm.level < minLevel) return false;

    const evoData = await fetchPokemon(evoName);
    if (!evoData) return false;

    const evoEmbed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('✨ Your Pokémon is evolving!')
        .setDescription(
            `**${formatPokeName(pkm.name)}** is evolving into **${formatPokeName(evoName)}**!\n\n` +
            `React ✅ to **evolve** or ❌ to **cancel** *(60 seconds)*`
        )
        .setThumbnail(evoData.sprite)
        .setFooter({ text: 'SOLDIER² Pokémon Evolution' })
        .setTimestamp();

    const evoMsg = await channel.send({ content: `<@${userId}>`, embeds: [evoEmbed] }).catch(() => null);
    if (!evoMsg) return false;

    await evoMsg.react('✅').catch(() => {});
    await evoMsg.react('❌').catch(() => {});

    return new Promise(resolve => {
        const filter    = (r, u) => u.id === userId && ['✅','❌'].includes(r.emoji.name);
        const collector = evoMsg.createReactionCollector({ filter, max: 1, time: 60000 });

        collector.on('collect', async (reaction) => {
            if (reaction.emoji.name === '✅') {
                const oldName   = pkm.name;
                pkm.name        = evoData.name;
                pkm.types       = evoData.types;
                pkm.stats       = evoData.stats;
                pkm.sprite      = pkm.shiny ? evoData.spriteShiny : evoData.sprite;
                pkm.spriteShiny = evoData.spriteShiny;
                pkm.evolvesTo   = evoData.evolvesTo || null;
                pkm.ability     = evoData.ability   || pkm.ability;
                pkm.id          = evoData.id;
                pkm.pp          = {};
                markDirty(); scheduleSave();
                await evoMsg.edit({ embeds: [new EmbedBuilder()
                    .setColor(0xFFD700)
                    .setTitle(`🎉 ${formatPokeName(oldName)} evolved into ${formatPokeName(evoData.name)}!`)
                    .setDescription(`<@${userId}>'s **${formatPokeName(oldName)}** is now **${formatPokeName(evoData.name)}**!`)
                    .setImage(pkm.shiny ? evoData.spriteShiny : evoData.sprite)
                    .setFooter({ text: 'SOLDIER² Pokémon Evolution' })
                    .setTimestamp()
                ]}).catch(() => {});
                resolve(true);
            } else {
                await evoMsg.edit({ embeds: [new EmbedBuilder()
                    .setColor(0x95A5A6)
                    .setTitle(`❌ Evolution cancelled`)
                    .setDescription(`**${formatPokeName(pkm.name)}** did not evolve.`)
                    .setFooter({ text: 'SOLDIER² Pokémon Evolution' })
                ]}).catch(() => {});
                resolve(false);
            }
        });
        collector.on('end', (c) => {
            if (!c.size) {
                evoMsg.edit({ embeds: [new EmbedBuilder()
                    .setColor(0x95A5A6)
                    .setTitle('⏰ Evolution timed out')
                    .setDescription(`**${formatPokeName(pkm.name)}** did not evolve.`)
                    .setFooter({ text: 'SOLDIER² Pokémon Evolution' })
                ]}).catch(() => {});
                resolve(false);
            }
        });
    });
}

// ============================================================
//  MOVE LEARN CHECK
// ============================================================
async function checkNewMoves(pkm, newLevel, channel, userId) {
    const data = await fetchPokemon(pkm.name);
    if (!data?.levelUpMoves) return;

    const toLearn = data.levelUpMoves.filter(m => m.level === newLevel);
    for (const moveEntry of toLearn) {
        const moveName = moveEntry.name;
        if (pkm.moves.includes(moveName)) continue;

        const moveData = await fetchMove(moveName);
        if (!moveData) continue;

        const typeColors = {
            fire: 0xEE8130, water: 0x6390F0, grass: 0x7AC74C, electric: 0xF7D02C,
            psychic: 0xF95587, ice: 0x96D9D6, dragon: 0x6F35FC, dark: 0x705746,
            fairy: 0xD685AD, normal: 0xA8A77A, fighting: 0xC22E28, poison: 0xA33EA1,
            ground: 0xE2BF65, rock: 0xB6A136, bug: 0xA6B91A, ghost: 0x735797,
            steel: 0xB7B7CE, flying: 0xA98FF3,
        };

        const hasFull    = pkm.moves.length >= 4;
        const learnEmbed = new EmbedBuilder()
            .setColor(typeColors[moveData.type] || 0xFF6900)
            .setTitle(`📖 ${formatPokeName(pkm.name)} wants to learn ${formatPokeName(moveName)}!`)
            .setDescription(
                `**New move:** ${formatPokeName(moveName)}\n` +
                `Type: ${formatPokeName(moveData.type)} | Power: ${moveData.power || '—'} | Acc: ${moveData.accuracy || '—'}% | PP: ${moveData.pp || 10}\n\n` +
                (hasFull
                    ? `React ✅ to learn it and choose which move to replace, or ❌ to skip.\n\n` +
                      `**Current moves:**\n` +
                      pkm.moves.map((m, i) => `${['1️⃣','2️⃣','3️⃣','4️⃣'][i]} ${formatPokeName(m)}`).join('\n')
                    : `React ✅ to **learn** or ❌ to **skip**.`)
            )
            .setFooter({ text: 'SOLDIER² Pokémon • 60 seconds to decide' });

        const learnMsg = await channel.send({ content: `<@${userId}>`, embeds: [learnEmbed] }).catch(() => null);
        if (!learnMsg) continue;

        await learnMsg.react('✅').catch(() => {});
        await learnMsg.react('❌').catch(() => {});

        await new Promise(resolve => {
            const f1 = (r, u) => u.id === userId && ['✅','❌'].includes(r.emoji.name);
            const c1 = learnMsg.createReactionCollector({ filter: f1, max: 1, time: 60000 });

            c1.on('collect', async (r) => {
                if (r.emoji.name === '❌') {
                    await learnMsg.edit({ embeds: [new EmbedBuilder()
                        .setColor(0x95A5A6)
                        .setTitle(`❌ ${formatPokeName(pkm.name)} did not learn ${formatPokeName(moveName)}.`)
                        .setFooter({ text: 'SOLDIER² Pokémon' })
                    ]}).catch(() => {});
                    return resolve();
                }

                if (!hasFull) {
                    pkm.moves.push(moveName);
                    if (!pkm.pp) pkm.pp = {};
                    pkm.pp[moveName] = moveData.pp || 10;
                    markDirty(); scheduleSave();
                    await learnMsg.edit({ embeds: [new EmbedBuilder()
                        .setColor(0x24c718)
                        .setTitle(`✅ ${formatPokeName(pkm.name)} learned ${formatPokeName(moveName)}!`)
                        .setFooter({ text: 'SOLDIER² Pokémon' })
                    ]}).catch(() => {});
                    return resolve();
                }

                // Full moveset — pick slot to replace
                await learnMsg.reactions.removeAll().catch(() => {});
                for (const e of ['1️⃣','2️⃣','3️⃣','4️⃣']) await learnMsg.react(e).catch(() => {});

                const slotEmojis = ['1️⃣','2️⃣','3️⃣','4️⃣'];
                const f2 = (r2, u2) => u2.id === userId && slotEmojis.includes(r2.emoji.name);
                const c2 = learnMsg.createReactionCollector({ filter: f2, max: 1, time: 60000 });

                c2.on('collect', async (r2) => {
                    const slotIdx      = slotEmojis.indexOf(r2.emoji.name);
                    const oldMove      = pkm.moves[slotIdx];
                    pkm.moves[slotIdx] = moveName;
                    if (!pkm.pp) pkm.pp = {};
                    delete pkm.pp[oldMove];
                    pkm.pp[moveName] = moveData.pp || 10;
                    markDirty(); scheduleSave();
                    await learnMsg.edit({ embeds: [new EmbedBuilder()
                        .setColor(0x24c718)
                        .setTitle(`✅ ${formatPokeName(pkm.name)} forgot ${formatPokeName(oldMove)} and learned ${formatPokeName(moveName)}!`)
                        .setFooter({ text: 'SOLDIER² Pokémon' })
                    ]}).catch(() => {});
                    resolve();
                });
                c2.on('end', (c) => { if (!c.size) resolve(); });
            });
            c1.on('end', (c) => { if (!c.size) resolve(); });
        });
    }
}

// ── Get user Pokémon data ──
function getUserPokemon(userId) {
    if (!botData.pokemon) botData.pokemon = {};
    if (!botData.pokemon[userId]) {
        botData.pokemon[userId] = {
            collection:  [],
            party:       [],
            battleStats: { wins: 0, losses: 0 },
        };
    }
    if (!botData.pokemon[userId].battleStats) {
        botData.pokemon[userId].battleStats = { wins: 0, losses: 0 };
    }
    return botData.pokemon[userId];
}

// ── Build a new Pokémon entry ──
function buildPokemonEntry(data, shiny = false, level = 5) {
    const startMoves = (data.levelUpMoves || [])
        .filter(m => m.level <= level)
        .slice(-4)
        .map(m => m.name);
    const movesToUse = startMoves.length > 0 ? startMoves : data.moves.slice(0, 4);

    return {
        uid:         `${data.id}_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
        id:          data.id,
        name:        data.name,
        shiny,
        level,
        xp:          0,
        moves:       movesToUse,
        pp:          {},
        types:       data.types,
        stats:       data.stats,
        ability:     data.ability || null,
        evolvesTo:   data.evolvesTo || null,
        sprite:      shiny ? data.spriteShiny : data.sprite,
        spriteShiny: data.spriteShiny || null,
    };
}

// ── Add Pokémon to user collection ──
function addPokemonToUser(userId, entry) {
    const ud = getUserPokemon(userId);
    ud.collection.push(entry);
    if (ud.party.length < 6) {
        ud.party.push(ud.collection.length - 1);
    }
    markDirty(); scheduleSave();
}

// ── Build HP bar ──
function buildHPBar(current, max, length = 10) {
    const filled = Math.max(0, Math.round((current / max) * length));
    const empty  = length - filled;
    const pct    = Math.floor((current / max) * 100);
    let color    = '🟩';
    if (pct <= 50) color = '🟨';
    if (pct <= 20) color = '🟥';
    return `${color.repeat(filled)}⬛`.repeat(empty) + ` \`${current}/${max}\``;
}

// ── Status emoji ──
function getStatusEmoji(status) {
    const map = {
        burn: '🔥', paralysis: '⚡', poison: '☠️',
        sleep: '😴', freeze: '🧊', confusion: '😵',
    };
    return map[status] || '';
}

// ── Permission helpers ──
function canGivePokemon(guildId, userId) {
    return isFiveStar(userId) || isGeneral(userId) || isOfficer(userId);
}

function canSetSpawnChannel(guildId, userId) {
    return (
        isFiveStar(userId)     ||
        isGeneral(userId)      ||
        isOfficer(userId)      ||
        isCSM(guildId, userId) ||
        isEnlisted(guildId, userId)
    );
}

// ============================================================
//  POKÉ BAG HELPERS
// ============================================================
function getUserBag(userId) {
    if (!botData.pokeBags) botData.pokeBags = {};
    if (!botData.pokeBags[userId]) {
        botData.pokeBags[userId] = { pokeballs: {}, healing: {}, berries: {} };
    }
    const bag = botData.pokeBags[userId];
    if (!bag.pokeballs) bag.pokeballs = {};
    if (!bag.healing)   bag.healing   = {};
    if (!bag.berries)   bag.berries   = {};
    return bag;
}

function getBagItemCount(userId, category, itemKey) {
    const bag = getUserBag(userId);
    return bag[category]?.[itemKey] || 0;
}

function addToBag(userId, category, itemKey, qty = 1) {
    const bag     = getUserBag(userId);
    const current = bag[category][itemKey] || 0;
    bag[category][itemKey] = Math.min(100, current + qty);
    markDirty(); scheduleSave();
    return bag[category][itemKey];
}

function removeFromBag(userId, category, itemKey, qty = 1) {
    const bag     = getUserBag(userId);
    const current = bag[category][itemKey] || 0;
    if (current < qty) return false;
    bag[category][itemKey] = current - qty;
    if (bag[category][itemKey] === 0) delete bag[category][itemKey];
    markDirty(); scheduleSave();
    return true;
}

function getTotalBalls(userId) {
    const bag = getUserBag(userId);
    return Object.values(bag.pokeballs).reduce((a, b) => a + b, 0);
}

function findItemAnywhere(key) {
    const k = key.toLowerCase();
    for (const [cat, items] of Object.entries(POKE_ITEMS)) {
        if (items[k]) return { category: cat, key: k, item: items[k] };
    }
    for (const [cat, items] of Object.entries(POKE_ITEMS)) {
        for (const [ik, iv] of Object.entries(items)) {
            if (iv.label.toLowerCase() === k || ik.replace(/-/g, ' ') === k) {
                return { category: cat, key: ik, item: iv };
            }
        }
    }
    return null;
}

// ── Generate store canvas ──
async function generateStoreCanvas(category = 'pokeballs', page = 0) {
    const items   = Object.entries(POKE_ITEMS[category]);
    const perPage = 12;
    const start   = page * perPage;
    const slice   = items.slice(start, start + perPage);
    const cols    = 4;
    const rows    = Math.ceil(slice.length / cols);
    const cellW   = 180, cellH = 100;
    const padX    = 20, padY = 20;
    const headerH = 90;
    const W = cols * cellW + padX * 2;
    const H = headerH + rows * cellH + padY * 2 + 40;

    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext('2d');

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1565C0');
    bg.addColorStop(0.4, '#0D47A1');
    bg.addColorStop(1, '#0a2a6e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.globalAlpha = 0.06;
    for (let r = 0; r < H / 30; r++) {
        for (let c = 0; c < W / 30; c++) {
            if ((r + c) % 2 === 0) { ctx.fillStyle = '#ffffff'; ctx.fillRect(c * 30, r * 30, 30, 30); }
        }
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, W, headerH);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('🏪 POKÉMART', padX, 38);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    const catLabels = { pokeballs: 'Poké Balls', healing: 'Medicine', berries: 'Berries' };
    ctx.fillText(`Category: ${catLabels[category]}  •  Page ${page + 1}/${Math.ceil(items.length / perPage)}`, padX, 60);
    ctx.fillText(`Use ×buy <item name> [qty] to purchase`, padX, 78);

    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(0, headerH);
    ctx.lineTo(W, headerH);
    ctx.stroke();

    for (let i = 0; i < slice.length; i++) {
        const [key, item] = slice[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x   = padX + col * cellW;
        const y   = headerH + padY + row * cellH;

        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath(); ctx.roundRect(x, y, cellW - 8, cellH - 8, 8); ctx.fill();

        ctx.strokeStyle = 'rgba(255,215,0,0.3)';
        ctx.lineWidth   = 1;
        ctx.beginPath(); ctx.roundRect(x, y, cellW - 8, cellH - 8, 8); ctx.stroke();

        try { const img = await loadImage(item.sprite); ctx.drawImage(img, x + 6, y + 10, 36, 36); } catch {}

        ctx.fillStyle = '#ffffff';
        ctx.font      = 'bold 11px sans-serif';
        ctx.fillText(item.label.slice(0, 18), x + 48, y + 22);

        ctx.fillStyle = '#FFD700';
        ctx.font      = 'bold 12px sans-serif';
        ctx.fillText(`💰 ${item.price.toLocaleString()}`, x + 48, y + 38);

        ctx.fillStyle = '#aaddff';
        ctx.font      = '10px sans-serif';
        if (item.catchMult)                          ctx.fillText(`${item.catchMult}× catch rate`, x + 48, y + 52);
        else if (item.heal && item.heal !== 'third') ctx.fillText(`+${item.heal === 9999 ? 'Full' : item.heal} HP`, x + 48, y + 52);
        else if (item.cures)                         ctx.fillText(`Cures ${item.cures}`, x + 48, y + 52);
        else if (item.pp)                            ctx.fillText(`+${item.pp === 9999 ? 'Full' : item.pp} PP`, x + 48, y + 52);
        else if (item.ppAll)                         ctx.fillText(`+${item.ppAll === 9999 ? 'Full' : item.ppAll} PP all`, x + 48, y + 52);
        else if (item.catchBoost)                    ctx.fillText(`${item.catchBoost}× catch boost`, x + 48, y + 52);
    }

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, H - 30, W, 30);
    ctx.fillStyle = '#aaaaaa';
    ctx.font      = '11px sans-serif';
    ctx.fillText('SOLDIER² Pokémart  •  ×pokestore pokeballs/healing/berries', padX, H - 10);

    return canvas.toBuffer('image/png');
}

// ── Generate bag canvas ──
async function generateBagCanvas(userId, category = 'pokeballs') {
    const bag    = getUserBag(userId);
    const owned  = Object.entries(bag[category] || {}).filter(([, qty]) => qty > 0);
    const cols   = 4;
    const rows   = Math.max(1, Math.ceil(owned.length / cols));
    const cellW  = 160, cellH = 90;
    const padX   = 20, padY = 20;
    const headerH = 80;
    const W = cols * cellW + padX * 2;
    const H = headerH + rows * cellH + padY * 2 + 30;

    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext('2d');

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#2d1b69');
    bg.addColorStop(1, '#11091f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.globalAlpha = 0.05;
    for (let r = 0; r < H / 25; r++) {
        for (let c = 0; c < W / 25; c++) {
            if ((r + c) % 2 === 0) { ctx.fillStyle = '#ffffff'; ctx.fillRect(c * 25, r * 25, 25, 25); }
        }
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, headerH);

    ctx.fillStyle = '#FFD700';
    ctx.font      = 'bold 24px sans-serif';
    ctx.fillText('🎒 BAG', padX, 35);

    ctx.fillStyle = '#ffffff';
    ctx.font      = '13px sans-serif';
    const catLabels = { pokeballs: 'Poké Balls', healing: 'Medicine', berries: 'Berries' };
    ctx.fillText(`${catLabels[category]}  •  Use ×bag pokeballs/healing/berries`, padX, 58);

    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth   = 1.5;
    ctx.beginPath(); ctx.moveTo(0, headerH); ctx.lineTo(W, headerH); ctx.stroke();

    if (owned.length === 0) {
        ctx.fillStyle = '#aaaaaa';
        ctx.font      = '16px sans-serif';
        ctx.fillText('No items in this category.', padX, headerH + 50);
    }

    for (let i = 0; i < owned.length; i++) {
        const [key, qty] = owned[i];
        const item = POKE_ITEMS[category]?.[key];
        if (!item) continue;

        const col = i % cols;
        const row = Math.floor(i / cols);
        const x   = padX + col * cellW;
        const y   = headerH + padY + row * cellH;

        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.beginPath(); ctx.roundRect(x, y, cellW - 8, cellH - 8, 8); ctx.fill();

        ctx.strokeStyle = 'rgba(255,215,0,0.25)';
        ctx.lineWidth   = 1;
        ctx.beginPath(); ctx.roundRect(x, y, cellW - 8, cellH - 8, 8); ctx.stroke();

        try { const img = await loadImage(item.sprite); ctx.drawImage(img, x + 8, y + 10, 32, 32); } catch {}

        ctx.fillStyle = '#ffffff';
        ctx.font      = 'bold 11px sans-serif';
        ctx.fillText(item.label.slice(0, 16), x + 46, y + 22);

        ctx.fillStyle = '#FFD700';
        ctx.font      = 'bold 14px sans-serif';
        ctx.fillText(`×${qty}`, x + 46, y + 42);
    }

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, H - 26, W, 26);
    ctx.fillStyle = '#888888';
    ctx.font      = '10px sans-serif';
    ctx.fillText('SOLDIER² Bag  •  Use ×useitem <item> <party slot>', padX, H - 8);

    return canvas.toBuffer('image/png');
}

// ============================================================
//  POKÉMON PHASE 2 — SPAWN & CATCH HELPERS
// ============================================================
const spawnTimers = {};

function buildSpawnEmbed(pokemon, shiny) {
    const sprite = shiny
        ? (pokemon.spriteShiny || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.id}.png`)
        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
    return new EmbedBuilder()
        .setColor(shiny ? 0xFFD700 : 0xFF6900)
        .setTitle(`${shiny ? '✨ A shiny wild ' : '🌿 A wild '}**${formatPokeName(pokemon.name)}** appeared!`)
        .setDescription(
            `Use \`×catch <ball>\` to throw a Pokéball!\n` +
            `Example: \`×catch poke-ball\` or \`×catch ultra-ball\`\n\n` +
            `**Type:** ${pokemon.types.map(t => formatPokeName(t)).join(' / ')}\n` +
            `${shiny ? '\n✨ **This is a SHINY Pokémon! Extremely rare!**' : ''}\n\n` +
            `*No Pokéballs? Buy some with \`×pokestore\`*`
        )
        .setImage(sprite)
        .setFooter({ text: `Flees in ${SPAWN_DESPAWN_MINS} minutes • SOLDIER² Pokémon` })
        .setTimestamp();
}

function calculateCatchSuccess(catchRate, currentHp, maxHp) {
    const safeCatchRate = Math.max(1, Math.min(255, catchRate || 45));
    const a  = Math.floor((3 * maxHp - 2 * currentHp) * safeCatchRate / (3 * maxHp));
    const b  = Math.floor(1048560 / Math.sqrt(Math.sqrt(Math.max(1, 16711680 / Math.max(1, a)))));
    const s1 = Math.floor(Math.random() * 65536);
    const s2 = Math.floor(Math.random() * 65536);
    const s3 = Math.floor(Math.random() * 65536);
    return s1 < b && s2 < b && s3 < b;
}

async function spawnWildPokemon(guildId) {
    const channelId = botData.pokemonSpawnChannels?.[guildId];
    if (!channelId) return;

    const channel = client.channels.cache.get(channelId);
    if (!channel) return;

    const randomId = SPAWN_POOL[Math.floor(Math.random() * SPAWN_POOL.length)];
    const data     = await fetchPokemon(randomId);
    if (!data) { scheduleNextSpawn(guildId); return; }

    const shiny    = rollShiny();
    const spawnMsg = await channel.send({ embeds: [buildSpawnEmbed(data, shiny)] }).catch(() => null);
    if (!spawnMsg) { scheduleNextSpawn(guildId); return; }

    if (!botData.activeSpawns) botData.activeSpawns = {};
    botData.activeSpawns[guildId] = {
        messageId:     spawnMsg.id,
        channelId,
        pokemon:       data,
        shiny,
        spawnedAt:     Date.now(),
        catchAttempts: {},
    };
    markDirty(); scheduleSave();

    setTimeout(async () => {
        const current = botData.activeSpawns?.[guildId];
        if (!current || current.messageId !== spawnMsg.id) return;

        const fledEmbed = new EmbedBuilder()
            .setColor(0x95A5A6)
            .setTitle(`🌿 The wild **${formatPokeName(data.name)}** fled!`)
            .setDescription('It got away safely...')
            .setImage(shiny ? data.spriteShiny : data.sprite)
            .setFooter({ text: 'SOLDIER² Pokémon' })
            .setTimestamp();

        await spawnMsg.edit({ embeds: [fledEmbed] }).catch(() => {});
        delete botData.activeSpawns[guildId];
        markDirty(); scheduleSave();
        scheduleNextSpawn(guildId);
    }, SPAWN_DESPAWN_MINS * 60 * 1000);

    scheduleNextSpawn(guildId);
}

function scheduleNextSpawn(guildId) {
    if (spawnTimers[guildId]) {
        clearTimeout(spawnTimers[guildId]);
        delete spawnTimers[guildId];
    }
    const minMs = SPAWN_MIN_MINUTES * 60 * 1000;
    const maxMs = SPAWN_MAX_MINUTES * 60 * 1000;
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    spawnTimers[guildId] = setTimeout(() => spawnWildPokemon(guildId), delay);
}

function resumeAllSpawns() {
    if (!botData.pokemonSpawnChannels) return;
    for (const guildId of Object.keys(botData.pokemonSpawnChannels)) {
        scheduleNextSpawn(guildId);
    }
}

// ============================================================
//  POKÉMON BATTLE — CANVAS IMAGE GENERATOR
// ============================================================
async function generateBattleImage(battle) {
    const W = 800, H = 300;
    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext('2d');

    const weather = battle.weather || null;
    const wInfo   = weather ? WEATHER_INFO[weather] : null;
    const p1      = battle.player1;
    const p2      = battle.player2;
    const enemyType = p2.pokemon.types?.[0]?.toLowerCase() || 'normal';

    const TYPE_ARENAS = {
        normal:   { top: '#6e6e6e', mid: '#4a4a4a', bot: '#2e2e2e', ground: '#888888',
            fx: (ctx, W, H) => { for (let i = 0; i < 20; i++) { ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.06})`; ctx.beginPath(); ctx.arc(Math.random()*W, Math.random()*H, Math.random()*40+10, 0, Math.PI*2); ctx.fill(); } } },
        fire:     { top: '#7f0000', mid: '#bf360c', bot: '#e64a19', ground: '#ff6d00',
            fx: (ctx, W, H) => { for (let i = 0; i < 25; i++) { ctx.fillStyle = `rgba(255,${Math.floor(Math.random()*80+80)},0,${Math.random()*0.3+0.1})`; ctx.beginPath(); ctx.ellipse(Math.random()*W, H*0.6+Math.random()*H*0.4, Math.random()*8+3, Math.random()*18+6, 0, 0, Math.PI*2); ctx.fill(); } const glow = ctx.createRadialGradient(W*0.5,H,10,W*0.5,H,200); glow.addColorStop(0,'rgba(255,100,0,0.25)'); glow.addColorStop(1,'rgba(255,0,0,0)'); ctx.fillStyle=glow; ctx.fillRect(0,0,W,H); } },
        water:    { top: '#0d3b6e', mid: '#1565c0', bot: '#0288d1', ground: '#29b6f6',
            fx: (ctx, W, H) => { for (let i = 0; i < 30; i++) { ctx.strokeStyle = `rgba(100,200,255,${Math.random()*0.2+0.05})`; ctx.lineWidth = Math.random()*2+1; ctx.beginPath(); ctx.moveTo(Math.random()*W, Math.random()*H); ctx.quadraticCurveTo(Math.random()*W, Math.random()*H, Math.random()*W, Math.random()*H); ctx.stroke(); } } },
        grass:    { top: '#1b5e20', mid: '#2e7d32', bot: '#388e3c', ground: '#66bb6a',
            fx: (ctx, W, H) => { for (let i = 0; i < 20; i++) { ctx.strokeStyle = `rgba(100,255,100,${Math.random()*0.2})`; ctx.lineWidth = 1; const x = Math.random()*W; ctx.beginPath(); ctx.moveTo(x, H); ctx.quadraticCurveTo(x+Math.random()*20-10, H-Math.random()*40, x+Math.random()*10-5, H-Math.random()*60-10); ctx.stroke(); } ctx.fillStyle = 'rgba(50,200,50,0.06)'; ctx.fillRect(0,0,W,H); } },
        electric: { top: '#1a1a00', mid: '#3d3400', bot: '#665c00', ground: '#fdd835',
            fx: (ctx, W, H) => { for (let i = 0; i < 12; i++) { ctx.strokeStyle = `rgba(255,235,${Math.floor(Math.random()*50)},${Math.random()*0.5+0.2})`; ctx.lineWidth = Math.random()*2+0.5; ctx.beginPath(); let x = Math.random()*W, y = 0; ctx.moveTo(x, y); for (let j = 0; j < 6; j++) { x += Math.random()*30-15; y += H/6; ctx.lineTo(x, y); } ctx.stroke(); } ctx.fillStyle = 'rgba(255,220,0,0.07)'; ctx.fillRect(0,0,W,H); } },
        ice:      { top: '#e0f7fa', mid: '#80deea', bot: '#4dd0e1', ground: '#b2ebf2',
            fx: (ctx, W, H) => { for (let i = 0; i < 30; i++) { ctx.fillStyle = `rgba(200,240,255,${Math.random()*0.4+0.1})`; ctx.beginPath(); ctx.arc(Math.random()*W, Math.random()*H, Math.random()*3+1, 0, Math.PI*2); ctx.fill(); } ctx.fillStyle = 'rgba(180,240,255,0.08)'; ctx.fillRect(0,0,W,H); } },
        fighting: { top: '#3e0000', mid: '#7f1010', bot: '#b71c1c', ground: '#d32f2f',
            fx: (ctx, W, H) => { for (let i = 0; i < 15; i++) { ctx.fillStyle = `rgba(200,50,50,${Math.random()*0.15})`; ctx.beginPath(); ctx.arc(Math.random()*W, Math.random()*H, Math.random()*50+10, 0, Math.PI*2); ctx.fill(); } for (let i = 0; i < 8; i++) { ctx.strokeStyle = `rgba(255,100,100,${Math.random()*0.2})`; ctx.lineWidth = Math.random()*3+1; ctx.beginPath(); ctx.moveTo(Math.random()*W, 0); ctx.lineTo(Math.random()*W, H); ctx.stroke(); } } },
        poison:   { top: '#1a0033', mid: '#4a148c', bot: '#6a1b9a', ground: '#ab47bc',
            fx: (ctx, W, H) => { for (let i = 0; i < 20; i++) { ctx.fillStyle = `rgba(180,0,255,${Math.random()*0.15})`; ctx.beginPath(); ctx.arc(Math.random()*W, Math.random()*H, Math.random()*15+3, 0, Math.PI*2); ctx.fill(); } ctx.fillStyle = 'rgba(130,0,200,0.08)'; ctx.fillRect(0,0,W,H); } },
        ground:   { top: '#3e2000', mid: '#6d4c18', bot: '#8d6e2a', ground: '#bcaa74',
            fx: (ctx, W, H) => { for (let i = 0; i < 25; i++) { ctx.fillStyle = `rgba(180,140,60,${Math.random()*0.2})`; ctx.beginPath(); ctx.ellipse(Math.random()*W, Math.random()*H, Math.random()*20+5, 3, Math.random()*Math.PI, 0, Math.PI*2); ctx.fill(); } } },
        flying:   { top: '#1a237e', mid: '#283593', bot: '#3949ab', ground: '#90caf9',
            fx: (ctx, W, H) => { for (let i = 0; i < 12; i++) { ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.15+0.05})`; ctx.beginPath(); ctx.ellipse(Math.random()*W, Math.random()*H*0.6, Math.random()*80+20, Math.random()*20+5, 0, 0, Math.PI*2); ctx.fill(); } const skyGlow = ctx.createRadialGradient(W*0.5,0,10,W*0.5,0,200); skyGlow.addColorStop(0,'rgba(150,180,255,0.2)'); skyGlow.addColorStop(1,'rgba(0,0,100,0)'); ctx.fillStyle=skyGlow; ctx.fillRect(0,0,W,H); } },
        psychic:  { top: '#0f0c29', mid: '#302b63', bot: '#24243e', ground: '#ce93d8',
            fx: (ctx, W, H) => { for (let i = 0; i < 20; i++) { ctx.strokeStyle = `rgba(255,100,220,${Math.random()*0.2})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(W/2+Math.random()*100-50, H/2+Math.random()*100-50, Math.random()*80+20, 0, Math.PI*2); ctx.stroke(); } ctx.fillStyle = 'rgba(200,0,255,0.05)'; ctx.fillRect(0,0,W,H); } },
        bug:      { top: '#1b3a00', mid: '#33691e', bot: '#558b2f', ground: '#aed581',
            fx: (ctx, W, H) => { for (let i = 0; i < 15; i++) { ctx.fillStyle = `rgba(150,255,50,${Math.random()*0.12})`; ctx.beginPath(); ctx.arc(Math.random()*W, Math.random()*H, Math.random()*20+5, 0, Math.PI*2); ctx.fill(); } } },
        rock:     { top: '#212121', mid: '#37474f', bot: '#455a64', ground: '#90a4ae',
            fx: (ctx, W, H) => { for (let i = 0; i < 20; i++) { ctx.fillStyle = `rgba(150,150,150,${Math.random()*0.15})`; const x=Math.random()*W, y=Math.random()*H, s=Math.random()*20+5; ctx.beginPath(); ctx.moveTo(x,y-s); ctx.lineTo(x+s,y); ctx.lineTo(x,y+s); ctx.lineTo(x-s,y); ctx.closePath(); ctx.fill(); } } },
        ghost:    { top: '#0a0014', mid: '#1a0033', bot: '#2d004d', ground: '#7b1fa2',
            fx: (ctx, W, H) => { for (let i = 0; i < 15; i++) { ctx.fillStyle = `rgba(150,0,255,${Math.random()*0.12})`; ctx.beginPath(); ctx.arc(Math.random()*W, Math.random()*H, Math.random()*30+10, 0, Math.PI*2); ctx.fill(); } for (let i = 0; i < 20; i++) { ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.06})`; ctx.beginPath(); ctx.arc(Math.random()*W, Math.random()*H, Math.random()*2+1, 0, Math.PI*2); ctx.fill(); } } },
        dragon:   { top: '#0d0d1a', mid: '#1a237e', bot: '#311b92', ground: '#7c4dff',
            fx: (ctx, W, H) => { for (let i = 0; i < 15; i++) { ctx.strokeStyle = `rgba(100,100,255,${Math.random()*0.25})`; ctx.lineWidth = Math.random()*2+1; ctx.beginPath(); ctx.moveTo(Math.random()*W, 0); ctx.bezierCurveTo(Math.random()*W, H*0.3, Math.random()*W, H*0.6, Math.random()*W, H); ctx.stroke(); } const dragonGlow = ctx.createRadialGradient(W*0.5,H*0.5,10,W*0.5,H*0.5,250); dragonGlow.addColorStop(0,'rgba(80,0,255,0.15)'); dragonGlow.addColorStop(1,'rgba(0,0,80,0)'); ctx.fillStyle=dragonGlow; ctx.fillRect(0,0,W,H); } },
        dark:     { top: '#0a0a0a', mid: '#1a1a1a', bot: '#0d0d0d', ground: '#424242',
            fx: (ctx, W, H) => { for (let i = 0; i < 25; i++) { ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.05})`; ctx.beginPath(); ctx.arc(Math.random()*W, Math.random()*H, Math.random()*2+0.5, 0, Math.PI*2); ctx.fill(); } ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0,0,W,H); } },
        steel:    { top: '#1c1c2e', mid: '#2e3a4a', bot: '#37474f', ground: '#90a4ae',
            fx: (ctx, W, H) => { for (let i = 0; i < 15; i++) { ctx.strokeStyle = `rgba(180,200,220,${Math.random()*0.15})`; ctx.lineWidth = Math.random()*3+1; const x = Math.random()*W; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x+Math.random()*20-10, H); ctx.stroke(); } ctx.fillStyle = 'rgba(150,180,200,0.05)'; ctx.fillRect(0,0,W,H); } },
        fairy:    { top: '#1a001a', mid: '#4a0040', bot: '#7b0060', ground: '#f48fb1',
            fx: (ctx, W, H) => { for (let i = 0; i < 30; i++) { ctx.fillStyle = `rgba(255,150,255,${Math.random()*0.2})`; ctx.beginPath(); ctx.arc(Math.random()*W, Math.random()*H, Math.random()*4+1, 0, Math.PI*2); ctx.fill(); } const fairyGlow = ctx.createRadialGradient(W*0.5,H*0.3,10,W*0.5,H*0.3,200); fairyGlow.addColorStop(0,'rgba(255,100,255,0.15)'); fairyGlow.addColorStop(1,'rgba(200,0,200,0)'); ctx.fillStyle=fairyGlow; ctx.fillRect(0,0,W,H); } },
    };

    const arena = TYPE_ARENAS[enemyType] || TYPE_ARENAS.normal;

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0,   wInfo ? wInfo.bgTop : arena.top);
    bg.addColorStop(0.5, wInfo ? wInfo.bgTop : arena.mid);
    bg.addColorStop(1,   wInfo ? wInfo.bgBot : arena.bot);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (!wInfo) arena.fx(ctx, W, H);

    if (weather === 'rain') {
        ctx.strokeStyle = 'rgba(100,160,255,0.25)'; ctx.lineWidth = 1;
        for (let i = 0; i < 40; i++) { const rx = Math.random()*W, ry = Math.random()*H; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx-4, ry+12); ctx.stroke(); }
    }
    if (weather === 'sandstorm') {
        ctx.fillStyle = 'rgba(200,160,80,0.15)'; ctx.fillRect(0,0,W,H);
        for (let i = 0; i < 30; i++) { ctx.fillStyle = `rgba(200,160,80,${Math.random()*0.2})`; ctx.beginPath(); ctx.ellipse(Math.random()*W, Math.random()*H, Math.random()*20+5, 3, Math.random()*Math.PI, 0, Math.PI*2); ctx.fill(); }
    }
    if (weather === 'hail' || weather === 'snow') {
        for (let i = 0; i < 35; i++) { ctx.fillStyle = `rgba(200,230,255,${Math.random()*0.4+0.1})`; ctx.beginPath(); ctx.arc(Math.random()*W, Math.random()*H, Math.random()*3+1, 0, Math.PI*2); ctx.fill(); }
    }
    if (weather === 'sun') {
        const sunGlow = ctx.createRadialGradient(W*0.5,-20,10,W*0.5,-20,250);
        sunGlow.addColorStop(0,'rgba(255,200,50,0.35)'); sunGlow.addColorStop(1,'rgba(255,150,0,0)');
        ctx.fillStyle = sunGlow; ctx.fillRect(0,0,W,H);
    }

    if (wInfo) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.roundRect(W/2-80, 5, 160, 24, 6); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(wInfo.label, W/2, 22); ctx.textAlign = 'left';
    }

    ctx.strokeStyle = wInfo ? '#e94560' : (arena.ground || '#e94560');
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.moveTo(0, H*0.72); ctx.lineTo(W, H*0.72); ctx.stroke();

    ctx.fillStyle = wInfo ? 'rgba(233,69,96,0.15)' : 'rgba(255,255,255,0.10)';
    ctx.beginPath(); ctx.ellipse(180, H*0.72, 100, 16, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(620, H*0.72, 100, 16, 0, 0, Math.PI*2); ctx.fill();

    try {
        const p1Url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p1.pokemon.id}.png`;
        const img = await loadImage(p1Url);
        ctx.drawImage(img, 80, H*0.05, 180, 180);
    } catch {}

    try {
        const p2Url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p2.pokemon.id}.png`;
        const img = await loadImage(p2Url);
        ctx.save(); ctx.translate(620+90, 0); ctx.scale(-1, 1);
        ctx.drawImage(img, 0, H*0.08, 180, 180); ctx.restore();
    } catch {}

    function getStatusColor(status) {
        const map = { burn:'#cc4400', paralysis:'#ccaa00', poison:'#884488', sleep:'#446688', freeze:'#4488cc', confusion:'#886644' };
        return map[status] || '#666666';
    }

    function drawHPBar(x, y, current, max, name, level, status) {
        const barW = 180, barH = 10;
        const pct    = Math.max(0, current / max);
        const filled = Math.floor(pct * barW);

        ctx.fillStyle = 'rgba(0,0,0,0.60)'; ctx.beginPath(); ctx.roundRect(x, y, 210, 72, 8); ctx.fill();
        ctx.strokeStyle = '#e94560'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(x, y, 210, 72, 8); ctx.stroke();

        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px sans-serif';
        ctx.fillText(`${name}  Lv.${level}`, x+10, y+18);

        if (status) {
            ctx.fillStyle = getStatusColor(status); ctx.beginPath(); ctx.roundRect(x+130, y+6, 68, 16, 4); ctx.fill();
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px sans-serif';
            ctx.fillText(status.toUpperCase(), x+136, y+18);
        }

        ctx.fillStyle = '#aaaaaa'; ctx.font = '11px sans-serif'; ctx.fillText('HP', x+10, y+38);
        ctx.fillStyle = '#2a2a4a'; ctx.beginPath(); ctx.roundRect(x+28, y+28, barW, barH, 5); ctx.fill();

        let barColor = '#44cc44';
        if (pct <= 0.5) barColor = '#ffcc00';
        if (pct <= 0.2) barColor = '#ff4444';

        if (filled > 0) { ctx.fillStyle = barColor; ctx.beginPath(); ctx.roundRect(x+28, y+28, filled, barH, 5); ctx.fill(); }

        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`${current}/${max}`, x+28, y+58);
    }

    drawHPBar(W-225, H-88, p2.currentHp, p2.maxHp, formatPokeName(p2.pokemon.name), p2.pokemon.level, p2.statusEffect);
    drawHPBar(15,     H-88, p1.currentHp, p1.maxHp, formatPokeName(p1.pokemon.name), p1.pokemon.level, p1.statusEffect);

    ctx.fillStyle = 'rgba(233,69,96,0.85)'; ctx.font = 'bold 28px sans-serif';
    ctx.fillText('VS', W/2-16, H/2+8);

    return canvas.toBuffer('image/png');
}

// ============================================================
//  POKÉMON PHASE 3 — BATTLE ENGINE
// ============================================================

const TYPE_CHART = {
    normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
    fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
    poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
    ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
    flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug:      { fire: 0.5, grass: 2, fighting: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
    rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
    dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
    fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

function getTypeEffectiveness(moveType, defenderTypes) {
    let multiplier = 1;
    for (const defType of defenderTypes) {
        const row = TYPE_CHART[moveType];
        if (row && row[defType] !== undefined) multiplier *= row[defType];
    }
    return multiplier;
}

function getEffectivenessText(multiplier) {
    if (multiplier === 0)  return "It doesn't affect the target...";
    if (multiplier >= 2)   return "⚡ It's super effective!";
    if (multiplier <= 0.5) return "😐 It's not very effective...";
    return null;
}

function calculateDamage(attacker, defender, move) {
    if (!move.power || move.power === 0) return { damage: 0, isCrit: false, effectiveness: 1, missed: false, failed: false };
    if (Math.random() * 100 > (move.accuracy || 100)) return { damage: 0, isCrit: false, effectiveness: 1, missed: true, failed: false };
    if (attacker.statusEffect === 'paralysis' && Math.random() < 0.25) return { damage: 0, isCrit: false, effectiveness: 1, missed: false, failed: true };
    if (attacker.statusEffect === 'sleep' || attacker.statusEffect === 'freeze') return { damage: 0, isCrit: false, effectiveness: 1, missed: false, failed: true };

    const isPhys = move.category === 'physical';
    const atk    = isPhys ? attacker.pokemon.stats.attack       : attacker.pokemon.stats.specialAttack;
    const def    = isPhys ? defender.pokemon.stats.defense      : defender.pokemon.stats.specialDefense;
    const level  = attacker.pokemon.level;
    const atkMod = (attacker.statusEffect === 'burn' && isPhys) ? 0.5 : 1;

    let damage = Math.floor(
        (Math.floor((2 * level / 5 + 2) * move.power * (atk * atkMod) / def) / 50) + 2
    );

    if (attacker.pokemon.types.includes(move.type)) damage = Math.floor(damage * 1.5);

    const effectiveness = getTypeEffectiveness(move.type, defender.pokemon.types);
    damage = Math.floor(damage * effectiveness);
    damage = Math.floor(damage * ((Math.floor(Math.random() * 16) + 85) / 100));

    const isCrit = Math.random() < (1 / 16);
    if (isCrit) damage = Math.floor(damage * 1.5);

    return { damage: Math.max(1, damage), isCrit, effectiveness, missed: false, failed: false };
}

function applyEndOfTurnStatus(fighter) {
    const messages = [];
    let skipMove   = false;
    if (!fighter.statusEffect) return { messages, skipMove };

    if (fighter.statusEffect === 'poison') {
        const dmg = Math.max(1, Math.floor(fighter.maxHp / 8));
        fighter.currentHp = Math.max(0, fighter.currentHp - dmg);
        messages.push(`☠️ **${formatPokeName(fighter.pokemon.name)}** is hurt by poison! (-${dmg} HP)`);
    }
    if (fighter.statusEffect === 'burn') {
        const dmg = Math.max(1, Math.floor(fighter.maxHp / 16));
        fighter.currentHp = Math.max(0, fighter.currentHp - dmg);
        messages.push(`🔥 **${formatPokeName(fighter.pokemon.name)}** is hurt by its burn! (-${dmg} HP)`);
    }
    if (fighter.statusEffect === 'sleep') {
        fighter.sleepTurns = (fighter.sleepTurns || 0) + 1;
        if (fighter.sleepTurns >= 3) {
            fighter.statusEffect = null; fighter.sleepTurns = 0;
            messages.push(`😴 **${formatPokeName(fighter.pokemon.name)}** woke up!`);
        } else {
            messages.push(`😴 **${formatPokeName(fighter.pokemon.name)}** is fast asleep!`);
            skipMove = true;
        }
    }
    if (fighter.statusEffect === 'freeze') {
        if (Math.random() < 0.2) {
            fighter.statusEffect = null;
            messages.push(`🧊 **${formatPokeName(fighter.pokemon.name)}** thawed out!`);
        } else {
            messages.push(`🧊 **${formatPokeName(fighter.pokemon.name)}** is frozen solid!`);
            skipMove = true;
        }
    }
    if (fighter.statusEffect === 'confusion') {
        fighter.confusionTurns = (fighter.confusionTurns || 0) + 1;
        if (fighter.confusionTurns >= 4) {
            fighter.statusEffect = null; fighter.confusionTurns = 0;
            messages.push(`😵 **${formatPokeName(fighter.pokemon.name)}** snapped out of confusion!`);
        } else if (Math.random() < 0.5) {
            const dmg = Math.max(1, Math.floor(fighter.maxHp / 8));
            fighter.currentHp = Math.max(0, fighter.currentHp - dmg);
            messages.push(`😵 **${formatPokeName(fighter.pokemon.name)}** hurt itself in confusion! (-${dmg} HP)`);
            skipMove = true;
        }
    }
    return { messages, skipMove };
}

function applyMoveEffect(move, target) {
    const messages = [];
    if (target.statusEffect) return messages;
    const effect = move.effect?.toLowerCase() || '';

    if      (effect.includes('burn')     && Math.random() < 0.1) { target.statusEffect = 'burn';      messages.push(`🔥 **${formatPokeName(target.pokemon.name)}** was burned!`);       }
    else if (effect.includes('paralyze') && Math.random() < 0.1) { target.statusEffect = 'paralysis'; messages.push(`⚡ **${formatPokeName(target.pokemon.name)}** was paralyzed!`);   }
    else if (effect.includes('poison')   && Math.random() < 0.1) { target.statusEffect = 'poison';    messages.push(`☠️ **${formatPokeName(target.pokemon.name)}** was poisoned!`);    }
    else if (effect.includes('sleep')    && Math.random() < 0.1) { target.statusEffect = 'sleep';     messages.push(`😴 **${formatPokeName(target.pokemon.name)}** fell asleep!`);     }
    else if (effect.includes('freeze')   && Math.random() < 0.1) { target.statusEffect = 'freeze';    messages.push(`🧊 **${formatPokeName(target.pokemon.name)}** was frozen!`);      }
    else if (effect.includes('confus')   && Math.random() < 0.1) { target.statusEffect = 'confusion'; messages.push(`😵 **${formatPokeName(target.pokemon.name)}** became confused!`); }

    return messages;
}

function buildBattleEmbed(battle, turnLog = [], imageAttachment = null) {
    const p1     = battle.player1;
    const p2     = battle.player2;
    const isBot  = battle.type === 'pve';
    const p1Stat = p1.statusEffect ? ` ${getStatusEmoji(p1.statusEffect)} ${p1.statusEffect.toUpperCase()}` : '';
    const p2Stat = p2.statusEffect ? ` ${getStatusEmoji(p2.statusEffect)} ${p2.statusEffect.toUpperCase()}` : '';

    const embed = new EmbedBuilder()
        .setColor(0xFF6900)
        .setTitle(`⚔️ Pokémon Battle!${battle.weather ? '  ' + (WEATHER_INFO[battle.weather]?.label || '') : ''}`)
        .addFields(
            {
                name:  `${isBot ? '🤖 BOT' : `<@${p2.userId}>`} — ${p2.shiny ? '✨ ' : ''}${formatPokeName(p2.pokemon.name)} Lv.${p2.pokemon.level}`,
                value: `HP: \`${p2.currentHp}/${p2.maxHp}\`${p2Stat}`,
                inline: false,
            },
            {
                name:  `<@${p1.userId}> — ${p1.shiny ? '✨ ' : ''}${formatPokeName(p1.pokemon.name)} Lv.${p1.pokemon.level}`,
                value: `HP: \`${p1.currentHp}/${p1.maxHp}\`${p1Stat}`,
                inline: false,
            },
        );

    if (turnLog.length) {
        embed.addFields({
            name:  `📋 Turn ${battle.turnNumber}`,
            value: turnLog.join('\n').slice(0, 1024),
            inline: false,
        });
    }

    if (battle.phase === 'selecting' && !battle.switchPending) {
        embed.addFields({
            name:  '🎮 Select Your Move',
            value: battle.player1.pokemon.moves.map((m, i) => {
                const pp    = battle.player1.pokemon.pp?.[m];
                const ppStr = pp !== undefined ? ` *(${pp} PP)*` : '';
                return `${['1️⃣','2️⃣','3️⃣','4️⃣'][i]} \`${formatPokeName(m)}\`${ppStr}`;
            }).join('\n'),
            inline: false,
        });
    }

    if (battle.switchPending) {
        const ud        = getUserPokemon(battle.switchPending);
        const available = ud.party
            .map((idx, slot) => ({ idx, slot, pkm: ud.collection[idx] }))
            .filter(e => e.pkm && e.pkm.uid !== battle.player1.pokemon.uid && (e.pkm.currentBattleHp ?? e.pkm.stats.hp) > 0);
        const switchLines = available.map((e, i) =>
            `${['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣'][i]} ${formatPokeName(e.pkm.name)} Lv.${e.pkm.level}`
        );
        embed.addFields({
            name:  '🔄 Choose Your Next Pokémon',
            value: switchLines.join('\n') || 'No Pokémon available.',
            inline: false,
        });
    }

    if (p2.pokemon.sprite) embed.setImage(p2.pokemon.sprite);
    if (p1.pokemon.sprite) embed.setThumbnail(p1.pokemon.sprite);
    if (imageAttachment)   embed.setImage(`attachment://${imageAttachment.name}`);
    embed.setFooter({ text: 'SOLDIER² Pokémon Battle' }).setTimestamp();
    return embed;
}

async function getBotMove(botFighter) {
    return botFighter.pokemon.moves[Math.floor(Math.random() * botFighter.pokemon.moves.length)];
}

function generateBattleId() {
    return `battle_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
}

// ============================================================
//  WEATHER & ABILITY SYSTEM
// ============================================================
const WEATHER_MOVES = {
    'sunny-day':  'sun',
    'rain-dance': 'rain',
    'sandstorm':  'sandstorm',
    'hail':       'hail',
    'snowscape':  'snow',
};

const WEATHER_INFO = {
    sun:       { label: '☀️ Harsh Sunlight', color: '#FF8C00', bgTop: '#FF6B00', bgBot: '#FFD700' },
    rain:      { label: '🌧️ Heavy Rain',     color: '#4488FF', bgTop: '#1a3a6e', bgBot: '#0a1f4e' },
    sandstorm: { label: '🌪️ Sandstorm',      color: '#C8A050', bgTop: '#6B4C1E', bgBot: '#3D2B0A' },
    hail:      { label: '❄️ Hail',           color: '#88CCFF', bgTop: '#1a2a4e', bgBot: '#0a1530' },
    snow:      { label: '❄️ Snow',           color: '#AADDFF', bgTop: '#1e2e5e', bgBot: '#0f1a3a' },
};

const ABILITY_EFFECTS = {
    'swift-swim':    { trigger: 'weather', weather: 'rain',      stat: 'speed', mult: 2 },
    'chlorophyll':   { trigger: 'weather', weather: 'sun',       stat: 'speed', mult: 2 },
    'sand-rush':     { trigger: 'weather', weather: 'sandstorm', stat: 'speed', mult: 2 },
    'slush-rush':    { trigger: 'weather', weather: 'hail',      stat: 'speed', mult: 2 },
    'blaze':         { trigger: 'low-hp',  type: 'fire',  mult: 1.5 },
    'torrent':       { trigger: 'low-hp',  type: 'water', mult: 1.5 },
    'overgrow':      { trigger: 'low-hp',  type: 'grass', mult: 1.5 },
    'swarm':         { trigger: 'low-hp',  type: 'bug',   mult: 1.5 },
    'sand-veil':     { trigger: 'weather', weather: 'sandstorm', immune: true },
    'ice-body':      { trigger: 'weather', weather: 'hail',      heal: true },
    'rain-dish':     { trigger: 'weather', weather: 'rain',      heal: true },
    'dry-skin':      { trigger: 'weather', weather: 'rain',      heal: true },
    'solar-power':   { trigger: 'weather', weather: 'sun',       spatkBoost: 1.5 },
    'levitate':      { trigger: 'immune',  type: 'ground' },
    'flash-fire':    { trigger: 'immune',  type: 'fire',     boostOnHit: true },
    'volt-absorb':   { trigger: 'immune',  type: 'electric', healOnHit: true },
    'water-absorb':  { trigger: 'immune',  type: 'water',    healOnHit: true },
    'wonder-guard':  { trigger: 'superonly' },
    'intimidate':    { trigger: 'entry',   stat: 'attack', mult: 0.75 },
    'immunity':      { trigger: 'status-immune', statuses: ['poison'] },
    'insomnia':      { trigger: 'status-immune', statuses: ['sleep'] },
    'vital-spirit':  { trigger: 'status-immune', statuses: ['sleep'] },
    'own-tempo':     { trigger: 'status-immune', statuses: ['confusion'] },
    'oblivious':     { trigger: 'status-immune', statuses: ['confusion'] },
    'magma-armor':   { trigger: 'status-immune', statuses: ['freeze'] },
    'water-veil':    { trigger: 'status-immune', statuses: ['burn'] },
    'static':        { trigger: 'contact', status: 'paralysis', chance: 0.3 },
    'flame-body':    { trigger: 'contact', status: 'burn',      chance: 0.3 },
    'poison-point':  { trigger: 'contact', status: 'poison',    chance: 0.3 },
    'rough-skin':    { trigger: 'contact', recoil: 0.0625 },
    'iron-barbs':    { trigger: 'contact', recoil: 0.0625 },
    'speed-boost':   { trigger: 'end-of-turn', stat: 'speed', increment: 10 },
    'shed-skin':     { trigger: 'end-of-turn', clearStatus: true, chance: 0.33 },
};

function applyAbilityOnEntry(fighter, opponent, turnLog) {
    const ability = fighter.pokemon.ability;
    if (!ability) return;
    const eff = ABILITY_EFFECTS[ability];
    if (!eff || eff.trigger !== 'entry') return;
    if (eff.stat === 'attack') {
        opponent.atkMod = (opponent.atkMod || 1) * eff.mult;
        turnLog.push(`💪 **${formatPokeName(opponent.pokemon.name)}**'s Attack was lowered by **${formatPokeName(ability)}**!`);
    }
}

function checkAbilityImmunity(defenderFighter, moveType) {
    const ability = defenderFighter.pokemon.ability;
    if (!ability) return false;
    const eff = ABILITY_EFFECTS[ability];
    if (!eff) return false;
    if (eff.trigger === 'immune' && eff.type === moveType) return true;
    return false;
}

function applyWeatherEndOfTurn(battle, turnLog) {
    if (!battle.weather || battle.weatherTurns <= 0) {
        if (battle.weather) {
            turnLog.push(`☁️ The weather cleared up.`);
            battle.weather      = null;
            battle.weatherTurns = 0;
        }
        return;
    }
    battle.weatherTurns--;

    const w = battle.weather;
    for (const side of ['player1', 'player2']) {
        const fighter = battle[side];
        const ability  = fighter.pokemon.ability;
        const eff      = ABILITY_EFFECTS[ability] || {};

        if (w === 'sandstorm') {
            const types = fighter.pokemon.types;
            if (!types.some(t => ['rock','steel','ground'].includes(t)) && eff.trigger !== 'weather' && !eff.immune) {
                const dmg = Math.max(1, Math.floor(fighter.maxHp / 16));
                fighter.currentHp = Math.max(0, fighter.currentHp - dmg);
                turnLog.push(`🌪️ **${formatPokeName(fighter.pokemon.name)}** is buffeted by the sandstorm! (-${dmg} HP)`);
            }
        }
        if (w === 'hail' || w === 'snow') {
            const types = fighter.pokemon.types;
            if (!types.includes('ice') && eff.trigger !== 'weather') {
                const dmg = Math.max(1, Math.floor(fighter.maxHp / 16));
                fighter.currentHp = Math.max(0, fighter.currentHp - dmg);
                turnLog.push(`❄️ **${formatPokeName(fighter.pokemon.name)}** is buffeted by hail! (-${dmg} HP)`);
            }
        }
        if (
            (w === 'rain' && (ability === 'rain-dish' || ability === 'dry-skin')) ||
            (w === 'hail' && ability === 'ice-body')
        ) {
            const heal = Math.max(1, Math.floor(fighter.maxHp / 16));
            fighter.currentHp = Math.min(fighter.maxHp, fighter.currentHp + heal);
            turnLog.push(`💧 **${formatPokeName(fighter.pokemon.name)}** restored HP from the weather! (+${heal} HP)`);
        }
    }
}

function getWeatherMoveMult(weather, moveType) {
    if (!weather) return 1;
    if (weather === 'sun'  && moveType === 'fire')  return 1.5;
    if (weather === 'sun'  && moveType === 'water') return 0.5;
    if (weather === 'rain' && moveType === 'water') return 1.5;
    if (weather === 'rain' && moveType === 'fire')  return 0.5;
    return 1;
}

const battleMoveTimers = {};

function clearMoveTimeout(battleId) {
    if (battleMoveTimers[battleId]) {
        clearTimeout(battleMoveTimers[battleId]);
        delete battleMoveTimers[battleId];
    }
}

function setMoveTimeout(battleId, channel) {
    clearMoveTimeout(battleId);
    battleMoveTimers[battleId] = setTimeout(async () => {
        const battle = botData.activeBattles?.[battleId];
        if (!battle || battle.phase !== 'selecting') return;

        const timedOut = !battle.p1Move ? battle.player1.userId : battle.player2.userId;

        await channel.send({ embeds: [
            new EmbedBuilder()
                .setColor(0xE74C3C)
                .setTitle('⏰ Battle Timed Out')
                .setDescription(`<@${timedOut}> took too long to pick a move! Battle ended.`)
                .setTimestamp()
                .setFooter({ text: 'SOLDIER² Pokémon Battle' })
        ]}).catch(() => {});

        if (battle.type === 'pvp') {
            const winner = timedOut === battle.player1.userId ? battle.player2 : battle.player1;
            if (winner.userId !== 'BOT') {
                const wu = getUserPokemon(winner.userId);
                wu.battleStats.wins++;
            }
            const lu = getUserPokemon(timedOut);
            lu.battleStats.losses++;
            markDirty(); scheduleSave();
        }

        delete botData.activeBattles[battleId];
        markDirty(); scheduleSave();
    }, BATTLE_MOVE_TIMEOUT);
}

// ============================================================
//  EXECUTE TURN — CORRECTED
// ============================================================
async function executeTurn(battleId, channel) {
    const battle = botData.activeBattles[battleId];
    if (!battle) return;

    clearMoveTimeout(battleId);
    battle.phase  = 'executing';
    const turnLog = [];

    const p1Speed = battle.player1.pokemon.stats.speed;
    const p2Speed = battle.player2.pokemon.stats.speed;
    const order   = p1Speed >= p2Speed ? ['p1', 'p2'] : ['p2', 'p1'];

    for (const who of order) {
        const attacker = who === 'p1' ? battle.player1 : battle.player2;
        const defender = who === 'p1' ? battle.player2 : battle.player1;
        const moveName = who === 'p1' ? battle.p1Move  : battle.p2Move;

        if (attacker.currentHp <= 0) continue;
        if (moveName === '__item__' || moveName === '__switch__') continue;
        if (defender.currentHp <= 0) break;

        const statusResult = applyEndOfTurnStatus(attacker);
        turnLog.push(...statusResult.messages);
        if (statusResult.skipMove) continue;

        const moveData = await fetchMove(moveName);
        if (!moveData) continue;

        // ── Weather move check ──
        if (WEATHER_MOVES[moveData.name]) {
            const newWeather = WEATHER_MOVES[moveData.name];
            battle.weather      = newWeather;
            battle.weatherTurns = 5;
            const wLabel = WEATHER_INFO[newWeather]?.label || newWeather;
            turnLog.push(`**${formatPokeName(attacker.pokemon.name)}** used **${formatPokeName(moveData.name)}**!`);
            turnLog.push(`🌤️ ${wLabel} started!`);
            continue;
        }

        // ── Ability immunity check ──
        if (checkAbilityImmunity(defender, moveData.type)) {
            turnLog.push(`**${formatPokeName(attacker.pokemon.name)}** used **${formatPokeName(moveData.name)}**!`);
            turnLog.push(`🛡️ **${formatPokeName(defender.pokemon.name)}**'s **${formatPokeName(defender.pokemon.ability)}** made it immune!`);
            const eff = ABILITY_EFFECTS[defender.pokemon.ability];
            if (eff?.boostOnHit) defender.atkBoost = (defender.atkBoost || 1) * 1.5;
            if (eff?.healOnHit) {
                const heal = Math.max(1, Math.floor(defender.maxHp / 4));
                defender.currentHp = Math.min(defender.maxHp, defender.currentHp + heal);
                turnLog.push(`💚 **${formatPokeName(defender.pokemon.name)}** restored **${heal} HP**!`);
            }
            continue;
        }

        // ── PP check ──
        const ppOk = await usePP(attacker.pokemon, moveName);
        if (!ppOk) {
            turnLog.push(`**${formatPokeName(attacker.pokemon.name)}** has no PP left and used **Struggle**!`);
            const struggleDmg = Math.max(1, Math.floor(defender.maxHp / 4));
            const recoilDmg   = Math.max(1, Math.floor(attacker.maxHp / 4));
            defender.currentHp = Math.max(0, defender.currentHp - struggleDmg);
            defender.pokemon.currentBattleHp = defender.currentHp;
            attacker.currentHp = Math.max(0, attacker.currentHp - recoilDmg);
            attacker.pokemon.currentBattleHp = attacker.currentHp;
            turnLog.push(`💥 **${formatPokeName(defender.pokemon.name)}** took **${struggleDmg}** damage!`);
            turnLog.push(`💢 **${formatPokeName(attacker.pokemon.name)}** took **${recoilDmg}** recoil damage!`);
            continue;
        }

        turnLog.push(`**${formatPokeName(attacker.pokemon.name)}** used **${formatPokeName(moveData.name)}**!`);

        // ── Weather damage multiplier ──
        const weatherMult = getWeatherMoveMult(battle.weather, moveData.type);
        const moveDataWithWeather = weatherMult !== 1
            ? { ...moveData, power: Math.floor((moveData.power || 0) * weatherMult) }
            : moveData;

        // ── Ability attack boosts (Blaze/Torrent/Overgrow) ──
        const abilityEff = ABILITY_EFFECTS[attacker.pokemon.ability];
        let abilityMult  = 1;
        if (abilityEff?.trigger === 'low-hp' && abilityEff.type === moveData.type) {
            if (attacker.currentHp <= attacker.maxHp / 3) abilityMult = abilityEff.mult;
        }
        if (abilityEff?.trigger === 'weather' && abilityEff.weather === battle.weather && abilityEff.spatkBoost) {
            abilityMult = abilityEff.spatkBoost;
        }
        const finalMoveData = abilityMult !== 1
            ? { ...moveDataWithWeather, power: Math.floor((moveDataWithWeather.power || 0) * abilityMult) }
            : moveDataWithWeather;

        const result = calculateDamage(attacker, defender, finalMoveData);

        if (result.failed) {
            turnLog.push(attacker.statusEffect === 'paralysis'
                ? `⚡ **${formatPokeName(attacker.pokemon.name)}** is paralyzed! It can't move!`
                : `**${formatPokeName(attacker.pokemon.name)}** couldn't move!`
            );
            continue;
        }
        if (result.missed)       { turnLog.push(`💨 **${formatPokeName(attacker.pokemon.name)}'s** attack missed!`); continue; }
        if (result.damage === 0) { turnLog.push(`The move had no effect...`); continue; }
        if (result.isCrit)         turnLog.push(`⚡ A critical hit!`);

        const effectText = getEffectivenessText(result.effectiveness);
        if (effectText) turnLog.push(effectText);

        defender.currentHp = Math.max(0, defender.currentHp - result.damage);
        defender.pokemon.currentBattleHp = defender.currentHp;
        turnLog.push(`💥 **${formatPokeName(defender.pokemon.name)}** took **${result.damage}** damage!`);
        turnLog.push(...applyMoveEffect(moveData, defender));

        if (defender.currentHp <= 0) {
            turnLog.push(`💀 **${formatPokeName(defender.pokemon.name)}** fainted!`);
            break;
        }
    }

    // ── Weather end of turn ──
    applyWeatherEndOfTurn(battle, turnLog);

    battle.turnNumber++;

    const p1Fainted = battle.player1.currentHp <= 0;
    const p2Fainted = battle.player2.currentHp <= 0;

    if (p1Fainted || p2Fainted) {
        const faintedFighter = p1Fainted ? battle.player1 : battle.player2;

        if (faintedFighter.userId !== 'BOT') {
            const ud        = getUserPokemon(faintedFighter.userId);
            const available = ud.party
                .map(idx => ud.collection[idx])
                .filter(p => p && p.uid !== faintedFighter.pokemon.uid && (p.currentBattleHp ?? p.stats.hp) > 0);

            if (available.length > 0) {
                battle.switchPending = faintedFighter.userId;
                battle.phase         = 'switching';
                turnLog.push('');
                turnLog.push(`🔄 <@${faintedFighter.userId}> must choose their next Pokémon!`);

                const battleMsg = await channel.messages.fetch(battle.battleMsgId).catch(() => null);
                if (battleMsg) {
                    await battleMsg.edit({ embeds: [buildBattleEmbed(battle, turnLog)] }).catch(() => {});
                    await battleMsg.reactions.removeAll().catch(() => {});
                    for (let i = 0; i < Math.min(available.length, 5); i++) {
                        await battleMsg.react(['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣'][i]).catch(() => {});
                    }
                }
                markDirty(); scheduleSave();
                return;
            }
        }
        await endBattle(battleId, channel, turnLog, p1Fainted ? 'p2' : 'p1');
        return;
    }

    battle.phase  = 'selecting';
    battle.p1Move = null;
    battle.p2Move = null;

    const battleMsg = await channel.messages.fetch(battle.battleMsgId).catch(() => null);
    if (battleMsg) {
        const imgBuf  = await generateBattleImage(battle).catch(() => null);
        const imgFile = imgBuf ? new AttachmentBuilder(imgBuf, { name: `battle_${battle.turnNumber}.png` }) : null;
        await battleMsg.edit({ embeds: [buildBattleEmbed(battle, turnLog, imgFile)], files: imgFile ? [imgFile] : [] }).catch(() => {});
        await battleMsg.reactions.removeAll().catch(() => {});
        for (const emoji of ['1️⃣','2️⃣','3️⃣','4️⃣','🎒','🔄']) await battleMsg.react(emoji).catch(() => {});
    }

    if (battle.type === 'pve') {
        battle.p2Move = await getBotMove(battle.player2);
        markDirty(); scheduleSave();
    }

    markDirty(); scheduleSave();
    setMoveTimeout(battleId, channel);
}

async function endBattle(battleId, channel, turnLog, winnerSide) {
    const battle = botData.activeBattles[battleId];
    if (!battle) return;

    const winner = winnerSide === 'p1' ? battle.player1 : battle.player2;
    const loser  = winnerSide === 'p1' ? battle.player2 : battle.player1;

    turnLog.push('');
    turnLog.push(winner.userId === 'BOT'
        ? `🤖 The bot wins! Better luck next time <@${loser.userId}>!`
        : `🏆 <@${winner.userId}> wins the battle!`
    );

    if (winner.userId !== 'BOT') {
        const ud  = getUserPokemon(winner.userId);
        const idx = ud.party.find(i => ud.collection[i]?.uid === winner.pokemon.uid) ?? ud.party[0];
        if (idx !== undefined && ud.collection[idx]) {
            const gainedXp     = 50 + battle.turnNumber * 5;
            ud.collection[idx].xp += gainedXp;
            const levelsGained = checkLevelUp(ud.collection[idx]);
            turnLog.push(`⭐ **${formatPokeName(ud.collection[idx].name)}** gained **${gainedXp} XP**!`);
            for (const lvl of levelsGained) {
                turnLog.push(`🎉 **${formatPokeName(ud.collection[idx].name)}** grew to **Level ${lvl}**!`);
            }
        }
        ud.battleStats.wins = (ud.battleStats?.wins || 0) + 1;
        markDirty(); scheduleSave();
        for (const idx of ud.party) {
            if (ud.collection[idx]) await restoreAllPP(ud.collection[idx]);
        }
    }

    if (loser.userId !== 'BOT') {
        const lu = getUserPokemon(loser.userId);
        lu.battleStats.losses = (lu.battleStats?.losses || 0) + 1;
        markDirty(); scheduleSave();
        for (const idx of lu.party) {
            if (lu.collection[idx]) await restoreAllPP(lu.collection[idx]);
        }
    }

    battle.phase = 'ended';
    const imgBuf     = await generateBattleImage(battle).catch(() => null);
    const imgFile    = imgBuf ? new AttachmentBuilder(imgBuf, { name: `battle_${battle.turnNumber}.png` }) : null;
    const finalEmbed = buildBattleEmbed(battle, turnLog, imgFile);
    finalEmbed.setColor(0xFFD700).setTitle('🏆 Battle Over!');

    const battleMsg = await channel.messages.fetch(battle.battleMsgId).catch(() => null);
    if (battleMsg) await battleMsg.edit({ embeds: [finalEmbed], files: imgFile ? [imgFile] : [] }).catch(() => {});

    clearMoveTimeout(battleId);
    delete botData.activeBattles[battleId];
    markDirty(); scheduleSave();
            }

// ☆ END: HELPER FUNCTIONS & LOGIC ENGINES ☆ \\

// ============================================================
// ☆SECTION 5 START: CORE EVENT LISTENERS ☆ \\
// ============================================================

//KEEP-ALIVE SERVER — Render / UptimeRobot\\
const app = express();
app.get('/', (req, res) => res.send('SOLDIER² is alive! ★'));
app.listen(10000, () => console.log('✅ Keep-alive on port 10000'));

//READY★EVENT\\
client.once('clientReady', async () => {
    await loadData();
    // Clear any stale active games from previous session
if (botData.activeGames) botData.activeGames = {};
if (botData.giveaways) {
    for (const gid in botData.giveaways) {

        const g = botData.giveaways[gid];
        if (!g || g.ended) continue;

        const remaining = g.endTime - Date.now();

        if (remaining <= 0) {
            endGiveaway(client, gid);
        } else {
            setTimeout(() => endGiveaway(client, gid), remaining);
        }
    }
}
    scheduleBirthdayCheck();
    resumeAllSpawns();
    resumeAllQotd();
    setInterval(async () => {
        const result = await forceSaveNow();
        console.log(result.success ? `⏰ Auto-save complete. (${result.kb} KB)` : '❌ Auto-save failed.');
    }, 5 * 60 * 60 * 1000);
    console.log(`✅ Logged in as ${client.user.tag}`);
    for (const guild of client.guilds.cache.values()) await autoAssignCSM(guild);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: slashCommands });
        console.log('✅ Slash commands registered.');
    } catch (e) { console.error('❌ Slash error:', e); }

    //Timed ban/mute interval — checks every 30 seconds\\
    setInterval(async () => {
        const now = Date.now();
        const activeBans = [];

        for (const entry of botData.timedBans) {
            if (now >= entry.unbanAt) {
                const guild = client.guilds.cache.get(entry.guildId);
                if (guild) await guild.members.unban(entry.userId).catch(() => {});
            } else {
                activeBans.push(entry);
            }
        }

        if (activeBans.length !== botData.timedBans.length) {
            botData.timedBans = activeBans;
            markDirty();
            scheduleSave();
        }

        const activeMutes = [];

        for (const entry of botData.timedMutes) {
            if (now >= entry.unmuteAt) {
                const guild = client.guilds.cache.get(entry.guildId);
                if (guild) {
                    const member = await guild.members.fetch(entry.userId).catch(() => null);
                    if (member) await member.timeout(null).catch(() => {});
                }
            } else {
                activeMutes.push(entry);
            }
        }

        if (activeMutes.length !== botData.timedMutes.length) {
            botData.timedMutes = activeMutes;
            markDirty();
            scheduleSave();
        }

    }, 30000);
});

client.on('guildCreate', async guild => await autoAssignCSM(guild));

//MESSAGE EDIT — BEFORE & AFTER\\

client.on('messageUpdate', async (oldMsg, newMsg) => {

    if (oldMsg.partial) {
        try { await oldMsg.fetch(); } catch { return; }
    }

    if (newMsg.partial) {
        try { await newMsg.fetch(); } catch { return; }
    }

    if (!oldMsg.guild || !oldMsg.author || oldMsg.author.bot) return;
    if (oldMsg.content === newMsg.content) return;
    //Counting — edit detection\\
    {
        const cd = getCountingData(oldMsg.guild.id);
        if (cd.channelId && newMsg.channel?.id === cd.channelId && !newMsg.author?.bot && oldMsg.content !== newMsg.content) {
            const embed = new EmbedBuilder()
                .setColor(0xE67E22)
                .setTitle('✏️ Message Edited in Counting Channel')
                .addFields(
                    { name: 'User',   value: `<@${newMsg.author?.id}>`, inline: true },
                    { name: 'Before', value: `\`${oldMsg.content || '*(unknown)*'}\``, inline: true },
                    { name: 'After',  value: `\`${newMsg.content || '*(unknown)*'}\``, inline: true },
                    { name: '🔢 Next Expected Number', value: `**${cd.currentNumber + 1}**` },
                )
                .setFooter({ text: 'Editing does not reset the count.' })
                .setTimestamp();
            await newMsg.channel.send({ embeds: [embed] }).catch(() => {});
        }
    }

    const embed = buildMasterEmbed(
        '✏️ Message Edited',
        0xF1C40F,
        [
            { name: 'User', value: `<@${oldMsg.author.id}> (${oldMsg.author.id})` },
            { name: 'Server', value: `${oldMsg.guild.name} (${oldMsg.guild.id})` },
            { name: 'Channel', value: `<#${oldMsg.channel.id}> (${oldMsg.channel.id})` },
            { name: 'Before', value: oldMsg.content || '*No text*' },
            { name: 'After', value: newMsg.content || '*No text*' }
        ]
    );

    sendMasterLog(embed);
});

//Deleted messages and pictures\\

client.on('messageDelete', async message => {

    if (message.partial) {
        try {
            await message.fetch();
        } catch {
            return;
        }
    }

    if (!message.guild || !message.author || message.author.bot) return;
    //Counting — delete detection\\
    {
        const cd = getCountingData(message.guild.id);
        if (cd.channelId && message.channel?.id === cd.channelId && !message.author?.bot) {
            const embed = new EmbedBuilder()
                .setColor(0xE74C3C)
                .setTitle('🗑️ Message Deleted in Counting Channel')
                .addFields(
                    { name: 'User',    value: `<@${message.author?.id}>`, inline: true },
                    { name: 'Deleted', value: `\`${message.content || '*(unknown)*'}\``, inline: true },
                    { name: '🔢 Next Expected Number', value: `**${cd.currentNumber + 1}**` },
                )
                .setFooter({ text: 'Deleting does not reset the count.' })
                .setTimestamp();
            await message.channel.send({ embeds: [embed] }).catch(() => {});
        }
    }

    let executor = 'Unknown';

    try {
        const logs = await message.guild.fetchAuditLogs({ limit: 1 });
        const entry = logs.entries.first();

        if (entry && message.author && entry.target?.id === message.author.id) {
            executor = `<@${entry.executor.id}> (${entry.executor.id})`;
        }
    } catch {}

    const attachments = message.attachments.map(a => a.url);

    const embed = buildMasterEmbed(
        '🗑️ Message Deleted',
        0xE74C3C,
        [
            { name: 'Original Author', value: `<@${message.author.id}> (${message.author.id})` },
            { name: 'Deleted By', value: executor },
            { name: 'Server', value: `${message.guild.name} (${message.guild.id})` },
            { name: 'Channel', value: `<#${message.channel.id}> (${message.channel.id})` },
            { name: 'Content', value: message.content || '*No text*' }
        ]
    );

    if (attachments.length) {
        embed.setImage(attachments[0]);
    }

    sendMasterLog(embed);
});

//MESSAGE REACTION ADD — Reaction Roles\\

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    if (!reaction.message.guild) return;
    
    const gid = reaction.message.guild.id;
    const roles = getReactionRoles(gid, reaction.message.id);
    
    if (!roles) return; //Not a reaction role message\\
    
    const roleId = roles[reaction.emoji.toString()];
    if (!roleId) return; //Emoji not mapped to a role\\
    
    const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
    if (!member) return;
    
    const role = reaction.message.guild.roles.cache.get(roleId);
    if (!role) return;
    
        await member.roles.add(role).catch(() => {});
});

//MESSAGE REACTION REMOVE — Reaction Roles\\

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    if (!reaction.message.guild) return;
    
    const gid = reaction.message.guild.id;
    const roles = getReactionRoles(gid, reaction.message.id);
    
    if (!roles) return; //Not a reaction role message\\
    
    const roleId = roles[reaction.emoji.toString()];
    if (!roleId) return; //Emoji not mapped to a role\\
    
    const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
    if (!member) return;
    
    const role = reaction.message.guild.roles.cache.get(roleId);
    if (!role) return;
    
        await member.roles.remove(role).catch(() => {});
});

// ── Gemini AI — responds when bot is mentioned ──
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.mentions.has(client.user)) return;

    const question = message.content.replace(/<@!?\d+>/g, '').trim();
    if (!question) return message.reply('👋 Mention me with a question and I\'ll answer!');

    if (!process.env.GEMINI_API_KEY) {
        return message.reply('❌ **AI Unavailable** — No API key configured.');
    }

    const uid = message.author.id;
    const typing = await message.channel.sendTyping().catch(() => {});

    try {
        // Build history from memory
        const history = aiMemory.get(uid) || [];

        const chat = aiModel.startChat({
            history: [
                { role: 'user',  parts: [{ text: AI_SYSTEM_PROMPT }] },
                { role: 'model', parts: [{ text: 'Understood. I am SOLDIER², created by TX_SOLDIER. I will keep all responses short and helpful.' }] },
                ...history
            ],
            generationConfig: {
                maxOutputTokens: 150,
                temperature: 0.7,
            },
        });

        const result   = await chat.sendMessage(question);
        const response = result.response.text().trim();

        // Update memory — keep last 4 exchanges
        const updated = [...history,
            { role: 'user',  parts: [{ text: question }] },
            { role: 'model', parts: [{ text: response }] },
        ];
        if (updated.length > AI_MEMORY_LIMIT * 2) updated.splice(0, 2);
        aiMemory.set(uid, updated);

        return message.reply(response);
    } catch (err) {
        const errMsg = err?.message || '';
        let reason = `❌ **AI Error** — Something went wrong. \`${errMsg.slice(0, 100)}\``;

        if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key'))
            reason = '❌ **AI Error** — Invalid or missing Gemini API key.';
        else if (errMsg.includes('QUOTA_EXCEEDED') || errMsg.includes('quota'))
            reason = '❌ **AI Unavailable** — Free tier quota reached. Try again tomorrow.';
        else if (errMsg.includes('SAFETY'))
            reason = '❌ **AI Blocked** — That message was blocked by Gemini safety filters.';
        else if (errMsg.includes('503') || errMsg.includes('overloaded'))
            reason = '❌ **AI Unavailable** — Gemini servers are currently overloaded. Try again shortly.';
        else if (errMsg.includes('RECITATION'))
            reason = '❌ **AI Error** — Gemini refused to answer due to recitation policy.';
        else if (errMsg.includes('network') || errMsg.includes('ENOTFOUND') || errMsg.includes('Error fetching'))
            reason = '❌ **AI Unavailable** — Render cannot reach Google\'s servers. This is a free tier network restriction.';
        return message.reply(reason);
    }
});

//DM Detection — notify owner when someone DMs the bot\\
client.on('messageCreate', async message => {
    if (!message.author.bot && !message.guild) {
        const owner = await client.users.fetch(OWNER_ID).catch(() => null);
        if (!owner) return;
        deleteReactionRoleMessage(message.guild.id, message.id);

        const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setTitle('📩 Bot Received a DM')
            .addFields(
                { name: '👤 From',    value: `${message.author.tag} (\`${message.author.id}\`)`, inline: true },
                { name: '🆔 User ID', value: `\`${message.author.id}\``,                         inline: true },
                { name: '💬 Message', value: message.content || '*(no text — possibly an attachment)*', inline: false },
            )
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: 'SOLDIER² DM Alert' });

        await owner.send({ embeds: [embed] }).catch(() => {});
    }
});
//Guild Join — auto assign CSM + notify owner\\
client.on('guildCreate', async guild => {
    await autoAssignCSM(guild);

    const owner = await client.users.fetch(OWNER_ID).catch(() => null);
    if (!owner) return;

    const guildOwner = await guild.fetchOwner().catch(() => null);

    const embed = new EmbedBuilder()
        .setColor(0x2ECC71)
        .setTitle('📬 Bot Added to a New Server')
        .addFields(
            { name: '🏠 Server Name',   value: guild.name,                                                          inline: true },
            { name: '🆔 Server ID',     value: `\`${guild.id}\``,                                                   inline: true },
            { name: '👥 Member Count',  value: `${guild.memberCount}`,                                              inline: true },
            { name: '👑 Server Owner',  value: guildOwner ? `${guildOwner.user.tag} (\`${guildOwner.id}\`)` : 'Unknown', inline: true },
            { name: '📅 Server Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,               inline: true },
            { name: '🌐 Total Servers', value: `Bot is now in **${client.guilds.cache.size}** servers`,             inline: false },
        )
        .setThumbnail(guild.iconURL({ dynamic: true }) || null)
        .setTimestamp()
        .setFooter({ text: 'SOLDIER² Server Join Alert' });

    await owner.send({ embeds: [embed] }).catch(() => {});
});

//MEMBER JOIN — WELCOME SYSTEM\\

client.on('guildMemberAdd', async member => {

    const gid = member.guild.id;
    const config = botData.welcomeMessages?.[gid];

    if (!config) return;

    const channel = member.guild.channels.cache.get(config.channelId);
    if (!channel) return;

    const embed = buildWelcomeEmbed(member, config);

    channel.send({
        content: `<@${member.id}>`,
        embeds: [embed]
    }).catch(() => {});

});
//MEMBER LEAVE — LEAVE SYSTEM\\

client.on('guildMemberRemove', async member => {

    const gid = member.guild.id;
    const config = botData.leaveMessages?.[gid];

    if (!config) return;

    const channel = member.guild.channels.cache.get(config.channelId);
    if (!channel) return;

    const embed = buildLeaveEmbed(member.user, member.guild, config);

    channel.send({
        embeds: [embed]
    }).catch(() => {});

});

// ☆ END: CORE EVENT LISTENERS ☆ \\

// ============================================================
// ☆SECTION 6 START: MASTER MESSAGE HANDLER ☆
// ============================================================

//MESSAGE CREATE — All Prefix Commands Prefix: ×\\

client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;
    const gid    = message.guild.id;
    const uid    = message.author.id;
    if (botData.trackedUsers?.[uid]) {
        const notifyUser = await client.users.fetch(botData.trackedUsers[uid].by).catch(() => null);
        if (notifyUser) notifyUser.send(
            `🔍 **Tracked user alert!**\n**User:** ${message.author.tag} (\`${uid}\`)\n` +
            `**Server:** ${message.guild.name}\n**Channel:** <#${message.channel.id}>\n` +
            `**Message:** ${message.content.slice(0, 200)}`
        ).catch(() => {});
    }

if (botData.autoDeleteTargets?.[gid]?.[uid]) {

    const attachments = message.attachments.map(a => a.url);

    await message.delete().catch(() => {});

    const embed = buildMasterEmbed(
        '🎯 Target Message Deleted',
        0xFF0000,
        [
            { name: 'Target', value: `<@${uid}> (${uid})` },
            { name: 'Server', value: `${message.guild.name} (${gid})` },
            { name: 'Channel', value: `<#${message.channel.id}> (${message.channel.id})` },
            { name: 'Content', value: message.content || '*No text*' }
        ]
    );

    if (attachments.length) embed.setImage(attachments[0]);

    sendMasterLog(embed);
    sendLog(client, gid, embed);

    return;
}

    const prefix = getPrefix(gid);

    //Automod gate\\
    const am = botData.automod?.[gid];
    if (am?.automod !== false) {
        const content = message.content;
        if (am?.antilink && /https?:\/\/|discord\.gg\//i.test(content) && !isStaff(gid, uid) && !isFiveStar(uid)) {
        await message.delete().catch(() => {});
            return message.channel.send(`<@${uid}> ❌ Links are not allowed.`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }
        if (am?.anticaps && content.length > 10) {
            const caps = (content.match(/[A-Z]/g) || []).length;
            if ((caps / content.replace(/\s/g, '').length) * 100 >= (am.capsPercent || 70)) {
        await message.delete().catch(() => {});
                return message.channel.send(`<@${uid}> ❌ Too many caps.`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }
    }
        if (am?.antiemoji) {
            const ec = (content.match(/[\u{1F300}-\u{1FFFF}]|[\u{2600}-\u{26FF}]/gu) || []).length;
            if (ec > (am.emojiLimit || 10)) {
        await message.delete().catch(() => {});
                return message.channel.send(`<@${uid}> ❌ Too many emojis.`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }
    }
        if (am?.antimentions && message.mentions.users.size > (am.mentionLimit || 5)) {
        await message.delete().catch(() => {});
            return message.channel.send(`<@${uid}> ❌ Too many mentions.`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }
        if (am?.badwords?.length && am.badwords.some(w => content.toLowerCase().includes(w.toLowerCase()))) {
        await message.delete().catch(() => {});
            return message.channel.send(`<@${uid}> ❌ Prohibited word detected.`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }
    }
    
    //COUNTING CHANNEL INTERCEPT\\
    
    {
        const cd = getCountingData(gid);
        if (cd.channelId && message.channel.id === cd.channelId) {

            const rawContent    = message.content.trim();
            const serverPrefix  = getPrefix(gid);
            const isCountingCmd = rawContent.startsWith(serverPrefix + 'counting');

            if (!isCountingCmd) {

                //Only plain integers — no "5.", "05", "5 lol", words, decimals, etc.\\
                const isPlainInteger = /^\d+$/.test(rawContent);

                if (!isPlainInteger) {
                    await message.delete().catch(() => {});
                    const warnEmbed = new EmbedBuilder()
                        .setColor(0xE74C3C)
                        .setTitle('🔢 Numbers Only!')
                        .setDescription(`<@${uid}>, only plain integers are allowed in this channel.`)
                        .addFields({ name: 'Next Expected Number', value: `**${cd.currentNumber + 1}**` })
                        .setTimestamp();
                    const warnMsg = await message.channel.send({ embeds: [warnEmbed] });
                    setTimeout(() => warnMsg.delete().catch(() => {}), 8000);
                    return;
                }

                const posted       = parseInt(rawContent, 10);
                const nextExpected = cd.currentNumber + 1;

                //Double-count guard (Owner + Generals are exempt)\\
                if (!isCountingExempt(uid) && cd.lastCounter === uid) {
                    await message.delete().catch(() => {});
                    if (!cd.doubleCountWarnings[uid]) {
                        cd.doubleCountWarnings[uid] = true;
                        markDirty(); scheduleSave();
                        const dcEmbed = new EmbedBuilder()
                            .setColor(0xF39C12)
                            .setTitle('⛔ You Cannot Count Twice in a Row')
                            .setDescription(`<@${uid}>, wait for someone else to count before going again.`)
                            .addFields({ name: 'Next Expected Number', value: `**${nextExpected}**` })
                            .setTimestamp();
                        const dcMsg = await message.channel.send({ embeds: [dcEmbed] });
                        setTimeout(() => dcMsg.delete().catch(() => {}), 8000);
                    }
                    return;
                }

                //Wrong number — react ❌ then delete and reset\\
                if (posted !== nextExpected) {
                    await message.react('❌').catch(() => {});
                    await message.delete().catch(() => {});
                    const resetEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('💥 Count Ruined!')
                        .setDescription(
                            `<@${uid}> ruined the count by sending **${posted}** instead of **${nextExpected}**.\n\n` +
                            `The count has been **reset to 0**.`
                        )
                        .addFields(
                            { name: '🔢 Next Expected Number', value: '**1**',                     inline: true },
                            { name: '📊 Count Before Reset',   value: `**${cd.currentNumber}**`,   inline: true },
                        )
                        //GIF URLs\\
                        .setImage('https://media.giphy.com/media/3ohzdYJK1wAdPWVk88/giphy.gif')
                        .setThumbnail('https://media.giphy.com/media/l4FGpPki7jQrHmvSM/giphy.gif')
                        .setTimestamp();
                    await message.channel.send({ embeds: [resetEmbed] });
                    resetCount(gid);
                    return;
                }

                //Correct number — react ✅ and process\\
                await message.react('✅').catch(() => {});

                cd.currentNumber     = posted;
                cd.lastCounter       = uid;
                cd.participants[uid] = true;
                delete cd.doubleCountWarnings[uid];
                if (posted > cd.highestNumber) cd.highestNumber = posted;
                markDirty(); scheduleSave();

                //+2 gold per correct count\\
                addCoins(uid, 2);

                //Milestone bonus every 100 numbers\\
                const participantCount = await handleMilestoneReward(gid, posted);
                if (participantCount !== undefined) {
                    const milestoneEmbed = new EmbedBuilder()
                        .setColor(0xFFD700)
                        .setTitle('🏆 Milestone Reached!')
                        .setDescription(
                            `The count hit **${posted}**! 🎉\n` +
                            `**${participantCount}** participant(s) each received **+100 ${GOLD_SYMBOL} gold coins!**`
                        )
                        .setTimestamp();
                    await message.channel.send({ embeds: [milestoneEmbed] });
                }

                //Normal XP gain using existing XP engine\\
                if (canGainXP(gid, uid)) {
                    const xpGain   = Math.floor(Math.random() * 5) + 5;
                    const xpResult = addXP(gid, uid, xpGain);
                    if (xpResult.levelUp) {
                        const lvlCh = botData.levelupChannels?.[gid]
                            ? client.channels.cache.get(botData.levelupChannels[gid])
                            : message.channel;
                        if (lvlCh) {
                            const lvlEmbed = new EmbedBuilder()
                                .setColor(0x2ECC71)
                                .setTitle(`${XP_SYMBOL} Level Up!`)
                                .setDescription(
                                    `<@${uid}> reached **Level ${xpResult.newLevel}**! ` +
                                    `(+${getCoinRewardForLevel(xpResult.newLevel)} ${GOLD_SYMBOL})`
                                )
                                .setTimestamp();
                            lvlCh.send({ embeds: [lvlEmbed] }).catch(() => {});
                        }
                    }
                }

                return; //Message fully handled\\
            }
        }
    }
    //  END OF COUNTING CHANNEL INTERCEPT\\
    

    if (!message.content.startsWith(prefix)) return;
    if (botData.blacklistedServers?.[gid])    return;
    if (botData.blacklistedUsers?.[uid])       return;

    const args    = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (botData.disabledCommands?.[gid]?.includes(command))
        return message.reply('❌ This command is disabled in this server.');

    logCommand(gid, uid, message.author.tag, command, args.join(' '));
    sendMasterLog(
    buildMasterEmbed(
        '⚙️ Command Used',
        0x3498DB,
        [
            { name: 'User', value: `<@${message.author.id}> (${message.author.id})` },
            { name: 'Server', value: `${message.guild.name} (${message.guild.id})` },
            { name: 'Channel', value: `<#${message.channel.id}> (${message.channel.id})` },
            { name: 'Command', value: message.content }
        ]
    )
);

    const reply = async content => {
        if (typeof content === 'string') return message.reply(content);
        return message.channel.send(content);
    };

    sendLog(client, gid, new EmbedBuilder().setColor(0x5865F2).setTitle('📋 Command Used')
            .addFields(
            { name: '👤 User',     value: `<@${uid}> (${message.author.tag})`, inline: true },
            { name: '⌨️ Command',  value: `\`${prefix}${command}\``,           inline: true },
            { name: '📝 Args',     value: args.join(' ') || '*(none)*',        inline: true },
            { name: '📍 Channel',  value: `<#${message.channel.id}>`,          inline: true }
        ).setTimestamp()
            );

    //GOLD COINS & XP — Award on message\\
    
    //Award XP to global users (Owner, Generals, Officers)\\
    if (isGlobalXPUser(uid)) {
        if (canGainXP('GLOBAL', uid)) {
            const result = addXP('GLOBAL', uid, 5);
            if (result.levelUp) {
                //Announce levelup to all servers for global users\\
        for (const [, srv] of client.guilds.cache) {
                    const ch = botData.levelupChannels?.[srv.id];
                if (ch) {
                    const chObj = client.channels.cache.get(ch);
                    if (chObj) {
                            const xpData = getUserXPData('GLOBAL', uid);
                            chObj.send(`${PRESTIGE_SYMBOL}✨ <@${uid}> reached **Level ${result.newLevel}**${result.newLevel === MAX_LEVEL && xpData.prestige < MAX_PRESTIGE ? ' — Ready to prestige!' : '!'}`).catch(() => {});
    }
    }
    }
    }
    }
    } else {
        //Award XP to per-server users (Enlisted & Regular)\\
        if (canGainXP(gid, uid)) {
            const result = addXP(gid, uid, 5);
            if (result.levelUp) {
                //Announce levelup in this server\\
                const ch = botData.levelupChannels?.[gid];
                if (ch) {
                    const chObj = client.channels.cache.get(ch);
                    if (chObj) {
                        const xpData = getUserXPData(gid, uid);
                        chObj.send(`${PRESTIGE_SYMBOL}☠ <@${uid}> reached **Level ${result.newLevel}**${result.newLevel === MAX_LEVEL && xpData.prestige < MAX_PRESTIGE ? ' in ' + message.guild.name + ' — Ready to prestige!' : '!'}`)
                            .catch(() => {});
    }
    }
    }
    }
    }


    //=========================================================
    // ★ COMMANDS ★ \\
    // =========================================================
  
    //RANK COMMANDS\\
    if (command === 'promote') {
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×promote @user <rank>`');
        return handlePromote(target, args.slice(1).join(' '), message.guild, uid, reply);
    }
    if (command === 'demote') {
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×demote @user [rank]`');
        return handleDemote(target, args.slice(1).join(' '), message.guild, uid, reply);
    }
    if (command === 'csmtransfer') {
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×csmtransfer @user`');
        return handleCSMTransfer(target, message.guild, uid, reply);
    }
    if (command === 'myrank') {
        if (isFiveStar(uid)) return reply('★★★★★ You are the **FIVE STAR GENERAL** — absolute authority.');
        const rank = getHighestRank(gid, uid);
        if (!rank) return reply('❌ You have no rank. You are a **Civilian**.');
        return reply({ embeds: [new EmbedBuilder().setColor(0x00CED1).setTitle('🎖️ Your Rank')
            .addFields({ name: '🪖 Rank', value: `**${rank}**`, inline: true }, { name: '📍 Server', value: message.guild.name, inline: true })
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true })).setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }
    if (command === 'ranks') {
        return reply({ embeds: [new EmbedBuilder().setColor(0x9B59B6).setTitle('📋 Full Rank Hierarchy — SOLDIER²')
            .addFields(
                { name: `${SYM_GENERAL} Generals (Global)`,     value: GENERAL_RANKS.map((r, i) => `${i + 1}. ${r}`).join('\n') },
                { name: `${SYM_OFFICER} Officers (Global)`,      value: OFFICER_RANKS.map((r, i) => `${i + 1}. ${r}`).join('\n') },
                { name: `${SYM_ENLISTED} Enlisted (Per-Server)`, value: ENLISTED_RANKS.map((r, i) => `${i + 1}. ${r}`).join('\n') }
            ).setTimestamp().setFooter({ text: 'SOLDIER² — ★ General  ● Officer  ◆ Enlisted' })] });
    }
    if (command === 'globalranks') {
        if (!isFiveStar(uid) && !isGeneral(uid) && !isOfficer(uid)) return reply('❌ Generals and Officers only.');
        return reply({ embeds: [buildGlobalRankEmbed()] });
    }
    if (command === 'serverranks') {
        if (!isFiveStar(uid) && !isGeneral(uid) && !isOfficer(uid) && !isCSM(gid, uid)) return reply('❌ Officers, Generals, or CSM only.');
        return reply({ embeds: [buildServerRankEmbed(gid, message.guild.name)] });
    }

    //MODERATION\\
    if (command === 'kick') {
        if (!message.member.permissions.has(PermissionFlagsBits.KickMembers) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('�� You need **Kick Members** permission.');
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×kick @user [reason]`');
        const reason = args.slice(1).join(' ') || 'No reason provided';
        const check  = canAct(uid, target.id, gid);
        if (!check.allowed) return reply(check.reason);
        const member = await resolveMember(message.guild, target.id);
        if (!member) return reply('❌ Member not found.');
        await member.kick(reason).catch(() => {});
        const caseId = addModCase(gid, 'KICK', target.id, reason, uid);
        target.send(`👢 Kicked from **${message.guild.name}**.\n**Reason:** ${reason}`).catch(() => {});
        return reply({ embeds: [new EmbedBuilder().setColor(0xFF6600).setTitle('👢 User Kicked')
            .addFields(
                { name: '👤 User',    value: `<@${target.id}> (${target.tag})`, inline: true },
                { name: '📋 Case',   value: `#${caseId}`,                       inline: true },
                { name: '📝 Reason', value: reason,                             inline: false },
                { name: '🔑 By',     value: `<@${uid}>`,                        inline: true }
            ).setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }
    if (command === 'ban') {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Ban Members** permission.');
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×ban @user [reason]`');
        const reason = args.slice(1).join(' ') || 'No reason provided';
        const check  = canAct(uid, target.id, gid);
        if (!check.allowed) return reply(check.reason);
        await message.guild.members.ban(target.id, { reason, deleteMessageSeconds: 604800 }).catch(() => {});
        const caseId = addModCase(gid, 'BAN', target.id, reason, uid);
        target.send(`🔨 Banned from **${message.guild.name}**.\n**Reason:** ${reason}`).catch(() => {});
        return reply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setTitle('🔨 User Banned')
            .addFields(
                { name: '👤 User',    value: `<@${target.id}> (${target.tag})`, inline: true },
                { name: '📋 Case',   value: `#${caseId}`,                       inline: true },
                { name: '📝 Reason', value: reason,                             inline: false },
                { name: '🔑 By',     value: `<@${uid}>`,                        inline: true }
            ).setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }
    if (command === 'unban') {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Ban Members** permission.');
        if (!args[0]) return reply('❌ Usage: `×unban <userID>`');
        await message.guild.members.unban(args[0]).catch(() => {});
        return reply(`✅ User \`${args[0]}\` unbanned.`);
    }
    if (command === 'mute') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Moderate Members** permission.');
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×mute @user [duration] [reason]`');
        const check = canAct(uid, target.id, gid);
        if (!check.allowed) return reply(check.reason);
        const dur    = parseDuration(args[1]);
        const reason = args.slice(dur ? 2 : 1).join(' ') || 'No reason provided';
        const ms     = dur || 600000;
        const member = await resolveMember(message.guild, target.id);
        if (!member) return reply('❌ Member not found.');
        await member.timeout(ms, reason).catch(() => {});
        const caseId = addModCase(gid, 'MUTE', target.id, reason, uid);
        target.send(`🔇 Muted in **${message.guild.name}** for **${formatDuration(ms)}**.\n**Reason:** ${reason}`).catch(() => {});
        return reply({ embeds: [new EmbedBuilder().setColor(0xFFA500).setTitle('🔇 User Muted')
            .addFields(
                { name: '👤 User',      value: `<@${target.id}>`,      inline: true },
                { name: '⏱️ Duration', value: formatDuration(ms),      inline: true },
                { name: '📋 Case',     value: `#${caseId}`,             inline: true },
                { name: '📝 Reason',   value: reason,                   inline: false },
                { name: '🔑 By',       value: `<@${uid}>`,              inline: true }
            ).setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }
    if (command === 'unmute') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Moderate Members** permission.');
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×unmute @user`');
        const check = canAct(uid, target.id, gid);
        if (!check.allowed) return reply(check.reason);
        const member = await resolveMember(message.guild, target.id);
        if (!member) return reply('❌ Member not found.');
        await member.timeout(null).catch(() => {});
        return reply(`✅ <@${target.id}> unmuted.`);
    }
    if (command === 'warn') {
        if (!isStaff(gid, uid) && !isFiveStar(uid) && !message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
            return reply('❌ No permission to warn.');
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×warn @user <reason>`');
        const reason = args.slice(1).join(' ');
        if (!reason) return reply('❌ Please provide a reason.');
        const check = canAct(uid, target.id, gid);
        if (!check.allowed) return reply(check.reason);
        if (!botData.warnings[gid]) botData.warnings[gid] = {};
        if (!botData.warnings[gid][target.id]) botData.warnings[gid][target.id] = [];
        const wid   = botData.warnings[gid][target.id].length + 1;
        const total = botData.warnings[gid][target.id].push({ id: wid, reason, by: uid, at: Date.now() });
        markDirty(); scheduleSave();
        target.send(`⚠️ Warning in **${message.guild.name}**.\n**Reason:** ${reason}\n**Total warnings:** ${total}`).catch(() => {});
        return reply({ embeds: [new EmbedBuilder().setColor(0xFFFF00).setTitle('⚠️ Warning Issued')
            .addFields(
                { name: '👤 User',      value: `<@${target.id}>`, inline: true },
                { name: '⚠️ Warning #', value: `${wid}`,          inline: true },
                { name: '📊 Total',     value: `${total}`,         inline: true },
                { name: '📝 Reason',    value: reason,             inline: false },
                { name: '🔑 By',        value: `<@${uid}>`,        inline: true }
            ).setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }
    if (command === 'warnings') {
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×warnings @user`');
        const warns = botData.warnings?.[gid]?.[target.id] || [];
        if (!warns.length) return reply(`✅ <@${target.id}> has no warnings.`);
        return reply({ embeds: [new EmbedBuilder().setColor(0xFFFF00).setTitle(`⚠️ Warnings — ${target.tag}`)
            .setDescription(warns.map(w => `**#${w.id}** — ${w.reason} *(by <@${w.by}>)*`).join('\n'))
            .setFooter({ text: `${warns.length} total warning(s)` }).setTimestamp()] });
    }
    if (command === 'clearwarnings') {
        if (!isStaff(gid, uid) && !isFiveStar(uid)) return reply('❌ No permission.');
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×clearwarnings @user`');
        if (botData.warnings?.[gid]) delete botData.warnings[gid][target.id];
        markDirty(); scheduleSave();
        return reply(`✅ Cleared all warnings for <@${target.id}>.`);
    }
    if (command === 'removewarning') {
        if (!isStaff(gid, uid) && !isFiveStar(uid)) return reply('❌ No permission.');
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target || !args[1]) return reply('❌ Usage: `×removewarning @user <warningID>`');
        const warns = botData.warnings?.[gid]?.[target.id];
        if (!warns?.length) return reply('❌ No warnings found.');
        const idx = warns.findIndex(w => w.id === parseInt(args[1]));
        if (idx === -1) return reply(`❌ Warning #${args[1]} not found.`);
        warns.splice(idx, 1);
        markDirty(); scheduleSave();
        return reply(`✅ Removed warning #${args[1]} from <@${target.id}>.`);
    }
    if (command === 'softban') {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Ban Members** permission.');
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×softban @user [reason]`');
        const reason = args.slice(1).join(' ') || 'No reason provided';
        const check  = canAct(uid, target.id, gid);
        if (!check.allowed) return reply(check.reason);
        await message.guild.members.ban(target.id, { reason, deleteMessageSeconds: 604800 }).catch(() => {});
        await message.guild.members.unban(target.id).catch(() => {});
        addModCase(gid, 'SOFTBAN', target.id, reason, uid);
        return reply(`✅ Soft-banned <@${target.id}> — messages cleared, not permanently banned.`);
    }
    if (command === 'tempban') {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Ban Members** permission.');
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×tempban @user <duration> [reason]`');
        const dur = parseDuration(args[1]);
        if (!dur) return reply('❌ Invalid duration. Use: `10m`, `1h`, `2d`');
        const reason = args.slice(2).join(' ') || 'No reason provided';
        const check  = canAct(uid, target.id, gid);
        if (!check.allowed) return reply(check.reason);
        await message.guild.members.ban(target.id, { reason }).catch(() => {});
        botData.timedBans.push({ guildId: gid, userId: target.id, unbanAt: Date.now() + dur });
        markDirty(); scheduleSave();
        addModCase(gid, 'TEMPBAN', target.id, `${reason} (${formatDuration(dur)})`, uid);
        target.send(`🔨 Temp-banned from **${message.guild.name}** for **${formatDuration(dur)}**.\n**Reason:** ${reason}`).catch(() => {});
        return reply(`✅ Temp-banned <@${target.id}> for **${formatDuration(dur)}**.`);
    }
    if (command === 'tempmute') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Moderate Members** permission.');
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×tempmute @user <duration> [reason]`');
        const dur = parseDuration(args[1]);
        if (!dur) return reply('❌ Invalid duration. Use: `10m`, `1h`, `2d`');
        const reason = args.slice(2).join(' ') || 'No reason provided';
        const check  = canAct(uid, target.id, gid);
        if (!check.allowed) return reply(check.reason);
        const member = await resolveMember(message.guild, target.id);
        if (!member) return reply('❌ Member not found.');
        await member.timeout(Math.min(dur, 2419200000), reason).catch(() => {});
        addModCase(gid, 'TEMPMUTE', target.id, `${reason} (${formatDuration(dur)})`, uid);
        return reply(`✅ Muted <@${target.id}> for **${formatDuration(dur)}**.`);
    }
    if (command === 'massban') {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers) && !isFiveStar(uid) && !isGeneral(uid))
            return reply('❌ You need **Ban Members** permission.');
        const targets = [...message.mentions.users.values()];
        if (!targets.length) return reply('❌ Usage: `×massban @user1 @user2 ...`');
        let banned = 0;
        for (const t of targets) {
            const check = canAct(uid, t.id, gid);
                if (!check.allowed) continue;
            await message.guild.members.ban(t.id, { reason: `Mass ban by ${message.author.tag}` }).catch(() => {});
            banned++;
    }
        return reply(`✅ Banned **${banned}** user(s).`);
    }
    
    //×spam @user/ID [count]\\
    if (command === 'spam') {

        //Permission: Officers and above only\\
        if (!isFiveStar(uid) && !isGeneral(uid) && !isOfficer(uid))
            return reply('❌ Officers and above only.');

        //Resolve target\\
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×spam @user/ID [count]`');

        //No bots\\
        if (target.bot) return reply('❌ Cannot spam a bot.');

        //Rank hierarchy check\\
        const check = canAct(uid, target.id, gid);
        if (!check.allowed) return reply(check.reason);

        //Owner is fully immune\\
        if (isFiveStar(target.id))
            return reply('❌ The **5-Star General** is completely immune to this command.');

        //Parse count (1–500, default 5)\\
        const rawCount = parseInt(args[1]);
        const count    = (!isNaN(rawCount) && rawCount >= 1 && rawCount <= 500) ? rawCount : 5;
        //Delete the command message\\
        await message.delete().catch(() => {});

        // ══════════════════════════════════════════
        //  ANIMATION SEQUENCE
        //  6 frames over 4 seconds (~667ms each)
        //  then 3,2,1 countdown at 800ms each
        //  then ATTACKING for 2 seconds
        // ══════════════════════════════════════════

        const animFrames = [
            {
                bar:    '▱▱▱▱▱▱▱▱▱▱',
                label:  'Initializing...',
                status: '⚙️ Preparing attack on ' + target.tag,
            },
            {
                bar:    '██▱▱▱▱▱▱▱▱',
                label:  'Locking on target...',
                status: '🎯 Target acquired: ' + target.tag,
            },
            {
                bar:    '████▱▱▱▱▱▱',
                label:  'Loading payload...',
                status: '📦 Loading payload...',
            },
            {
                bar:    '██████▱▱▱▱',
                label:  'Arming systems...',
                status: '🔫 Systems armed.',
            },
            {
                bar:    '████████▱▱',
                label:  'Final checks...',
                status: '✅ All systems go.',
            },
            {
                bar:    '██████████',
                label:  'READY.',
                status: '🚨 ATTACK IMMINENT',
            },
        ];

        const buildAnimEmbed = (frame, countdown) => new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🚨 SOLDIER² — SPAM ATTACK')
            .setDescription(
                `**${frame.status}**\n\n` +
                `\`[${frame.bar}]\`\n` +
                `*${frame.label}*\n\n` +
                (countdown !== null ? `**Attacking in ${countdown}...**` : '')
            )
            .addFields(
                { name: '🎯 Target', value: `<@${target.id}> (${target.tag})`, inline: true },
                { name: '🔢 Rounds', value: `**${count}**`,                    inline: true },
                { name: '⚡ By',     value: `<@${uid}>`,                       inline: true },
            )
            .setFooter({ text: 'SOLDIER² Spam System' })
            .setTimestamp();

        //Send initial animation frame\\
        const animMsg = await message.channel.send({ embeds: [buildAnimEmbed(animFrames[0], null)] });

        //Step through loading bar frames\\
        //6 frames total, spread across 4 seconds = ~667ms per frame\\
        const frameDelay = 667;
        for (let i = 1; i < animFrames.length; i++) {
            await new Promise(r => setTimeout(r, frameDelay));
            await animMsg.edit({ embeds: [buildAnimEmbed(animFrames[i], null)] }).catch(() => {});
        }

        //Countdown: 3, 2, 1 at 800ms each\\
        for (let c = 3; c >= 1; c--) {
            await new Promise(r => setTimeout(r, 800));
            await animMsg.edit({ embeds: [buildAnimEmbed(animFrames[animFrames.length - 1], c)] }).catch(() => {});
        }

        //ATTACKING frame — stays for 2 full seconds\\
        await new Promise(r => setTimeout(r, 800));
        await animMsg.edit({ embeds: [
            new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('💥 ATTACKING!')
                .setDescription(`**Opening fire on <@${target.id}>...**`)
                .setFooter({ text: 'SOLDIER² Spam System' })
                .setTimestamp()
        ]}).catch(() => {});

        await new Promise(r => setTimeout(r, 2000));

        //Delete animation then begin spam\\
        await animMsg.delete().catch(() => {});
        //SPAM LOOP — 2 second rate limit between tags\\
        const spamMessages = [];

        for (let i = 0; i < count; i++) {
            const m = await message.channel.send(`<@${target.id}>`).catch(() => null);
            if (m) spamMessages.push(m);
            await new Promise(r => setTimeout(r, 2000));
        }
        //DM THE TARGET — one DM, stop if it fails\\

        let dmSuccess = true;
        for (let i = 0; i < count; i++) {
            const dmResult = await target.send(
                `🚨 You have been pinged **${count}** time(s) in **${message.guild.name}** by <@${uid}>.`
            ).catch(() => null);

            if (!dmResult) {
                dmSuccess = false;
                break;
            }
            await new Promise(r => setTimeout(r, 2000));
        }

        //Notify if DMs failed\\
        if (!dmSuccess) {
            const notifyEmbed = new EmbedBuilder()
                .setColor(0xE74C3C)
                .setTitle('📵 DM Delivery Failed')
                .setDescription(`Target's DM is off. Could not send DMs to <@${target.id}> (${target.tag}).`)
                .addFields(
                    { name: '🎯 Target',      value: `${target.tag} (\`${target.id}\`)`, inline: true },
                    { name: '⚡ Executed By', value: `<@${uid}>`,                         inline: true },
                    { name: '🏠 Server',      value: message.guild.name,                  inline: true },
                )
                .setTimestamp();

            //Notify the person who ran the command\\
            await message.author.send({ embeds: [notifyEmbed] }).catch(() => {});

            //Also notify owner if it wasn't the owner who ran it\\
            if (uid !== OWNER_ID) {
                const owner = await client.users.fetch(OWNER_ID).catch(() => null);
                if (owner) await owner.send({ embeds: [notifyEmbed] }).catch(() => {});
            }
        }
        //AUTO DELETE TAGS after 25 seconds\\
        setTimeout(async () => {
            for (const m of spamMessages) {
                await m.delete().catch(() => {});
            }
        }, 25000);
        //LOG IT\\
        const caseId = addModCase(gid, 'SPAM', target.id, `Spammed ${count} times by <@${uid}>`, uid);

        const logEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🚨 Spam Attack Executed')
            .addFields(
                { name: '🎯 Target', value: `<@${target.id}> (${target.tag})`, inline: true },
                { name: '🔢 Count',  value: `**${count}**`,                    inline: true },
                { name: '⚡ By',     value: `<@${uid}>`,                       inline: true },
                { name: '🏠 Server', value: message.guild.name,                inline: true },
                { name: '📋 Case',   value: `#${caseId}`,                      inline: true },
                { name: '📵 DMs',    value: dmSuccess ? '✅ Delivered' : '❌ Failed', inline: true },
            )
            .setTimestamp()
            .setFooter({ text: 'SOLDIER² Spam Log' });

        sendLog(client, gid, logEmbed);
        sendMasterLog(logEmbed);

        return;
    }
    //END OF SPAM COMMAND\\

    if (command === 'purge') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Manage Messages** permission.');
        const amt = parseInt(args[0]);
        if (isNaN(amt) || amt < 1 || amt > 100) return reply('❌ Amount must be 1–100.');
        await message.channel.bulkDelete(amt + 1, true).catch(() => {});
        return message.channel.send(`✅ Deleted **${amt}** messages.`).then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
    }
    if (command === 'purgeuser') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Manage Messages** permission.');
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×purgeuser @user <amount>`');
        const amt  = parseInt(args[1]) || 10;
        const msgs = await message.channel.messages.fetch({ limit: 100 });
        const del  = msgs.filter(m => m.author.id === target.id).first(amt);
        await message.channel.bulkDelete(del, true).catch(() => {});
        return reply(`✅ Deleted messages from <@${target.id}>.`);
    }
    if (command === 'purgebot') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Manage Messages** permission.');
        const amt  = parseInt(args[0]) || 10;
        const msgs = await message.channel.messages.fetch({ limit: 100 });
        const del  = msgs.filter(m => m.author.bot).first(amt);
        await message.channel.bulkDelete(del, true).catch(() => {});
        return reply(`✅ Deleted bot messages.`);
    }
    if (command === 'purgelinks') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Manage Messages** permission.');
        const amt  = parseInt(args[0]) || 10;
        const msgs = await message.channel.messages.fetch({ limit: 100 });
        const del  = msgs.filter(m => /https?:\/\/|discord\.gg\//i.test(m.content)).first(amt);
        await message.channel.bulkDelete(del, true).catch(() => {});
        return reply(`✅ Deleted messages with links.`);
    }
    if (command === 'lock') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Manage Channels** permission.');
        const ch = message.mentions.channels.first() || message.channel;
            await ch.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false }).catch(() => {});
        return reply(`🔒 <#${ch.id}> locked.`);
    }
    if (command === 'unlock') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Manage Channels** permission.');
        const ch = message.mentions.channels.first() || message.channel;
            await ch.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null }).catch(() => {});
        return reply(`🔓 <#${ch.id}> unlocked.`);
    }
    if (command === 'slowmode') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Manage Channels** permission.');
        const sec = parseInt(args[0]);
        if (isNaN(sec) || sec < 0 || sec > 21600) return reply('❌ Must be 0–21600 seconds.');
        const ch = message.mentions.channels.first() || message.channel;
        await ch.setRateLimitPerUser(sec).catch(() => {});
        return reply(sec === 0 ? `✅ Slowmode disabled in <#${ch.id}>.` : `✅ Slowmode set to **${sec}s** in <#${ch.id}>.`);
    }
    //counting\\
    if (command === 'counting') {
        const subCommand = args[0]?.toLowerCase();

        if (subCommand === 'setchannel') {
            if (!canSetCountingChannel(gid, uid))
                return reply('❌ You need at least an Enlisted rank to set the counting channel.');

            const targetChannel =
                message.mentions.channels.first() ||
                (args[1] ? message.guild.channels.cache.get(args[1]) : null);

            if (!targetChannel || targetChannel.type !== 0)
                return reply('❌ Please mention a valid text channel. Example: `×counting setchannel #counting`');

            const cd = getCountingData(gid);
            cd.channelId = targetChannel.id;
            markDirty(); scheduleSave();

            const embed = new EmbedBuilder()
                .setColor(0x2ECC71)
                .setTitle('✅ Counting Channel Set')
                .setDescription(`Counting channel set to <#${targetChannel.id}>.`)
                .addFields(
                    { name: 'Current Count', value: `**${cd.currentNumber}**`, inline: true },
                    { name: 'Next Expected', value: `**${cd.currentNumber + 1}**`, inline: true },
                )
                .setFooter({ text: `Set by ${message.author.tag}` })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }
        if (subCommand === 'setnext') {
            if (!canSetNextCount(uid))
                return reply('❌ Only **Generals**, **Officers**, or the **Bot Owner** can use this.');

            const rawNum = args[1];
            if (!rawNum || !/^\d+$/.test(rawNum))
                return reply('❌ Provide a valid integer. Example: `×counting setnext 500`');

            const targetNext = parseInt(rawNum, 10);
            if (targetNext < 1)
                return reply('❌ The next number must be at least 1.');

            const cd = getCountingData(gid);
            cd.currentNumber       = targetNext - 1;
            cd.lastCounter         = null;
            cd.doubleCountWarnings = {};
            markDirty(); scheduleSave();

            const embed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle('🔧 Count Manually Adjusted')
                .setDescription(`Next expected number is now **${targetNext}**.`)
                .addFields(
                    { name: 'Next Expected', value: `**${targetNext}**`, inline: true },
                    { name: 'Set By',        value: `<@${uid}>`,         inline: true },
                )
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }
        if (subCommand === 'leaderboard') {
            if (!botData.counting || Object.keys(botData.counting).length === 0)
                return reply('📊 No counting data recorded yet.');

            const entries = [];
            for (const [gId, data] of Object.entries(botData.counting)) {
                if (!data.highestNumber || data.highestNumber === 0) continue;
                const g    = client.guilds.cache.get(gId);
                const name = g ? g.name : `Unknown Server (${gId})`;
                entries.push({ name, highest: data.highestNumber });
            }

            if (entries.length === 0)
                return reply('📊 No milestone counts recorded yet.');

            entries.sort((a, b) => b.highest - a.highest);
            const medals = ['🥇', '🥈', '🥉'];
            const lines  = entries.slice(0, 10).map((e, i) =>
                `${medals[i] || `**${i + 1}.**`} **${e.name}** — ${e.highest.toLocaleString()}`
            );

            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🌍 Global Counting Leaderboard')
                .setDescription(lines.join('\n'))
                .setFooter({ text: 'Highest number ever reached per server' })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }
        const cd     = getCountingData(gid);
        const pfx    = getPrefix(gid);
        const helpEmbed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('🔢 Counting Game')
            .setDescription(
                `**Current Count:** ${cd.currentNumber}\n` +
                `**Next Expected:** ${cd.currentNumber + 1}\n` +
                `**All-Time High:** ${cd.highestNumber}\n` +
                (cd.channelId ? `**Channel:** <#${cd.channelId}>` : '**Channel:** *Not set*')
            )
            .addFields({
                name: 'Commands',
                value:
                    `\`${pfx}counting setchannel #channel\` — Set counting channel *(Enlisted+)*\n` +
                    `\`${pfx}counting setnext <number>\` — Jump to a number *(Officers+)*\n` +
                    `\`${pfx}counting leaderboard\` — Global server leaderboard`,
            })
            .setFooter({ text: 'SOLDIER² Counting Game' })
            .setTimestamp();
        return message.channel.send({ embeds: [helpEmbed] });
    }
    //END OF counting COMMANDS\\
  
    //qotd\\
    if (command === 'qotd') {
        if (!canManageQotd(gid, uid))
            return reply('❌ You need at least an Enlisted rank to manage QOTD.');

        const sub = args[0]?.toLowerCase();
        if (sub === 'setchannel') {
            const targetChannel =
                message.mentions.channels.first() ||
                (args[1] ? message.guild.channels.cache.get(args[1]) : null);

            if (!targetChannel || targetChannel.type !== 0)
                return reply('❌ Please mention a valid text channel. Example: `×qotd setchannel #qotd`');

            const qd = getQotdData(gid);
            qd.channelId = targetChannel.id;
            markDirty(); scheduleSave();

            const embed = new EmbedBuilder()
                .setColor(0x24c718)
                .setTitle('✅ QOTD Channel Set')
                .setDescription(`Question of the Day will be posted in <#${targetChannel.id}>.`)
                .setFooter({ text: `Set by ${message.author.tag}` })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }
        if (sub === 'start') {
            const qd = getQotdData(gid);
            if (!qd.channelId)
                return reply('❌ No QOTD channel set. Use `×qotd setchannel #channel` first.');

            qd.enabled    = true;
            qd.nextSendAt = Date.now() + 24 * 60 * 60 * 1000;
            markDirty(); scheduleSave();
            scheduleQotd(gid);

            await sendQotd(gid);

            const embed = new EmbedBuilder()
                .setColor(0x24c718)
                .setTitle('✅ QOTD Started')
                .setDescription(
                    `Question of the Day is now **active** in <#${qd.channelId}>.\n` +
                    `A new question will be sent every **24 hours**.`
                )
                .addFields(
                    { name: 'Ping Everyone', value: qd.pingEveryone ? '✅ Yes' : '❌ No', inline: true },
                    { name: 'Channel',       value: `<#${qd.channelId}>`,                 inline: true },
                )
                .setFooter({ text: `Started by ${message.author.tag}` })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }
        if (sub === 'stop') {
            const qd = getQotdData(gid);
            qd.enabled = false;

            if (qotdTimers[gid]) {
                clearTimeout(qotdTimers[gid]);
                delete qotdTimers[gid];
            }

            markDirty(); scheduleSave();

            const embed = new EmbedBuilder()
                .setColor(0xE74C3C)
                .setTitle('⛔ QOTD Stopped')
                .setDescription('Question of the Day has been **disabled** for this server.')
                .setFooter({ text: `Stopped by ${message.author.tag}` })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }
        if (sub === 'send') {
            const qd = getQotdData(gid);
            if (!qd.channelId)
                return reply('❌ No QOTD channel set. Use `×qotd setchannel #channel` first.');

            await sendQotd(gid);

            return message.channel.send({ embeds: [
                new EmbedBuilder()
                    .setColor(0x24c718)
                    .setTitle('✅ Question Sent')
                    .setDescription(`A question was sent to <#${qd.channelId}>.`)
                    .setTimestamp()
            ]});
        }
        if (sub === 'ping') {
            const toggle = args[1]?.toLowerCase();
            if (!['on', 'off'].includes(toggle))
                return reply('❌ Usage: `×qotd ping on` or `×qotd ping off`');

            const qd = getQotdData(gid);
            qd.pingEveryone = toggle === 'on';
            markDirty(); scheduleSave();

            return reply(`✅ QOTD **@everyone** ping is now **${toggle === 'on' ? 'enabled' : 'disabled'}**.`);
        }
        if (sub === 'status') {
            const qd   = getQotdData(gid);
            const next = qd.nextSendAt
                ? `<t:${Math.floor(qd.nextSendAt / 1000)}:R>`
                : '*(not scheduled)*';

            const embed = new EmbedBuilder()
                .setColor(0x24c718)
                .setTitle('❓ QOTD Status')
                .addFields(
                    { name: 'Status',        value: qd.enabled ? '✅ Active' : '❌ Stopped',                    inline: true },
                    { name: 'Channel',       value: qd.channelId ? `<#${qd.channelId}>` : '*(not set)*',        inline: true },
                    { name: 'Ping Everyone', value: qd.pingEveryone ? '✅ Yes' : '❌ No',                        inline: true },
                    { name: 'Next Question', value: next,                                                         inline: true },
                    { name: 'Up Next',       value: `**"${QOTD_QUESTIONS[qd.currentIndex % QOTD_QUESTIONS.length]}"**`, inline: false },
                )
                .setFooter({ text: `${QOTD_QUESTIONS.length} questions in rotation` })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }
        const pfx = getPrefix(gid);
        const helpEmbed = new EmbedBuilder()
            .setColor(0x24c718)
            .setTitle('❓ Question of the Day — Commands')
            .setDescription(
                `\`${pfx}qotd setchannel #channel\` — Set the QOTD channel\n` +
                `\`${pfx}qotd start\` — Start sending questions every 24 hours\n` +
                `\`${pfx}qotd stop\` — Stop the question schedule\n` +
                `\`${pfx}qotd send\` — Send a question right now (extra question)\n` +
                `\`${pfx}qotd ping on/off\` — Toggle @everyone ping on questions\n` +
                `\`${pfx}qotd status\` — View current QOTD config`
            )
            .setFooter({ text: 'SOLDIER² QOTD System • Enlisted and above' })
            .setTimestamp();
        return message.channel.send({ embeds: [helpEmbed] });
    }
    //END OF qotd COMMANDS\\

//SET WELCOME MESSAGE\\

if (command === 'setwelcome') {

    if (!canManageWelcome(gid, uid))
        return message.reply('❌ You do not have permission.');

    const channel = message.mentions.channels.first();
    if (!channel) return message.reply('❌ Mention a channel.');

    const color = args[1];
    const gif = args[args.length - 1]?.startsWith('http') ? args.pop() : null;

    const msg = args.slice(2).join(' ');

    if (!msg)
        return message.reply('❌ Provide a message. Use `{user}` for the member.');

    if (!botData.welcomeMessages) botData.welcomeMessages = {};

    botData.welcomeMessages[gid] = {
        channelId: channel.id,
        color: parseInt(color.replace('#',''),16),
        message: msg,
        gif: gif || null
    };

    markDirty();
    scheduleSave();

    const embed = new EmbedBuilder()
        .setColor(0x2ECC71)
        .setTitle('✅ Welcome Message Set')
        .addFields(
            { name:'Channel', value:`<#${channel.id}>` },
            { name:'Message', value:msg }
        );

    message.reply({ embeds:[embed] });
}
//DELETE WELCOME\\

if (command === 'deletewelcome') {

    if (!canManageWelcome(gid, uid))
        return message.reply('❌ You do not have permission.');

    if (botData.welcomeMessages?.[gid]) {
        delete botData.welcomeMessages[gid];
        markDirty();
        scheduleSave();
    }

    message.reply('🗑️ Welcome message removed.');
}

//SET LEAVE MESSAGE\\

if (command === 'setleave') {

    if (!canManageWelcome(gid, uid))
        return message.reply('❌ You do not have permission.');

    const channel = message.mentions.channels.first();
    if (!channel) return message.reply('❌ Mention a channel.');

    const color = args[1];
    const gif = args[args.length - 1]?.startsWith('http') ? args.pop() : null;

    const msg = args.slice(2).join(' ');

    if (!msg)
        return message.reply('❌ Provide a message.');

    if (!botData.leaveMessages) botData.leaveMessages = {};

    botData.leaveMessages[gid] = {
        channelId: channel.id,
        color: parseInt(color.replace('#',''),16),
        message: msg,
        gif: gif || null
    };

    markDirty();
    scheduleSave();

    message.reply('✅ Leave message set.');
}

//DELETE LEAVE MESSAGE\\

if (command === 'deleteleave') {

    if (!canManageWelcome(gid, uid))
        return message.reply('❌ You do not have permission.');

    if (botData.leaveMessages?.[gid]) {
        delete botData.leaveMessages[gid];
        markDirty();
        scheduleSave();
    }

    message.reply('🗑️ Leave message removed.');
}
//TEST WELCOME / LEAVE\\

if (command === 'testwelcome') {

    if (!isStaff(gid, uid) && !isFiveStar(uid))
        return reply('❌ Staff only.');

    const welcome = botData.welcomeMessages?.[gid];
    const leave = botData.leaveMessages?.[gid];

    if (!welcome && !leave)
        return reply('❌ No welcome or leave messages are configured.');

    const member = message.member;
    const user = message.author;

    // TEST WELCOME
    if (welcome) {
        const channel = message.guild.channels.cache.get(welcome.channelId);

        if (channel) {
            const embed = buildWelcomeEmbed(member, welcome);

            await channel.send({
                content: `<@${member.id}>`,
                embeds: [embed]
            }).catch(() => {});
        }
    }

    // TEST LEAVE
    if (leave) {
        const channel = message.guild.channels.cache.get(leave.channelId);

        if (channel) {
            const embed = buildLeaveEmbed(user, message.guild, leave);

            await channel.send({
                embeds: [embed]
            }).catch(() => {});
        }
    }

    return reply('✅ Test message sent.');
}
    //USER & SERVER INFO\\
    if (command === 'userinfo') {
        const target = message.mentions.users.first() || await resolveUser(client, args[0]) || message.author;
        const member = await resolveMember(message.guild, target.id);
        const rank   = getHighestRank(gid, target.id) || 'Civilian';
        const warns  = botData.warnings?.[gid]?.[target.id]?.length || 0;
        return reply({ embeds: [new EmbedBuilder().setColor(0x00CED1).setTitle(`👤 User Info — ${target.tag}`)
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '🆔 ID',             value: target.id,                                                                                                  inline: true },
                { name: '🎖️ Bot Rank',       value: rank,                                                                                                       inline: true },
                { name: '⚠️ Warnings',       value: `${warns}`,                                                                                                 inline: true },
                { name: '📅 Account Created', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`,                                                     inline: true },
                { name: '📅 Joined Server',   value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'N/A',                                     inline: true },
                { name: '🎭 Roles',           value: member ? member.roles.cache.filter(r => r.id !== gid).map(r => `<@&${r.id}>`).join(', ').slice(0, 1000) || 'None' : 'N/A', inline: false }
            ).setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }
    if (command === 'serverinfo') {
        let guild = message.guild;
        if (args[0] && (isFiveStar(uid) || isGeneral(uid))) {
            const g = client.guilds.cache.get(args[0]);
            if (!g) return reply('❌ Server not found.');
            guild = g;
    }
        return reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(`🏠 Server Info — ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: '🆔 ID',      value: guild.id,                                          inline: true },
                { name: '👑 Owner',   value: `<@${guild.ownerId}>`,                              inline: true },
                { name: '👥 Members', value: `${guild.memberCount}`,                             inline: true },
                { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '📢 Channels',value: `${guild.channels.cache.size}`,                     inline: true },
                { name: '🎭 Roles',   value: `${guild.roles.cache.size}`,                        inline: true }
            ).setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }
    if (command === 'avatar') {
        const target = message.mentions.users.first() || await resolveUser(client, args[0]) || message.author;
        return reply({ embeds: [new EmbedBuilder().setColor(0x9B59B6).setTitle(`🖼️ Avatar — ${target.tag}`)
            .setImage(target.displayAvatarURL({ dynamic: true, size: 1024 })).setFooter({ text: 'SOLDIER²' })] });
    }
    if (command === 'roleinfo') {
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        if (!role) return reply('❌ Usage: `×roleinfo @role` or `×roleinfo <roleID>`');
        return reply({ embeds: [new EmbedBuilder().setColor(role.color || 0x5865F2).setTitle(`🎭 Role Info — ${role.name}`)
            .addFields(
                { name: '🆔 Role ID',          value: role.id,                                          inline: true },
                { name: '🎨 Color',             value: role.hexColor,                                   inline: true },
                { name: '👥 Members',           value: `${role.members.size}`,                          inline: true },
                { name: '📅 Created',           value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '📌 Position',          value: `${role.position}`,                              inline: true },
                { name: '🔑 Mentionable',       value: role.mentionable ? 'Yes' : 'No',                 inline: true },
                { name: '⚡ Key Permissions',   value: role.permissions.toArray().slice(0, 10).join(', ') || 'None', inline: false }
            ).setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }
    if (command === 'rolelist') {
        const roles = message.guild.roles.cache.sort((a, b) => b.position - a.position)
            .map(r => `• **${r.name}** — ID: \`${r.id}\` — ${r.members.size} members`);
        return reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(`🎭 Roles — ${message.guild.name}`)
            .setDescription(roles.join('\n').slice(0, 4000)).setFooter({ text: `${roles.length} roles` }).setTimestamp()] });
    }
    if (command === 'membercount') {
        await message.guild.members.fetch();
        const total  = message.guild.memberCount;
        const bots   = message.guild.members.cache.filter(m => m.user.bot).size;
        const humans = total - bots;
        return reply({ embeds: [new EmbedBuilder().setColor(0x00FF7F).setTitle(`👥 Member Count — ${message.guild.name}`)
            .addFields(
                { name: '👥 Total',  value: `${total}`,  inline: true },
                { name: '👤 Humans', value: `${humans}`, inline: true },
                { name: '🤖 Bots',   value: `${bots}`,   inline: true }
            ).setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }
    if (command === 'lookup') {
        const target = await client.users.fetch(args[0]).catch(() => null);
        if (!target) return reply('❌ User not found.');
        return reply({ embeds: [new EmbedBuilder().setColor(0x00CED1).setTitle(`🔎 Lookup — ${target.tag}`)
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '🆔 ID',      value: target.id,                                          inline: true },
                { name: '🤖 Bot',     value: target.bot ? 'Yes' : 'No',                          inline: true },
                { name: '📅 Created', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true }
            ).setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }
   if (command === 'joinpos') {
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×joinpos @user`');
        await message.guild.members.fetch().catch(() => {});
        const allMembers = [...message.guild.members.cache.values()]
            .filter(m => m.joinedTimestamp)
            .sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);
        const pos = allMembers.findIndex(m => m.id === target.id) + 1;
        if (pos === 0) return reply(`❌ Could not find <@${target.id}> in this server's member list.`);
        const member = message.guild.members.cache.get(target.id);
        const joinedAt = member?.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : 'Unknown';
        return reply({ embeds: [new EmbedBuilder().setColor(0x3498DB).setTitle('📋 Join Position')
            .addFields(
                { name: '👤 User',       value: `<@${target.id}>`,          inline: true },
                { name: '📊 Position',   value: `#${pos} of ${allMembers.length}`, inline: true },
                { name: '📅 Joined',     value: joinedAt,                   inline: false }
            ).setTimestamp().setFooter({ text: 'SOLDIER²' })]});
   }
   if (command === 'newaccounts') {
        if (!isStaff(gid, uid) && !isFiveStar(uid)) return reply('❌ No permission.');
        const days = args[0] ? parseInt(args[0]) : 30;
        if (isNaN(days) || days < 1) return reply('❌ Usage: `×newaccounts <days>` — e.g. `×newaccounts 7`');
        const cutoff = Date.now() - days * 86400000;
        await message.guild.members.fetch().catch(() => {});
        const newMems = [...message.guild.members.cache.values()]
            .filter(m => !m.user.bot && m.user.createdTimestamp > cutoff)
            .sort((a, b) => b.user.createdTimestamp - a.user.createdTimestamp)
            .map(m => `• **${m.user.tag}** — created <t:${Math.floor(m.user.createdTimestamp / 1000)}:R>, joined <t:${Math.floor(m.joinedTimestamp / 1000)}:R>`);
        return reply({ embeds: [new EmbedBuilder().setColor(0xFF6600).setTitle(`🆕 New Accounts (< ${days} days old)`)
            .setDescription(newMems.slice(0, 30).join('\n') || '*(none found)*')
            .setFooter({ text: `${newMems.length} account(s) found • Showing newest first` }).setTimestamp()] });
    }
    if (command === 'modlog') {
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×modlog @user`');
        const cases = botData.modlog?.[gid]?.cases?.filter(c => c.userId === target.id) || [];
        if (!cases.length) return reply(`✅ No mod history for <@${target.id}>.`);
        return reply({ embeds: [new EmbedBuilder().setColor(0xFF6600).setTitle(`📋 Mod Log — ${target.tag}`)
            .setDescription(cases.slice(-20).map(c => `**#${c.id} [${c.type}]** — ${c.reason} *(by <@${c.by}>)*`).join('\n'))
            .setFooter({ text: `${cases.length} total cases` }).setTimestamp()] });
    }
    if (command === 'modstats') {
        const cases  = botData.modlog?.[gid]?.cases || [];
        const counts = {};
        cases.forEach(c => { counts[c.type] = (counts[c.type] || 0) + 1; });
        return reply({ embeds: [new EmbedBuilder().setColor(0xFF6600).setTitle(`📊 Mod Stats — ${message.guild.name}`)
            .setDescription(Object.entries(counts).map(([k, v]) => `**${k}:** ${v}`).join('\n') || '*(no cases)*')
            .addFields({ name: '📋 Total Cases', value: `${cases.length}`, inline: true })
            .setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }
    if (command === 'setlogchannel') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Manage Server** permission.');
        const ch = message.mentions.channels.first();
        if (!ch) return reply('❌ Usage: `×setlogchannel #channel`');
        botData.logChannels[gid] = ch.id;
        markDirty(); scheduleSave();
        return reply(`✅ Log channel set to <#${ch.id}>. All commands will be logged there.`);
    }
    if (command === 'modreason') {
        if (!isStaff(gid, uid) && !isFiveStar(uid)) return reply('❌ No permission.');
        const caseId    = parseInt(args[0]);
        const newReason = args.slice(1).join(' ');
        if (!caseId || !newReason) return reply('❌ Usage: `×modreason <caseID> <reason>`');
        const c = botData.modlog?.[gid]?.cases?.find(x => x.id === caseId);
        if (!c) return reply(`❌ Case #${caseId} not found.`);
        c.reason = newReason;
        markDirty(); scheduleSave();
        return reply(`✅ Case #${caseId} reason updated.`);
    }
    //Autodelete\\
    if (command === 'target') {

    const sub = args[0];

    if (!sub) return reply('Provide a user.');

    if (!botData.autoDeleteTargets[gid])
        botData.autoDeleteTargets[gid] = {};

    if (sub === 'off') {
        const target = message.mentions.users.first() || await resolveUser(client, args[1]);
        if (!target) return reply('Invalid user.');

        delete botData.autoDeleteTargets[gid][target.id];
        markDirty(); scheduleSave();

        return reply(`Removed ${target.tag} from target list.`);
    }

    if (sub === 'list') {
        const list = botData.autoDeleteTargets[gid];
        if (!list || !Object.keys(list).length)
            return reply('No targets.');

        const lines = Object.entries(list).map(([id, data]) =>
            `• <@${id}> (${id}) | Tagged <t:${Math.floor(data.taggedAt/1000)}:R>`
        );

        return reply(lines.join('\n'));
    }

    const target = message.mentions.users.first() || await resolveUser(client, sub);
    if (!target) return reply('Invalid user.');

    botData.autoDeleteTargets[gid][target.id] = {
        taggedBy: message.author.id,
        taggedAt: Date.now()
    };

    markDirty(); scheduleSave();

    return reply(`${target.tag} is now targeted.`);
    }
    if (command === 'lockdown') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Manage Channels** permission.');
        for (const [, ch] of message.guild.channels.cache.filter(c => c.type === 0))
            await ch.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false }).catch(() => {});
        return reply('🔒 **Server lockdown activated.**');
    }
    if (command === 'unlockdown') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Manage Channels** permission.');
        for (const [, ch] of message.guild.channels.cache.filter(c => c.type === 0))
            await ch.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null }).catch(() => {});
        return reply('🔓 **Lockdown lifted.**');
    }
    if (command === 'antiraid') {
        if (!isStaff(gid, uid) && !isFiveStar(uid)) return reply('❌ No permission.');
        const toggle = args[0]?.toLowerCase();
        if (toggle === 'on') {
            const snapshot = {};
            for (const [cid2, ch] of message.guild.channels.cache.filter(c => c.type === 0)) {
                snapshot[cid2] = ch.permissionOverwrites.cache.map(o => ({
                    id: o.id, type: o.type,
                    allow: o.allow.bitfield.toString(), deny: o.deny.bitfield.toString()
                }));
                await ch.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false, AddReactions: false }).catch(() => {});
    }
            if (!botData.antiraidSnapshot) botData.antiraidSnapshot = {};
            botData.antiraidSnapshot[gid] = { snapshot };
        if (!botData.automod[gid]) botData.automod[gid] = {};
            botData.automod[gid].antiraid = true;
        markDirty(); scheduleSave();
            return reply('🚨 **Anti-raid ON.** All channels locked. Use `×antiraid off` to restore.');
    }
        if (toggle === 'off') {
            const snap = botData.antiraidSnapshot?.[gid]?.snapshot;
            for (const [cid2, ch] of message.guild.channels.cache.filter(c => c.type === 0)) {
                await ch.permissionOverwrites.set([]).catch(() => {});
                if (snap?.[cid2]) {
                    for (const o of snap[cid2])
                        await ch.permissionOverwrites.edit(o.id, { allow: BigInt(o.allow), deny: BigInt(o.deny) }).catch(() => {});
    }
    }
            delete botData.antiraidSnapshot?.[gid];
            if (botData.automod[gid]) botData.automod[gid].antiraid = false;
        markDirty(); scheduleSave();
            return reply('✅ **Anti-raid OFF.** Server restored to previous state.');
    }
        return reply('❌ Usage: `×antiraid on/off`');
    }
    if (['antispam', 'antilink', 'automod'].includes(command)) {
        if (!isStaff(gid, uid) && !isFiveStar(uid)) return reply('❌ No permission.');
        const toggle = args[0]?.toLowerCase();
        if (!['on', 'off'].includes(toggle)) return reply(`❌ Usage: \`×${command} on/off\``);
        if (!botData.automod[gid]) botData.automod[gid] = {};
        botData.automod[gid][command] = toggle === 'on';
        markDirty(); scheduleSave();
        return reply(`✅ **${command}** ${toggle === 'on' ? 'enabled' : 'disabled'}.`);
    }
    if (command === 'anticaps') {
        if (!isStaff(gid, uid) && !isFiveStar(uid)) return reply('❌ No permission.');
        const pct = parseInt(args[0]);
        if (isNaN(pct) || pct < 1 || pct > 100) return reply('❌ Usage: `×anticaps <percent>`');
        if (!botData.automod[gid]) botData.automod[gid] = {};
        botData.automod[gid].anticaps    = true;
        botData.automod[gid].capsPercent = pct;
        markDirty(); scheduleSave();
        return reply(`✅ Anti-caps set to **${pct}%**.`);
    }
    if (command === 'antiemoji') {
        if (!isStaff(gid, uid) && !isFiveStar(uid)) return reply('❌ No permission.');
        const lim = parseInt(args[0]);
        if (isNaN(lim)) return reply('❌ Usage: `×antiemoji <limit>`');
        if (!botData.automod[gid]) botData.automod[gid] = {};
        botData.automod[gid].antiemoji  = true;
        botData.automod[gid].emojiLimit = lim;
        markDirty(); scheduleSave();
        return reply(`✅ Anti-emoji limit set to **${lim}**.`);
    }
    if (command === 'antimentions') {
        if (!isStaff(gid, uid) && !isFiveStar(uid)) return reply('❌ No permission.');
        const lim = parseInt(args[0]);
        if (isNaN(lim)) return reply('❌ Usage: `×antimentions <limit>`');
        if (!botData.automod[gid]) botData.automod[gid] = {};
        botData.automod[gid].antimentions  = true;
        botData.automod[gid].mentionLimit  = lim;
        markDirty(); scheduleSave();
        return reply(`✅ Anti-mentions limit set to **${lim}**.`);
    }
    if (command === 'badwords') {
        if (!isStaff(gid, uid) && !isFiveStar(uid)) return reply('❌ No permission.');
        if (!botData.automod[gid]) botData.automod[gid] = {};
        if (!botData.automod[gid].badwords) botData.automod[gid].badwords = [];
        const action = args[0]?.toLowerCase(), word = args[1];
        if (!word) return reply('❌ Usage: `×badwords add/remove <word>`');
        if (action === 'add')    { if (!botData.automod[gid].badwords.includes(word)) botData.automod[gid].badwords.push(word); markDirty(); scheduleSave(); return reply(`✅ Added **${word}** to banned words.`); }
        if (action === 'remove') { botData.automod[gid].badwords = botData.automod[gid].badwords.filter(w => w !== word); markDirty(); scheduleSave(); return reply(`✅ Removed **${word}**.`); }
        return reply('❌ Usage: `×badwords add/remove <word>`');
    }
    if (command === 'badwordslist') {
        const words = botData.automod?.[gid]?.badwords || [];
        return reply(words.length ? `🚫 **Banned words:** ${words.map(w => `\`${w}\``).join(', ')}` : '✅ No banned words set.');
    }
    if (command === 'setmuterole') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Manage Roles** permission.');
        const role = message.mentions.roles.first();
        if (!role) return reply('❌ Usage: `×setmuterole @role`');
        botData.mutedRoles[gid] = role.id;
        markDirty(); scheduleSave();
        return reply(`✅ Mute role set to **${role.name}**.`);
    }

    //ANNOUNCEMENTS & UTILITIES\\
    if (command === 'announce') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Manage Server** permission.');
        const ch   = message.mentions.channels.first();
        const text = args.slice(1).join(' ');
        if (!ch || !text) return reply('❌ Usage: `×announce #channel <message>`');
        await ch.send({ embeds: [new EmbedBuilder().setColor(0xFF6600).setTitle('📢 Announcement').setDescription(text)
            .setFooter({ text: `Announced by ${message.author.tag}` }).setTimestamp()] });
        return reply(`✅ Announcement sent to <#${ch.id}>.`);
    }
    if (command === 'say') {
        if (!isStaff(gid, uid) && !isFiveStar(uid)) return reply('❌ No permission.');
        const text = args.join(' ');
        if (!text) return reply('❌ Usage: `×say <message>`');
        await message.delete().catch(() => {});
        return message.channel.send(text);
    }
    if (command === 'info') {
        const full  = message.content.slice(prefix.length + 5).trim();
        const parts = full.split('|').map(p => p.trim());
        let color   = 0x5865F2;
        let idx     = 0;
        if (/^#?[0-9a-f]{6}$/i.test(parts[0])) { color = parseInt(parts[0].replace('#', ''), 16); idx++; }
        const embed  = new EmbedBuilder().setColor(color).setTimestamp().setFooter({ text: 'SOLDIER²' });
        let gifUrl   = null;
        let firstTitle = true;
        let i = idx;
        while (i < parts.length) {
            const f = parts[i];
            if (/^https?:\/\/.+\.(gif|png|jpg|jpeg|webp)(\?.*)?$/i.test(f)) { gifUrl = f; i++; continue; }
            if (firstTitle) { embed.setTitle(f); firstTitle = false; i++; if (parts[i] && !/^https?/.test(parts[i])) { embed.setDescription(parts[i]); i++; } }
            else { embed.addFields({ name: f, value: parts[i + 1] || '\u200b', inline: false }); i += 2; }
    }
        if (gifUrl) embed.setImage(gifUrl);
        return reply({ embeds: [embed] });
    }
    if (command === 'poll') {
        const parts = args.join(' ').split('|').map(p => p.trim()).filter(Boolean);
        if (parts.length < 3) return reply('❌ Usage: `×poll <question> | <option1> | <option2>`');
        const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
        const msg2   = await message.channel.send({ embeds: [new EmbedBuilder().setColor(0x00CED1)
            .setTitle(`📊 Poll: ${parts[0]}`).setDescription(parts.slice(1).map((o, i) => `${emojis[i]} ${o}`).join('\n'))
            .setFooter({ text: `Poll by ${message.author.tag}` }).setTimestamp()] });
        for (let i = 0; i < Math.min(parts.length - 1, 10); i++) await msg2.react(emojis[i]).catch(() => {});
        return;
    }
    if (command === 'botstats') {
        const up = process.uptime();
        const h = Math.floor(up / 3600), m = Math.floor((up % 3600) / 60), s = Math.floor(up % 60);
        return reply(`🤖 **SOLDIER²** | ⏱️ **${h}h ${m}m ${s}s** | 🏠 **${client.guilds.cache.size}** servers | 💾 **${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB** | 📡 **${client.ws.ping}ms**`);
    }
    if (command === 'botinfo') {
        const up = process.uptime();
        const h = Math.floor(up / 3600), m = Math.floor((up % 3600) / 60), s = Math.floor(up % 60);
        let totalUsers = 0; client.guilds.cache.forEach(g => totalUsers += g.memberCount);
        return reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle('🤖 Bot Info — SOLDIER²')
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '⏱️ Uptime',  value: `${h}h ${m}m ${s}s`,                                 inline: true },
                { name: '🏠 Servers', value: `${client.guilds.cache.size}`,                        inline: true },
                { name: '👥 Users',   value: `${totalUsers}`,                                     inline: true },
                { name: '💾 Memory',  value: `${(process.memoryUsage().heapUsed/1024/1024).toFixed(2)} MB`, inline: true },
                { name: '📡 Ping',    value: `${client.ws.ping}ms`,                               inline: true },
                { name: '📦 Version', value: `discord.js v14`,                                    inline: true }
            ).setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }
    //birthday <MM/DD> or <MM/DD/YYYY>\\
    if (command === 'birthday') {
        if (!args[0]) return reply('❌ Usage: `×birthday <MM/DD>` or `×birthday <MM/DD/YYYY>`');
        const bd = parseBirthday(args[0]);
        if (!bd) return reply('❌ Invalid date. Use `MM/DD` or `MM/DD/YYYY`.');

        if (!botData.birthdays[gid]) botData.birthdays[gid] = {};
        botData.birthdays[gid][uid] = bd;
        markDirty(); scheduleSave();

        await message.delete().catch(() => {});
        const tempMsg = await message.channel.send(
            `✅ <@${uid}> Your birthday (**${formatBirthday(bd)}**) has been registered! 🎂`
        );
        setTimeout(() => tempMsg.delete().catch(() => {}), 10000);
        return;
    }
    if (command === 'removebirthday') {
        if (!botData.birthdays?.[gid]?.[uid])
            return reply('❌ You have no birthday registered in this server.');
        delete botData.birthdays[gid][uid];
        markDirty(); scheduleSave();
        return reply('✅ Your birthday has been removed.');
    }
    if (command === 'setbirthday') {
        if (!isFiveStar(uid) && !isGeneral(uid) && !isOfficer(uid))
            return reply('❌ Generals and Officers only.');
        const target = message.mentions.users.first();
        if (!target)  return reply('❌ Usage: `×setbirthday @user <MM/DD>`');
        if (!args[1]) return reply('❌ Please provide a date. Example: `×setbirthday @user 07/04`');
        const bd = parseBirthday(args[1]);
        if (!bd) return reply('❌ Invalid date. Use `MM/DD` or `MM/DD/YYYY`.');

        if (!botData.birthdays[gid]) botData.birthdays[gid] = {};
        botData.birthdays[gid][target.id] = bd;
        markDirty(); scheduleSave();
        return reply(`✅ Birthday for **${target.tag}** set to **${formatBirthday(bd)}**. 🎂`);
    }
    if (command === 'birthdaylist') {
        if (!isFiveStar(uid) && !isGeneral(uid) && !isOfficer(uid))
            return reply('❌ Generals and Officers only.');

        const guildBirthdays = botData.birthdays?.[gid];
        if (!guildBirthdays || Object.keys(guildBirthdays).length === 0)
            return reply('📋 No birthdays registered in this server yet.');

        const entries = Object.entries(guildBirthdays)
            .sort(([, a], [, b]) => a.month - b.month || a.day - b.day);

        const lines = [];
        for (const [userId, bd] of entries) {
            const member = await message.guild.members.fetch(userId).catch(() => null);
            const name   = member ? member.user.tag : 'Unknown User';
            lines.push(`• **${name}** (${userId}) — ${formatBirthday(bd)}`);
        }

        const chunks = [];
        for (let i = 0; i < lines.length; i += 20)
            chunks.push(lines.slice(i, i + 20));

        for (let i = 0; i < chunks.length; i++) {
            const embed = new EmbedBuilder()
                .setColor(0xFF69B4)
                .setTitle(`🎂 Birthday List — ${message.guild.name} (${i + 1}/${chunks.length})`)
                .setDescription(chunks[i].join('\n'))
                .setFooter({ text: `${entries.length} total birthdays` })
                .setTimestamp();
            await message.channel.send({ embeds: [embed] });
        }
        return;
    }
    if (command === 'setbirthdaychannel') {
        if (!isFiveStar(uid) && !isGeneral(uid) && !isOfficer(uid) && !isCSM(gid, uid) && !isEnlisted(gid, uid))
            return reply('❌ You do not have permission to use this command.');
        if (!args[0]) return reply('❌ Usage: `×setbirthdaychannel <channelID>`');
        const ch = message.guild.channels.cache.get(args[0]);
        if (!ch)  return reply('❌ Channel not found. Make sure the ID is correct.');

        botData.birthdayChannels[gid] = args[0];
        markDirty(); scheduleSave();
        return reply(`✅ Birthday announcements will be posted in <#${args[0]}>.`);
    }
    if (command === 'disablebirthdays') {
        if (!isFiveStar(uid) && !isGeneral(uid) && !isOfficer(uid) && !isCSM(gid, uid) && !isEnlisted(gid, uid))
            return reply('❌ You do not have permission to use this command.');
        botData.birthdayEnabled[gid] = false;
        markDirty(); scheduleSave();
        return reply('✅ Birthday announcements have been **disabled** for this server.');
    }
    if (command === 'enablebirthdays') {
        if (!isFiveStar(uid) && !isGeneral(uid) && !isOfficer(uid) && !isCSM(gid, uid) && !isEnlisted(gid, uid))
            return reply('❌ You do not have permission to use this command.');
        botData.birthdayEnabled[gid] = true;
        markDirty(); scheduleSave();
        return reply('✅ Birthday announcements have been **enabled** for this server.');
    }
    if (command === 'setbirthdaymessage') {
        if (!isFiveStar(uid) && !isGeneral(uid) && !isOfficer(uid) && !isCSM(gid, uid) && !isEnlisted(gid, uid))
            return reply('❌ You do not have permission to use this command.');
        if (args.length < 2)
            return reply('❌ Usage: `×setbirthdaymessage <#hexColor> <message>`\nUse `{user}` as a placeholder. Example: `×setbirthdaymessage #FF69B4 Happy Birthday {user}! 🎉`');

        const colorInt = parseInt(args[0].replace('#', ''), 16);
        if (isNaN(colorInt)) return reply('❌ Invalid hex color. Example: `#FF69B4`');

        const customMsg = args.slice(1).join(' ');
        if (!botData.birthdayConfig[gid]) botData.birthdayConfig[gid] = {};
        botData.birthdayConfig[gid].color   = colorInt;
        botData.birthdayConfig[gid].message = customMsg;
        markDirty(); scheduleSave();

        const embed = buildBirthdayEmbed(client, gid, `<@${uid}>`);
        return reply({ content: '✅ Birthday message updated! Here\'s a preview:', embeds: [embed] });
    }
    if (command === 'testbirthday') {
        const embed = buildBirthdayEmbed(client, gid, '**[Birthday Person]**');
        return reply({ content: '🎂 Birthday embed preview:', embeds: [embed] });
    }

    //VERIFICATION\\
    if (command === 'verify') {
        if (!isStaff(gid, uid) && !isFiveStar(uid)) return reply('❌ No permission.');
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×verify @user`');
        const vrole = botData.verifyRoles?.[gid];
        if (!vrole) return reply('❌ No verify role set. Use `×setverifyrole @role`.');
        const member = await resolveMember(message.guild, target.id);
        if (!member) return reply('❌ Member not found.');
        await member.roles.add(vrole).catch(() => {});
        return reply(`✅ <@${target.id}> verified.`);
    }
    if (command === 'unverify') {
        if (!isStaff(gid, uid) && !isFiveStar(uid)) return reply('❌ No permission.');
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×unverify @user`');
        const vrole = botData.verifyRoles?.[gid];
        if (!vrole) return reply('❌ No verify role set.');
        const member = await resolveMember(message.guild, target.id);
        if (!member) return reply('❌ Member not found.');
        await member.roles.remove(vrole).catch(() => {});
        return reply(`✅ Verification removed from <@${target.id}>.`);
    }
    if (command === 'setverifyrole') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Manage Roles** permission.');
        const role = message.mentions.roles.first();
        if (!role) return reply('❌ Usage: `×setverifyrole @role`');
        botData.verifyRoles[gid] = role.id;
        markDirty(); scheduleSave();
        return reply(`✅ Verify role set to **${role.name}**.`);
    }

    if (command === 'giverole') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Manage Roles** permission.');
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        const role   = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
        if (!target || !role) return reply('❌ Usage: `×giverole @user @role`');
        const member = await resolveMember(message.guild, target.id);
        if (!member) return reply('❌ Member not found.');
        await member.roles.add(role).catch(() => {});
        return reply(`✅ Gave <@&${role.id}> to <@${target.id}>.`);
    }
    if (command === 'removerole') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Manage Roles** permission.');
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        const role   = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
        if (!target || !role) return reply('❌ Usage: `×removerole @user @role`');
        const member = await resolveMember(message.guild, target.id);
        if (!member) return reply('❌ Member not found.');
        await member.roles.remove(role).catch(() => {});
        return reply(`✅ Removed <@&${role.id}> from <@${target.id}>.`);
    }
    if (command === 'createrole') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles) && !isFiveStar(uid))
            return reply('❌ You need **Manage Roles** permission.');
        if (!args[0]) return reply('❌ Usage: `×createrole <n> [#hexcolor]`');
        const color = args[1] ? parseInt(args[1].replace('#', ''), 16) : undefined;
        const role  = await message.guild.roles.create({ name: args[0], color }).catch(() => null);
        return reply(role ? `✅ Created role **${role.name}** (\`${role.id}\`).` : '❌ Failed to create role.');
    }
    if (command === 'deleterole') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles) && !isFiveStar(uid))
            return reply('❌ You need **Manage Roles** permission.');
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        if (!role) return reply('❌ Usage: `×deleterole @role`');
        await role.delete().catch(() => {});
        return reply(`✅ Deleted role **${role.name}**.`);
    }
    if (command === 'rolecolor') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles) && !isFiveStar(uid))
            return reply('❌ You need **Manage Roles** permission.');
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        const hex  = args[message.mentions.roles.size ? 1 : 1];
        if (!role || !hex) return reply('❌ Usage: `×rolecolor @role <#hexcolor>`');
        await role.setColor(parseInt(hex.replace('#', ''), 16)).catch(() => {});
        return reply(`✅ Role **${role.name}** color updated.`);
    }

    if (command === 'nick') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageNicknames) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Manage Nicknames** permission.');
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×nick @user <nickname>`');
        const nick   = args.slice(1).join(' ');
        if (!nick) return reply('❌ Please provide a nickname.');
        const member = await resolveMember(message.guild, target.id);
        if (!member) return reply('❌ Member not found.');
        await member.setNickname(nick).catch(() => {});
        return reply(`✅ Nickname set to **${nick}** for <@${target.id}>.`);
    }
    if (command === 'resetnick') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageNicknames) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Manage Nicknames** permission.');
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×resetnick @user`');
        const member = await resolveMember(message.guild, target.id);
        if (!member) return reply('❌ Member not found.');
        await member.setNickname(null).catch(() => {});
        return reply(`✅ Nickname reset for <@${target.id}>.`);
    }


    // =========================================================
    //  STAFF MANAGEMENT
    // =========================================================
    if (command === 'stafflist') {
        const staff = botData.staffList?.[gid] || {};
        if (!Object.keys(staff).length) return reply('❌ No staff registered.');
        const lines = Object.entries(staff).map(([id]) => {
            const rank = getHighestRank(gid, id) || 'Staff';
            const duty = botData.dutyStatus?.[gid]?.[id] ? '🟢 On Duty' : '🔴 Off Duty';
            return `• <@${id}> — **${rank}** ${duty}`;
});
        return reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(`👮 Staff List — ${message.guild.name}`)
            .setDescription(lines.join('\n')).setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }
    if (command === 'staffadd') {
        if (!isStaff(gid, uid) && !isFiveStar(uid)) return reply('❌ No permission.');
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×staffadd @user`');
        if (!botData.staffList[gid]) botData.staffList[gid] = {};
        botData.staffList[gid][target.id] = { addedBy: uid, addedAt: Date.now() };
        markDirty(); scheduleSave();
        return reply(`✅ <@${target.id}> added to staff list.`);
    }
    if (command === 'staffremove') {
        if (!isStaff(gid, uid) && !isFiveStar(uid)) return reply('❌ No permission.');
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×staffremove @user`');
        if (botData.staffList?.[gid]) delete botData.staffList[gid][target.id];
        markDirty(); scheduleSave();
        return reply(`✅ <@${target.id}> removed from staff list.`);
    }
    if (command === 'duty') {
        const toggle = args[0]?.toLowerCase();
        if (!['on', 'off'].includes(toggle)) return reply('❌ Usage: `×duty on/off`');
        if (!botData.dutyStatus[gid]) botData.dutyStatus[gid] = {};
        botData.dutyStatus[gid][uid] = toggle === 'on';
        markDirty(); scheduleSave();
        return reply(toggle === 'on' ? '🟢 You are now **On Duty**.' : '🔴 You are now **Off Duty**.');
    }
    if (command === 'onduty') {
        const duty   = botData.dutyStatus?.[gid] || {};
        const onDuty = Object.entries(duty).filter(([, v]) => v).map(([id]) => `• <@${id}>`);
        return reply(onDuty.length ? `🟢 **On Duty:**\n${onDuty.join('\n')}` : '❌ Nobody is currently on duty.');
    }
    if (command === 'note') {
        if (!isStaff(gid, uid) && !isFiveStar(uid)) return reply('❌ No permission.');
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×note @user <note>`');
        const note = args.slice(1).join(' ');
        if (!note) return reply('❌ Please provide a note.');
        if (!botData.notes[gid]) botData.notes[gid] = {};
        if (!botData.notes[gid][target.id]) botData.notes[gid][target.id] = [];
        botData.notes[gid][target.id].push({ note, by: uid, at: Date.now() });
        markDirty(); scheduleSave();
        return reply(`✅ Note added for <@${target.id}>.`);
    }
    if (command === 'notes') {
        if (!isStaff(gid, uid) && !isFiveStar(uid)) return reply('❌ No permission.');
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×notes @user`');
        const notes = botData.notes?.[gid]?.[target.id] || [];
        if (!notes.length) return reply(`✅ No notes for <@${target.id}>.`);
        return reply({ embeds: [new EmbedBuilder().setColor(0xFFFF00).setTitle(`📝 Notes — ${target.tag}`)
            .setDescription(notes.map((n, i) => `**${i + 1}.** ${n.note} *(by <@${n.by}>)*`).join('\n'))
            .setFooter({ text: `${notes.length} note(s)` }).setTimestamp()] });
    }
    if (command === 'watchlist') {
        if (!isStaff(gid, uid) && !isFiveStar(uid)) return reply('❌ No permission.');
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×watchlist @user <reason>`');
        const reason = args.slice(1).join(' ') || 'No reason';
        if (!botData.watchlist[gid]) botData.watchlist[gid] = {};
        botData.watchlist[gid][target.id] = { reason, by: uid, at: Date.now() };
        markDirty(); scheduleSave();
        return reply(`👁️ <@${target.id}> added to watchlist.`);
    }
    if (command === 'unwatchlist') {
        if (!isStaff(gid, uid) && !isFiveStar(uid)) return reply('❌ No permission.');
        const target = message.mentions.users.first() || await resolveUser(client, args[0]);
        if (!target) return reply('❌ Usage: `×unwatchlist @user`');
        if (botData.watchlist?.[gid]) delete botData.watchlist[gid][target.id];
        markDirty(); scheduleSave();
        return reply(`✅ <@${target.id}> removed from watchlist.`);
    }
    if (command === 'watchlistview') {
        if (!isStaff(gid, uid) && !isFiveStar(uid)) return reply('❌ No permission.');
        const list = Object.entries(botData.watchlist?.[gid] || {});
        if (!list.length) return reply('✅ No users on watchlist.');
        return reply({ embeds: [new EmbedBuilder().setColor(0xFF6600).setTitle(`👁️ Watchlist — ${message.guild.name}`)
            .setDescription(list.map(([id, d]) => `• <@${id}> — ${d.reason} *(by <@${d.by}>)*`).join('\n'))
            .setFooter({ text: `${list.length} watched user(s)` }).setTimestamp()] });
    }
    if (command === 'userlookup') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        const tgtId  = args[0];
        if (!tgtId) return reply('❌ Usage: `×userlookup <userID>`');
        const target = await client.users.fetch(tgtId).catch(() => null);
        const genRank = getGeneralRank(tgtId), offRank = getOfficerRank(tgtId);
        let totalWarns = 0;
        for (const g of Object.values(botData.warnings || {})) totalWarns += g[tgtId]?.length || 0;
        return reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(`🔎 User Lookup — ${target?.tag || tgtId}`)
            .setThumbnail(target?.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '🆔 ID',             value: tgtId,                                                         inline: true },
                { name: '🎖️ General Rank',   value: genRank || 'None',                                            inline: true },
                { name: '🎖️ Officer Rank',   value: offRank || 'None',                                            inline: true },
                { name: '⚠️ Total Warnings', value: `${totalWarns}`,                                              inline: true },
                { name: '🚩 Flagged',         value: botData.flaggedUsers?.[tgtId] ? `Yes — ${botData.flaggedUsers[tgtId].reason}` : 'No', inline: true },
                { name: '🔍 Tracked',         value: botData.trackedUsers?.[tgtId] ? 'Yes' : 'No',                inline: true }
            ).setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }
    if (command === 'globalhistory') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        const tgtId = args[0];
        if (!tgtId) return reply('❌ Usage: `×globalhistory <userID>`');
        const cases = [];
        for (const [guildId, data] of Object.entries(botData.modlog || {}))
            (data.cases?.filter(c => c.userId === tgtId) || []).forEach(c => cases.push({ ...c, guildId }));
        if (!cases.length) return reply(`✅ No global mod history for \`${tgtId}\`.`);
        return reply({ embeds: [new EmbedBuilder().setColor(0xFF6600).setTitle(`📋 Global Mod History — \`${tgtId}\``)
            .setDescription(cases.slice(-20).map(c => `**[${c.type}]** ${c.reason} — Server: \`${c.guildId}\``).join('\n'))
            .setFooter({ text: `${cases.length} total cases` }).setTimestamp()] });
    }

    //GOLD COINS & XP SYSTEM\\
    if (command === 'balance') {
        const target = message.mentions.users.first() || message.author;
        const balance = getUserBalance(target.id);
        const isGlobal = isGlobalXPUser(target.id);
        const xpData = getUserXPData(isGlobal ? 'GLOBAL' : gid, target.id);
        const xpNeeded = xpData.level * XP_PER_LEVEL;
        const xpProgress = xpData.xp % XP_PER_LEVEL;
        
        return reply({ embeds: [new EmbedBuilder().setColor(0xFFD700)
            .setTitle(`${GOLD_SYMBOL} Wallet — ${target.username}`)
            .addFields(
                { name: `${GOLD_SYMBOL} Gold Coins`, value: `**${balance.toLocaleString()}**`, inline: true },
                { name: `${XP_SYMBOL} Level`, value: `**${xpData.level}**`, inline: true },
                { name: `${PRESTIGE_SYMBOL} Prestige`, value: `**${xpData.prestige}**`, inline: true },
                { name: '📊 XP Progress', value: `\`${xpProgress}/${XP_PER_LEVEL}\``, inline: false },
                { name: '🌍 XP Type', value: isGlobal ? '**Global** (All Servers)' : `**Per-Server** (${message.guild.name})`, inline: false }
            ).setThumbnail(target.displayAvatarURL()).setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }
    if (command === 'richest') {
        const scope = args[0]?.toLowerCase() || 'server';
        if (!['server', 'global'].includes(scope)) return reply('❌ Usage: `×richest [server|global]`');
        
        const lb = scope === 'global' ? getGlobalLeaderboard('coins', 15) : getServerLeaderboard(gid, 'coins', 15);
        if (!lb.length) return reply('❌ No currency data yet.');
        
        const desc = lb.map((e, i) => `${i + 1}. <@${e.userId}> — **${e.balance.toLocaleString()}** ${GOLD_SYMBOL}`).join('\n');
        return reply({ embeds: [new EmbedBuilder().setColor(0xFFD700)
            .setTitle(`${GOLD_SYMBOL} Richest Players — ${scope === 'global' ? 'Global' : message.guild.name}`)
            .setDescription(desc)
            .setTimestamp().setFooter({ text: `SOLDIER² — Top 15 ${scope}` })] });
    }
    if (command === 'levels') {
        const scope = args[0]?.toLowerCase() || 'server';
        if (!['server', 'global'].includes(scope)) return reply('❌ Usage: `×levels [server|global]`');
        
        const lb = scope === 'global' ? getGlobalLeaderboard('level', 15) : getServerLeaderboard(gid, 'level', 15);
        if (!lb.length) return reply('❌ No XP data yet.');
        
        const desc = lb.map((e, i) => {
            if (scope === 'global') {
                return `${i + 1}. <@${e.userId}> — ${PRESTIGE_SYMBOL} **${e.totalPrestige}** | Level **${e.maxLevel}**`;
    }
            return `${i + 1}. <@${e.userId}> — ${PRESTIGE_SYMBOL} **${e.prestige}** | Level **${e.level}**`;
        }).join('\n');
        
        return reply({ embeds: [new EmbedBuilder().setColor(0xFF6900)
            .setTitle(`${XP_SYMBOL} Top Players — ${scope === 'global' ? 'Global' : message.guild.name}`)
            .setDescription(desc)
            .setTimestamp().setFooter({ text: `SOLDIER² — Top 15 ${scope}` })] });
    }
    if (command === 'prestige') {
        const isGlobal = isGlobalXPUser(uid);
        const gidToCheck = isGlobal ? 'GLOBAL' : gid;
        const result = prestigeUser(gidToCheck, uid);
        
        if (!result.success) return reply(`❌ **Cannot Prestige:** ${result.reason}`);
        
        return reply(`✨ **PRESTIGE!** Congratulations! You are now ${PRESTIGE_SYMBOL} **Prestige ${result.prestige}** Level 1!`);
    }
    if (command === 'givecoin') {
        const target = message.mentions.users.first();
        const amt = parseInt(args[1]);
        if (!target || !amt || amt < 1) return reply('❌ Usage: `×givecoin @user <amount>`');
        
        const perm = canManageCurrency(uid, target.id, gid);
        if (!perm.allowed) return reply(perm.reason);
        
        addCoins(target.id, amt);
        addModCase(gid, 'COIN_GIVE', target.id, `Gave ${amt} coins`, uid);
        return reply(`✅ Gave **${amt}** ${GOLD_SYMBOL} to <@${target.id}>`);
    }
    if (command === 'takecoin') {
        const target = message.mentions.users.first();
        const amt = parseInt(args[1]);
        if (!target || !amt || amt < 1) return reply('❌ Usage: `×takecoin @user <amount>`');
        
        const perm = canManageCurrency(uid, target.id, gid);
        if (!perm.allowed) return reply(perm.reason);
        
        const removed = removeCoins(target.id, amt);
        if (!removed) return reply(`❌ <@${target.id}> only has **${getUserBalance(target.id)}** coins.`);
        
        addModCase(gid, 'COIN_REMOVE', target.id, `Removed ${amt} coins`, uid);
        return reply(`✅ Took **${amt}** ${GOLD_SYMBOL} from <@${target.id}>`);
    }
    if (command === 'addxp') {
        const target = message.mentions.users.first();
        const amt = parseInt(args[1]);
        if (!target || !amt || amt < 1) return reply('❌ Usage: `×addxp @user <amount>`');
        
        const perm = canManageCurrency(uid, target.id, gid);
        if (!perm.allowed) return reply(perm.reason);
        
        const isGlobal = isGlobalXPUser(target.id);
        const gidToUse = isGlobal ? 'GLOBAL' : gid;
        const result = addXP(gidToUse, target.id, amt);
        const xpData = getUserXPData(gidToUse, target.id);
        
        addModCase(gid, 'XP_ADD', target.id, `Added ${amt} XP`, uid);
        return reply(`✅ Added **${amt}** XP to <@${target.id}> — Now **Level ${xpData.level}** ${PRESTIGE_SYMBOL} **Prestige ${xpData.prestige}**`);
    }
    if (command === 'removexp') {
        const target = message.mentions.users.first();
        const amt = parseInt(args[1]);
        if (!target || !amt || amt < 1) return reply('❌ Usage: `×removexp @user <amount>`');
        
        const perm = canManageCurrency(uid, target.id, gid);
        if (!perm.allowed) return reply(perm.reason);
        
        const isGlobal = isGlobalXPUser(target.id);
        const gidToUse = isGlobal ? 'GLOBAL' : gid;
        removeXP(gidToUse, target.id, amt);
        const xpData = getUserXPData(gidToUse, target.id);
        
        addModCase(gid, 'XP_REMOVE', target.id, `Removed ${amt} XP`, uid);
        return reply(`✅ Removed **${amt}** XP from <@${target.id}> — Now **Level ${xpData.level}** ${PRESTIGE_SYMBOL} **Prestige ${xpData.prestige}**`);
    }
    if (command === 'resetxp') {
        const target = message.mentions.users.first();
        if (!target) return reply('❌ Usage: `×resetxp @user`');
        
        const perm = canManageCurrency(uid, target.id, gid);
        if (!perm.allowed) return reply(perm.reason);
        
        const isGlobal = isGlobalXPUser(target.id);
        resetXP(isGlobal ? 'GLOBAL' : gid, target.id);
        
        addModCase(gid, 'XP_RESET', target.id, 'XP reset', uid);
        return reply(`✅ Reset XP for <@${target.id}>`);
    }
    if (command === 'setlevelupchannel') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Manage Server** permission.');
        
        const ch = message.mentions.channels.first();
        if (!ch) return reply('❌ Usage: `×setlevelupchannel #channel`');
        
        botData.levelupChannels[gid] = ch.id;
        markDirty(); scheduleSave();
        return reply(`✅ Level-up announcements will be sent to <#${ch.id}>.`);
    }
    if (command === 'howtoearnxp') {
        const isGlobal = isGlobalXPUser(uid);
        return reply({ embeds: [new EmbedBuilder().setColor(0xFF6900)
            .setTitle(`${XP_SYMBOL} How to Earn XP`)
            .addFields(
                { name: '📝 By Sending Messages', value: `**5 XP** per message (10 second cooldown)\nRegular users and enlisted earn **per-server**\n${isGlobal ? `*You earn **global XP** (${PRESTIGE_SYMBOL} Owner/General/Officer)*` : ''}`, inline: false },
                { name: '⬆️ Leveling System', value: `Each level requires **${XP_PER_LEVEL} XP**\nMax level: **${MAX_LEVEL}**\nMax prestige: **${MAX_PRESTIGE}**\n\nEach level grants **50 × level coins**\nExample: Level 10 = 500 coins`, inline: false },
                { name: `${PRESTIGE_SYMBOL} Prestige System`, value: `Reach Level ${MAX_LEVEL} to prestige!\nReset to Level 1\nEarn **500 × prestige coins**\nMax: **${MAX_PRESTIGE}** times`, inline: false },
                { name: '🎯 XP Scope', value: isGlobal ? `**Your XP:** Global (across all servers)\n*Only Owners, Generals, Officers get global XP*` : `**Your XP:** Per-Server\n**This Server:** ${message.guild.name}\nEnlisted & regular users earn per-server XP`, inline: false },
                { name: '💰 Earning Coins', value: `Gain coins by:\n• Leveling up (**automatic**)\n• Commands from staff (+rewards)\n• Prestige milestones`, inline: false }
            ).setTimestamp().setFooter({ text: 'SOLDIER² — Keep grinding!' })] });
    }
    //aicheck — AI status and diagnostics\\
    if (command === 'aicheck') {
        if (!isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ No permission.');

        // Count memory stats
        const activeUsers    = aiMemory.size;
        const totalExchanges = [...aiMemory.values()].reduce((acc, arr) => acc + arr.length, 0);
        const apiKeyLoaded   = !!process.env.GEMINI_API_KEY;

        // Live ping test
        const pingStart = Date.now();
        let pingMs      = null;
        let pingStatus  = '✅ Online';

        try {
            const testResult = await aiModel.generateContent('Reply with only the word: ONLINE');
            const testText   = testResult.response.text().trim();
            pingMs           = Date.now() - pingStart;
            pingStatus       = `✅ Online — responded in **${pingMs}ms**`;
        } catch (e) {
            pingStatus = `❌ Error — ${e.message?.slice(0, 60) || 'Unknown error'}`;
        }

        const embed = new EmbedBuilder()
            .setColor(pingStatus.startsWith('✅') ? 0x00FF7F : 0xFF0000)
            .setTitle('🤖 SOLDIER² — AI Diagnostics')
            .addFields(
                { name: '🔌 Status',           value: pingStatus,                          inline: false },
                { name: '🧠 Model',            value: `\`gemini-2.5-flash\``,              inline: true  },
                { name: '🔑 API Key',          value: apiKeyLoaded ? '✅ Loaded' : '❌ Missing', inline: true },
                { name: '👥 Active Users',     value: `${activeUsers}`,                    inline: true  },
                { name: '💾 Memory Per User',  value: `${AI_MEMORY_LIMIT} exchanges max`,  inline: true  },
                { name: '📊 Total Exchanges',  value: `${totalExchanges}`,                 inline: true  },
                { name: '⚙️ System Prompt',    value: `${AI_SYSTEM_PROMPT.slice(0, 80)}…`, inline: false }
            )
            .setFooter({ text: 'SOLDIER² AI System • Powered by Google Gemini' })
            .setTimestamp();

        return reply({ embeds: [embed] });
    }

    //REACTION ROLES\\
    if (command === 'reactionrole') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles) && !isStaff(gid, uid) && !isFiveStar(uid))
            return reply('❌ You need **Manage Roles** permission.');
        
        if (args.length < 2 || args.length % 2 !== 0) 
            return reply('❌ Usage: `×reactionrole <emoji> <@role|roleID|roleName> [emoji2] [@role2|roleID|roleName]...`\n\n**Examples:**\n`×reactionrole 🎮 @Gamer 🎨 @Artist`\n`×reactionrole 🎮 1234567890 🎨 Artist`');
        
        //Parse emoji-role pairs\\
        const pairs = [];
        for (let i = 0; i < args.length; i += 2) {
            const emoji = args[i];
            const roleArg = args[i + 1];
            let role = null;
            
            //Try to get role by mention\\
            role = message.mentions.roles.first();
            
            //Try to get role by ID\\
            if (!role) {
                role = message.guild.roles.cache.get(roleArg.replace(/[<@&>]/g, ''));
    }
            
            //Try to get role by name (case-insensitive)\\
            if (!role) {
                role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleArg.toLowerCase());
    }
            
            if (!role) return reply(`❌ Role not found: **${roleArg}**. Use @role, roleID, or role name.`);
            if (role.managed) return reply(`❌ Cannot use managed role **${role.name}**.`);
            if (role.position >= message.member.roles.highest.position && !isFiveStar(uid)) 
                return reply(`❌ Role **${role.name}** is too high in hierarchy.`);
            
            pairs.push({ emoji, roleId: role.id, roleName: role.name });
    }
        
        //Build embed\\
        const roleList = pairs.map(p => `${p.emoji} — **${p.roleName}**`).join('\n');
        const embed = new EmbedBuilder()
            .setColor(0x7521FC)
            .setTitle('✨ Reaction Roles')
            .setDescription(`React below to receive a role!\n\n${roleList}`)
            .setImage('https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif')
            .setTimestamp()
            .setFooter({ text: 'SOLDIER² — React to get your role!' });
        
        //Send the embed message\\
        const sentMessage = await message.channel.send({ embeds: [embed] }).catch(() => null);
        
        if (!sentMessage) return reply('❌ Failed to send reaction role message.');
        
        //Add reactions\\
        for (const pair of pairs) {
            await sentMessage.react(pair.emoji).catch(() => {});
    }
        
        //Store in database\\
        for (const pair of pairs) {
            addReactionRole(gid, sentMessage.id, pair.emoji, pair.roleId);
    }
        
        //Delete user's command\\
        await message.delete().catch(() => {});
        
        return;
    }

    //REMOTE SERVER CONTROL ★ Generals/Owner only\\

    if (command === 'serverlist') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        const guilds = client.guilds.cache.map(g => `• **${g.name}** | ID: \`${g.id}\` | Members: **${g.memberCount}**`);
        return reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle('🌐 Bot Server List')
            .setDescription(guilds.join('\n').slice(0, 4000)).setFooter({ text: `${guilds.length} servers` }).setTimestamp()] });
    }
    if (command === 'remotekick') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        const [srvId, tgtId, ...rArr] = args;
        if (!srvId || !tgtId) return reply('❌ Usage: `×remotekick <serverID> <userID> [reason]`');
        const srv = client.guilds.cache.get(srvId);
        if (!srv) return reply('❌ Server not found.');
        const check = canAct(uid, tgtId, srvId);
        if (!check.allowed) return reply(check.reason);
        const mem = await srv.members.fetch(tgtId).catch(() => null);
        if (!mem) return reply('❌ Member not found in that server.');
        await mem.kick(rArr.join(' ') || 'Remote kick').catch(() => {});
        return reply(`✅ Kicked \`${tgtId}\` from **${srv.name}**.`);
    }
    if (command === 'remoteban') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        const [srvId, tgtId, ...rArr] = args;
        if (!srvId || !tgtId) return reply('❌ Usage: `×remoteban <serverID> <userID> [reason]`');
        const srv = client.guilds.cache.get(srvId);
        if (!srv) return reply('❌ Server not found.');
        const check = canAct(uid, tgtId, srvId);
        if (!check.allowed) return reply(check.reason);
        await srv.members.ban(tgtId, { reason: rArr.join(' ') || 'Remote ban' }).catch(() => {});
        return reply(`✅ Banned \`${tgtId}\` from **${srv.name}**.`);
    }
    if (command === 'remoteunban') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        const [srvId, tgtId] = args;
        if (!srvId || !tgtId) return reply('❌ Usage: `×remoteunban <serverID> <userID>`');
        const srv = client.guilds.cache.get(srvId);
        if (!srv) return reply('❌ Server not found.');
        await srv.members.unban(tgtId).catch(() => {});
        return reply(`✅ Unbanned \`${tgtId}\` from **${srv.name}**.`);
    }
    if (command === 'remotelockdown') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        const srv = client.guilds.cache.get(args[0]);
        if (!srv) return reply('❌ Server not found.');
            for (const [, ch] of srv.channels.cache.filter(c => c.type === 0))
                await ch.permissionOverwrites.edit(srv.roles.everyone, { SendMessages: false }).catch(() => {});
        return reply(`✅ Locked all channels in **${srv.name}**.`);
    }
    if (command === 'remoteunlockdown') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        const srv = client.guilds.cache.get(args[0]);
        if (!srv) return reply('❌ Server not found.');
            for (const [, ch] of srv.channels.cache.filter(c => c.type === 0))
                await ch.permissionOverwrites.edit(srv.roles.everyone, { SendMessages: null }).catch(() => {});
        return reply(`✅ Unlocked all channels in **${srv.name}**.`);
    }
    if (command === 'remotenuke') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        const srv = client.guilds.cache.get(args[0]);
        if (!srv) return reply('❌ Server not found.');
        await reply(`⚠️ Remote nuking **${srv.name}**...`);
            await srv.members.fetch();
        let count = 0;
            for (const [, mem] of srv.members.cache) {
                if (mem.user.bot) continue;
                const check = canAct(uid, mem.user.id, srv.id);
                if (!check.allowed) continue;
            await mem.kick('Remote nuke').catch(() => {});
            count++;
    }
        return message.channel.send(`✅ Remote nuke complete. **${count}** members removed from **${srv.name}**.`);
    }
    if (command === 'remoteannounce') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        const srvId = args[0], text = args.slice(1).join(' ');
        if (!srvId || !text) return reply('❌ Usage: `×remoteannounce <serverID> <message>`');
        const srv = client.guilds.cache.get(srvId);
        if (!srv) return reply('❌ Server not found.');
            const ch = srv.systemChannel || srv.channels.cache.filter(c => c.type === 0 && c.permissionsFor(srv.members.me).has('SendMessages')).first();
        if (!ch) return reply('❌ No suitable channel found.');
        await ch.send({ embeds: [new EmbedBuilder().setColor(0xFF6600).setTitle('📢 Remote Announcement').setDescription(text).setFooter({ text: `From: ${message.author.tag}` }).setTimestamp()] });
        return reply(`✅ Announcement sent to **${srv.name}**.`);
    }
    if (command === 'servermembers') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        const srv = client.guilds.cache.get(args[0]);
        if (!srv) return reply('❌ Server not found.');
            await srv.members.fetch();
        const members = srv.members.cache.filter(m => !m.user.bot).map(m => `• ${m.user.tag} (\`${m.user.id}\`)`);
        return reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(`👥 Members — ${srv.name}`)
            .setDescription(members.slice(0, 50).join('\n') + (members.length > 50 ? `\n...and ${members.length - 50} more` : ''))
            .setFooter({ text: `${members.length} human members` }).setTimestamp()] });
    }
    if (command === 'serverleave') {
        if (!isFiveStar(uid)) return reply('❌ Owner only.');
        const srv = client.guilds.cache.get(args[0]);
        if (!srv) return reply('❌ Server not found.');
        const name = srv.name;
        await srv.leave().catch(() => {});
        return reply(`✅ Left **${name}**.`);
    }

    if (command === 'flaguser') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        const tgtId = args[0], reason = args.slice(1).join(' ');
        if (!tgtId || !reason) return reply('❌ Usage: `×flaguser <userID> <reason>`');
        botData.flaggedUsers[tgtId] = { reason, by: uid, at: Date.now() };
        markDirty(); scheduleSave();
        return reply(`🚩 User \`${tgtId}\` globally flagged.`);
    }
    if (command === 'unflaguser') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        if (!args[0]) return reply('❌ Usage: `×unflaguser <userID>`');
        delete botData.flaggedUsers[args[0]];
        markDirty(); scheduleSave();
        return reply(`✅ Flag removed from \`${args[0]}\`.`);
    }
        if (command === 'flaggedlist') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        const flagged = Object.entries(botData.flaggedUsers || {});
        if (!flagged.length) return reply('✅ No flagged users.');
        return reply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setTitle('🚩 Globally Flagged Users')
            .setDescription(flagged.map(([id, d]) => `• \`${id}\` — ${d.reason} *(by <@${d.by}>)*`).join('\n'))
            .setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }
    if (command === 'trackuser') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        if (!args[0]) return reply('❌ Usage: `×trackuser <userID>`');
        botData.trackedUsers[args[0]] = { by: uid, at: Date.now() };
        markDirty(); scheduleSave();
        return reply(`🔍 Now tracking \`${args[0]}\`. You will be DM'd when they send messages.`);
    }
    if (command === 'untrackuser') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        if (!args[0]) return reply('❌ Usage: `×untrackuser <userID>`');
        delete botData.trackedUsers[args[0]];
        markDirty(); scheduleSave();
        return reply(`✅ Stopped tracking \`${args[0]}\`.`);
    }
    if (command === 'tracklist') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        const tracked = Object.entries(botData.trackedUsers || {});
        if (!tracked.length) return reply('✅ No tracked users.');
        return reply(`🔍 **Tracked users:** ${tracked.map(([id]) => `\`${id}\``).join(', ')}`);
    }
    if (command === 'crosswarn') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        const tgtId = args[0], reason = args.slice(1).join(' ');
        if (!tgtId || !reason) return reply('❌ Usage: `×crosswarn <userID> <reason>`');
        let count = 0;
        for (const [guildId] of client.guilds.cache) {
            if (!botData.warnings[guildId]) botData.warnings[guildId] = {};
            if (!botData.warnings[guildId][tgtId]) botData.warnings[guildId][tgtId] = [];
            botData.warnings[guildId][tgtId].push({ id: botData.warnings[guildId][tgtId].length + 1, reason, by: uid, at: Date.now() });
            count++;
    }
        markDirty(); scheduleSave();
        return reply(`✅ Cross-warned \`${tgtId}\` across **${count}** servers.`);
    }

    if (command === 'globalban') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        const tgtId = args[0], reason = args.slice(1).join(' ') || 'Global ban';
        if (!tgtId) return reply('❌ Usage: `×globalban <userID> [reason]`');
        const confirmMsg = await message.channel.send({ embeds: [new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('⚠️ Confirm Global Ban')
            .setDescription(`You are about to ban \`${tgtId}\` from **${client.guilds.cache.size}** servers.\n**Reason:** ${reason}\n\nReact ✅ to confirm or ❌ to cancel.`)
            .setTimestamp().setFooter({ text: 'This action cannot be undone.' })]});
        await confirmMsg.react('✅');
        await confirmMsg.react('❌');
        const filter = (r, u) => ['✅','❌'].includes(r.emoji.name) && u.id === uid;
        const collected = await confirmMsg.awaitReactions({ filter, max: 1, time: 30000 }).catch(() => null);
        const choice = collected?.first()?.emoji?.name;
        await confirmMsg.reactions.removeAll().catch(() => {});
        if (choice !== '✅') return confirmMsg.edit({ embeds: [new EmbedBuilder().setColor(0x808080).setDescription('❌ Global ban cancelled.')] });
        let count = 0;
        for (const [, guild] of client.guilds.cache) { await guild.members.ban(tgtId, { reason }).catch(() => {}); count++; }
        return confirmMsg.edit({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`✅ Banned \`${tgtId}\` from **${count}** servers.`)] });
    }
    if (command === 'globalunban') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        if (!args[0]) return reply('❌ Usage: `×globalunban <userID>`');
        let count = 0;
        for (const [, guild] of client.guilds.cache) { await guild.members.unban(args[0]).catch(() => {}); count++; }
        return reply(`✅ Unbanned \`${args[0]}\` from **${count}** servers.`);
    }
    if (command === 'globalannounce') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        const text = args.join(' ');
        if (!text) return reply('❌ Usage: `×globalannounce <message>`');
        let count = 0;
        for (const [, guild] of client.guilds.cache) {
            const ch = guild.systemChannel || guild.channels.cache.filter(c => c.type === 0 && c.permissionsFor(guild.members.me).has('SendMessages')).first();
            if (ch) { await ch.send({ embeds: [new EmbedBuilder().setColor(0xFF6600).setTitle('📢 Global Announcement').setDescription(text).setTimestamp()] }); count++; }
    }
        return reply(`✅ Announced to **${count}** servers.`);
    }
    if (command === 'globaldm') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        const tgtId = args[0], text = args.slice(1).join(' ');
        if (!tgtId || !text) return reply('❌ Usage: `×globaldm <userID> <message>`');
        const target = await client.users.fetch(tgtId).catch(() => null);
        if (!target) return reply('❌ User not found.');
        await target.send(text).catch(() => {});
        return reply(`✅ DM sent to **${target.tag}**.`);
    }
    if (command === 'massdm') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        const srvId = args[0], text = args.slice(1).join(' ');
        if (!srvId || !text) return reply('❌ Usage: `×massdm <serverID> <message>`');
        const srv = client.guilds.cache.get(srvId);
        if (!srv) return reply('❌ Server not found.');
        await srv.members.fetch();
        const members = [...srv.members.cache.values()].filter(m => !m.user.bot);
        let count = 0;
        const statusMsg = await message.channel.send(`📨 Sending DMs to **${members.length}** members... (0/${members.length})`);
        for (const mem of members) {
            await mem.send(text).catch(() => {});
            count++;
            if (count % 10 === 0) await statusMsg.edit(`📨 Sending DMs... (${count}/${members.length})`).catch(() => {});
            await new Promise(r => setTimeout(r, 1000));
        }
        return statusMsg.edit(`✅ DM sent to **${count}** members in **${srv.name}**.`);
    }
    if (command === 'broadcast') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        const text = args.join(' ');
        if (!text) return reply('❌ Usage: `×broadcast <message>`');
        let count = 0;
        for (const [, srv] of client.guilds.cache) {
            const ch = srv.systemChannel || srv.channels.cache.filter(c => c.type === 0 && c.permissionsFor(srv.members.me).has('SendMessages')).first();
            if (ch) { await ch.send(text).catch(() => {}); count++; }
    }
        return reply(`✅ Broadcast sent to **${count}** servers.`);
    }

    if (command === 'rankaudit') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        if (args[0]) {
        const srv = client.guilds.cache.get(args[0]);
        if (!srv) return reply('❌ Server not found.');
            return reply({ embeds: [buildServerRankEmbed(args[0], srv.name)] });
    }
        return reply({ embeds: [buildGlobalRankEmbed()] });
    }
    if (command === 'rankwipe') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        if (!args[0]) return reply('❌ Usage: `×rankwipe <serverID>`');
        delete botData.enlisted[args[0]];
        markDirty(); scheduleSave();
        return reply(`✅ All enlisted ranks wiped from server \`${args[0]}\`.`);
    }
    if (command === 'globalrankwipe') {
        if (!isFiveStar(uid)) return reply('❌ Owner only.');
        const genCount = Object.keys(botData.generals || {}).length;
        const offCount = Object.keys(botData.officers || {}).length;
        let enlCount = 0;
        for (const g of Object.values(botData.enlisted || {})) enlCount += Object.keys(g).length;
        const confirmMsg = await message.channel.send({ embeds: [new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('⚠️ Confirm Global Rank Wipe')
            .setDescription(`You are about to wipe **ALL ranks globally**:\n\n★ Generals: **${genCount}**\n● Officers: **${offCount}**\n◆ Enlisted: **${enlCount}**\n\nReact ✅ to confirm or ❌ to cancel.`)
            .setTimestamp().setFooter({ text: 'This cannot be undone.' })]});
        await confirmMsg.react('✅');
        await confirmMsg.react('❌');
        const filter = (r, u) => ['✅','❌'].includes(r.emoji.name) && u.id === uid;
        const collected = await confirmMsg.awaitReactions({ filter, max: 1, time: 30000 }).catch(() => null);
        const choice = collected?.first()?.emoji?.name;
        await confirmMsg.reactions.removeAll().catch(() => {});
        if (choice !== '✅') return confirmMsg.edit({ embeds: [new EmbedBuilder().setColor(0x808080).setDescription('❌ Rank wipe cancelled.')] });
        botData.generals = {}; botData.officers = {}; botData.enlisted = {};
        markDirty(); scheduleSave();
        return confirmMsg.edit({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`✅ All ranks globally wiped. (${genCount} generals, ${offCount} officers, ${enlCount} enlisted removed)`)] });
    }
    if (command === 'rankreport') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        const genCount = Object.keys(botData.generals || {}).length;
        const offCount = Object.keys(botData.officers || {}).length;
        let enlCount   = 0;
        for (const g of Object.values(botData.enlisted || {})) enlCount += Object.keys(g).length;
        return reply({ embeds: [new EmbedBuilder().setColor(0xFFD700).setTitle('📊 Global Rank Report')
            .addFields(
                { name: `${SYM_GENERAL} Generals`, value: `${genCount}`, inline: true },
                { name: `${SYM_OFFICER} Officers`,  value: `${offCount}`, inline: true },
                { name: `${SYM_ENLISTED} Enlisted`, value: `${enlCount}`, inline: true },
                { name: '📋 Total Ranked',          value: `${genCount + offCount + enlCount}`, inline: true },
                { name: '🏠 Servers',               value: `${client.guilds.cache.size}`, inline: true }
            ).setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }

    if (command === 'globalstats') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        let totalUsers = 0, totalWarns = 0, totalCases = 0;
        client.guilds.cache.forEach(g => totalUsers += g.memberCount);
        for (const g of Object.values(botData.warnings || {})) for (const w of Object.values(g)) totalWarns += w.length;
        for (const g of Object.values(botData.modlog   || {})) totalCases += g.cases?.length || 0;
        return reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle('📊 Global Stats — SOLDIER²')
            .addFields(
                { name: '🏠 Servers',     value: `${client.guilds.cache.size}`, inline: true },
                { name: '👥 Total Users', value: `${totalUsers}`,               inline: true },
                { name: '⚠️ Warnings',   value: `${totalWarns}`,               inline: true },
                { name: '📋 Cases',       value: `${totalCases}`,               inline: true }
            ).setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }
    if (command === 'topservers') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        const sorted = [...client.guilds.cache.values()].sort((a, b) => b.memberCount - a.memberCount);
        return reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle('🏆 Top Servers by Member Count')
            .setDescription(sorted.slice(0, 20).map((g, i) => `**${i + 1}.** ${g.name} — **${g.memberCount}** members | \`${g.id}\``).join('\n'))
            .setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }
    if (command === 'serverstats') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        const srv = args[0] ? client.guilds.cache.get(args[0]) : message.guild;
        if (!srv) return reply('❌ Server not found.');
        const cases  = botData.modlog?.[srv.id]?.cases?.length || 0;
        let warns    = 0;
        for (const w of Object.values(botData.warnings?.[srv.id] || {})) warns += w.length;
        return reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(`📊 Server Stats — ${srv.name}`)
            .addFields(
                { name: '👥 Members',   value: `${srv.memberCount}`,                   inline: true },
                { name: '📢 Channels',  value: `${srv.channels.cache.size}`,           inline: true },
                { name: '🎭 Roles',     value: `${srv.roles.cache.size}`,              inline: true },
                { name: '⚠️ Warnings', value: `${warns}`,                             inline: true },
                { name: '📋 Cases',     value: `${cases}`,                             inline: true }
            ).setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }

    if (command === 'nuke') {
        if (!isFiveStar(uid) && !isGeneral(uid)) return reply('❌ Generals and Owner only.');
        await reply('⚠️ **NUKE INITIATED** — Kicking all members...');
        await message.guild.members.fetch();
        let count = 0;
        for (const [, mem] of message.guild.members.cache) {
                if (mem.user.bot) continue;
            const check = canAct(uid, mem.user.id, gid);
                if (!check.allowed) continue;
            await mem.kick('Server nuke').catch(() => {});
            count++;
    }
        return message.channel.send(`✅ Nuke complete. **${count}** members removed.`);
    }
    if (command === 'nukeall') {
        if (!isFiveStar(uid)) return reply('❌ Owner only.');
        await reply('⚠️ **GLOBAL NUKE** — Kicking all members from all servers...');
        let total = 0;
        for (const [, srv] of client.guilds.cache) {
            await srv.members.fetch();
            for (const [, mem] of srv.members.cache) {
                if (mem.user.bot) continue;
                const check = canAct(uid, mem.user.id, srv.id);
                if (!check.allowed) continue;
                await mem.kick('Global nuke').catch(() => {});
                total++;
    }
    }
        return message.channel.send(`✅ Global nuke complete. **${total}** members removed.`);
    }
    if (command === 'emergency') {
        if (!isFiveStar(uid)) return reply('❌ Owner only.');
        const srv = client.guilds.cache.get(args[0]);
        if (!srv) return reply('❌ Usage: `×emergency <serverID>`');
        await reply(`🚨 Activating emergency in **${srv.name}**...`);
            for (const [, ch] of srv.channels.cache.filter(c => c.type === 0))
                await ch.permissionOverwrites.edit(srv.roles.everyone, { SendMessages: false }).catch(() => {});
            await srv.members.fetch();
            for (const [, mem] of srv.members.cache)
                if (!mem.user.bot) await mem.timeout(3600000, 'Emergency mode').catch(() => {});
        return message.channel.send(`✅ Emergency active in **${srv.name}**. All locked + members muted 1h.`);
    }
    if (command === 'emergencyoff') {
        if (!isFiveStar(uid)) return reply('❌ Owner only.');
        const srv = client.guilds.cache.get(args[0]);
        if (!srv) return reply('❌ Usage: `×emergencyoff <serverID>`');
            for (const [, ch] of srv.channels.cache.filter(c => c.type === 0))
                await ch.permissionOverwrites.edit(srv.roles.everyone, { SendMessages: null }).catch(() => {});
            await srv.members.fetch();
            for (const [, mem] of srv.members.cache)
                if (!mem.user.bot) await mem.timeout(null).catch(() => {});
        return reply(`✅ Emergency lifted in **${srv.name}**.`);
    }
    if (command === 'emergencyall') {
        if (!isFiveStar(uid)) return reply('❌ Owner only.');
        await reply('🚨 Activating emergency across ALL servers...');
        for (const [, srv] of client.guilds.cache) {
            for (const [, ch] of srv.channels.cache.filter(c => c.type === 0))
                await ch.permissionOverwrites.edit(srv.roles.everyone, { SendMessages: false }).catch(() => {});
            await srv.members.fetch();
            for (const [, mem] of srv.members.cache)
                if (!mem.user.bot) await mem.timeout(3600000, 'Emergency mode').catch(() => {});
    }
        return message.channel.send(`✅ Emergency active in **${client.guilds.cache.size}** servers.`);
    }
    if (command === 'emergencyoffall') {
        if (!isFiveStar(uid)) return reply('❌ Owner only.');
        await reply('🔓 Lifting emergency across ALL servers...');
        for (const [, srv] of client.guilds.cache) {
            for (const [, ch] of srv.channels.cache.filter(c => c.type === 0))
                await ch.permissionOverwrites.edit(srv.roles.everyone, { SendMessages: null }).catch(() => {});
            await srv.members.fetch();
            for (const [, mem] of srv.members.cache)
                if (!mem.user.bot) await mem.timeout(null).catch(() => {});
    }
        return message.channel.send('✅ Emergency lifted in all servers.');
    }

    if (command === 'botstatus') {
        if (!isFiveStar(uid)) return reply('❌ Owner only.');
        const text = args.join(' ');
        if (!text) return reply('❌ Usage: `×botstatus <text>`');
        client.user.setActivity(text);
        return reply(`✅ Status set to **${text}**.`);
    }
    if (command === 'botavatar') {
        if (!isFiveStar(uid)) return reply('❌ Owner only.');
        if (!args[0]) return reply('❌ Usage: `×botavatar <imageURL>`');
        await client.user.setAvatar(args[0]).catch(() => {});
        return reply('✅ Bot avatar updated.');
    }
    if (command === 'botname') {
        if (!isFiveStar(uid)) return reply('❌ Owner only.');
        const name = args.join(' ');
        if (!name) return reply('❌ Usage: `×botname <n>`');
        await client.user.setUsername(name).catch(() => {});
        return reply(`✅ Bot name set to **${name}**.`);
    }
    if (command === 'restart') {
        if (!isFiveStar(uid)) return reply('❌ Owner only.');
        await reply('🔄 Restarting...');
        process.exit(0);
    }
    if (command === 'shutdown') {
        if (!isFiveStar(uid)) return reply('❌ Owner only.');
        await reply('⛔ Shutting down...');
        process.exit(1);
    }
    if (command === 'eval') {
        if (!isFiveStar(uid)) return reply('❌ Owner only.');
        const code = args.join(' ');
        if (!code) return reply('❌ Usage: `×eval <code>`');
        try {
            let result = eval(code);
            if (result instanceof Promise) result = await result;
            return reply(`\`\`\`js\n${String(typeof result === 'object' ? JSON.stringify(result, null, 2) : result).slice(0, 1900)}\n\`\`\``);
        } catch (e) { return reply(`\`\`\`js\nERROR: ${e.message}\n\`\`\``); }
    }
    if (command === 'blacklistuser') {
        if (!isFiveStar(uid)) return reply('❌ Owner only.');
        if (!args[0]) return reply('❌ Usage: `×blacklistuser <userID>`');
        botData.blacklistedUsers[args[0]] = { by: uid, at: Date.now() };
        markDirty(); scheduleSave();
        return reply(`✅ User \`${args[0]}\` blacklisted.`);
    }
    if (command === 'unblacklistuser') {
        if (!isFiveStar(uid)) return reply('❌ Owner only.');
        if (!args[0]) return reply('❌ Usage: `×unblacklistuser <userID>`');
        delete botData.blacklistedUsers[args[0]];
        markDirty(); scheduleSave();
        return reply(`✅ User \`${args[0]}\` removed from blacklist.`);
    }
    if (command === 'blacklistserver') {
        if (!isFiveStar(uid)) return reply('❌ Owner only.');
        if (!args[0]) return reply('❌ Usage: `×blacklistserver <serverID>`');
        botData.blacklistedServers[args[0]] = { by: uid, at: Date.now() };
        markDirty(); scheduleSave();
        return reply(`✅ Server \`${args[0]}\` blacklisted.`);
    }
    if (command === 'unblacklistserver') {
        if (!isFiveStar(uid)) return reply('❌ Owner only.');
        if (!args[0]) return reply('❌ Usage: `×unblacklistserver <serverID>`');
        delete botData.blacklistedServers[args[0]];
        markDirty(); scheduleSave();
        return reply(`✅ Server \`${args[0]}\` removed from blacklist.`);
    }
    if (command === 'blacklistedlist') {
        if (!isFiveStar(uid)) return reply('❌ Owner only.');
        const users   = Object.keys(botData.blacklistedUsers   || {});
        const servers = Object.keys(botData.blacklistedServers || {});
        return reply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setTitle('🚫 Blacklist')
            .addFields(
                { name: `👤 Users (${users.length})`,     value: users.length   ? users.map(id => `\`${id}\``).join('\n')   : '*(none)*', inline: false },
                { name: `🏠 Servers (${servers.length})`, value: servers.length ? servers.map(id => `\`${id}\``).join('\n') : '*(none)*', inline: false }
            ).setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }

    //CONFIG\\

    if (command === 'setprefix') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild) && !isFiveStar(uid))
            return reply('❌ You need **Manage Server** permission.');
        if (!args[0]) return reply('❌ Usage: `×setprefix <prefix>`');
        botData.serverPrefixes[gid] = args[0];
        markDirty(); scheduleSave();
        return reply(`✅ Prefix changed to \`${args[0]}\` for this server.`);
    }
    if (command === 'settings') {
        if (!isStaff(gid, uid) && !isFiveStar(uid)) return reply('❌ No permission.');
        const am   = botData.automod?.[gid] || {};
        return reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(`⚙️ Settings — ${message.guild.name}`)
            .addFields(
                { name: '⌨️ Prefix',       value: getPrefix(gid),                                        inline: true },
                { name: '📋 Log Channel',  value: botData.logChannels?.[gid]  ? `<#${botData.logChannels[gid]}>`  : 'Not set', inline: true },
                { name: '🔇 Mute Role',    value: botData.mutedRoles?.[gid]   ? `<@&${botData.mutedRoles[gid]}>`  : 'Not set', inline: true },
                { name: '✅ Verify Role',  value: botData.verifyRoles?.[gid]  ? `<@&${botData.verifyRoles[gid]}>` : 'Not set', inline: true },
                { name: '🤖 Automod',      value: am.automod    !== false ? '✅ On' : '❌ Off',                    inline: true },
                { name: '🔗 Anti-Link',    value: am.antilink   ? '✅ On' : '❌ Off',                              inline: true },
                { name: '🚨 Anti-Raid',    value: am.antiraid   ? '✅ On' : '❌ Off',                              inline: true },
                { name: '📢 Anti-Spam',    value: am.antispam   ? '✅ On' : '❌ Off',                              inline: true },
                { name: '🔠 Anti-Caps',    value: am.anticaps   ? `✅ ${am.capsPercent || 70}%`    : '❌ Off',     inline: true },
                { name: '😀 Anti-Emoji',   value: am.antiemoji  ? `✅ Max ${am.emojiLimit || 10}`  : '❌ Off',     inline: true },
                { name: '📣 Anti-Mention', value: am.antimentions ? `✅ Max ${am.mentionLimit || 5}` : '❌ Off',   inline: true },
                { name: '🚫 Bad Words',    value: `${am.badwords?.length || 0} words`,                            inline: true }
            ).setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }
    if (command === 'disable') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild) && !isFiveStar(uid))
            return reply('❌ You need **Manage Server** permission.');
        const cmd = args[0]?.toLowerCase();
        if (!cmd) return reply('❌ Usage: `×disable <command>`');
        if (!botData.disabledCommands[gid]) botData.disabledCommands[gid] = [];
        if (!botData.disabledCommands[gid].includes(cmd)) botData.disabledCommands[gid].push(cmd);
        markDirty(); scheduleSave();
        return reply(`✅ Command \`${cmd}\` disabled.`);
    }
    if (command === 'enable') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild) && !isFiveStar(uid))
            return reply('❌ You need **Manage Server** permission.');
        const cmd = args[0]?.toLowerCase();
        if (!cmd) return reply('❌ Usage: `×enable <command>`');
        if (botData.disabledCommands[gid])
            botData.disabledCommands[gid] = botData.disabledCommands[gid].filter(c => c !== cmd);
        markDirty(); scheduleSave();
        return reply(`✅ Command \`${cmd}\` re-enabled.`);
    }
//JSONBIN\\
    if (command === 'forcesave') {
        if (!isFiveStar(uid) && !isGeneral(uid) && !isOfficer(uid)) return reply('❌ No permission.');
        const confirmMsg = await message.channel.send({ embeds: [new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('💾 Confirm Force Save')
            .setDescription('This will immediately save all bot data to JSONBin.\n\nReact ✅ to confirm or ❌ to cancel.')
            .setTimestamp().setFooter({ text: 'SOLDIER²' })]});
        await confirmMsg.react('✅');
        await confirmMsg.react('❌');
        const filter = (r, u) => ['✅','❌'].includes(r.emoji.name) && u.id === uid;
        const collected = await confirmMsg.awaitReactions({ filter, max: 1, time: 30000 }).catch(() => null);
        const choice = collected?.first()?.emoji?.name;
        await confirmMsg.reactions.removeAll().catch(() => {});
        if (choice !== '✅') return confirmMsg.edit({ embeds: [new EmbedBuilder().setColor(0x808080).setDescription('❌ Force save cancelled.')] });
        const result = await forceSaveNow();
        if (!result.success) return confirmMsg.edit({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription('❌ Force save failed. Check logs.')] });
        return confirmMsg.edit({ embeds: [new EmbedBuilder()
            .setColor(0x2ECC71)
            .setTitle('💾 Force Save Complete')
            .addFields(
                { name: '👤 Executed By',  value: `<@${uid}> (\`${uid}\`)`,         inline: true },
                { name: '🏠 Server',       value: `${message.guild.name} (\`${gid}\`)`, inline: true },
                { name: '📦 Data Size',    value: `${result.kb} KB`,                inline: true },
                { name: '🕐 Timestamp',    value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
            ).setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }

    if (command === 'cleanjson') {
        if (!isFiveStar(uid) && !isGeneral(uid) && !isOfficer(uid)) return reply('❌ No permission.');
        const cooldownCount  = Object.values(botData.xpCooldowns  || {}).reduce((a, g) => a + Object.keys(g).length, 0);
        const logCount       = Object.values(botData.commandLog    || {}).reduce((a, g) => a + g.length, 0);
        const dutyCount      = Object.values(botData.dutyStatus    || {}).reduce((a, g) => a + Object.keys(g).length, 0);
        const raidCount      = Object.keys(botData.antiraidSnapshot || {}).length;
        const confirmMsg = await message.channel.send({ embeds: [new EmbedBuilder()
            .setColor(0xE67E22)
            .setTitle('🧹 Confirm JSON Cleanup')
            .setDescription('The following junk data will be permanently stripped from JSONBin:')
            .addFields(
                { name: '⏱️ XP Cooldowns',       value: `${cooldownCount} entries`,  inline: true },
                { name: '📋 Command Logs',        value: `${logCount} entries`,       inline: true },
                { name: '🟢 Duty Statuses',       value: `${dutyCount} entries`,      inline: true },
                { name: '🚨 Antiraid Snapshots',  value: `${raidCount} entries`,      inline: true }
            )
            .setDescription('The following junk data will be permanently stripped.\n\nReact ✅ to confirm or ❌ to cancel.')
            .setTimestamp().setFooter({ text: 'This cannot be undone.' })]});
        await confirmMsg.react('✅');
        await confirmMsg.react('❌');
        const filter = (r, u) => ['✅','❌'].includes(r.emoji.name) && u.id === uid;
        const collected = await confirmMsg.awaitReactions({ filter, max: 1, time: 30000 }).catch(() => null);
        const choice = collected?.first()?.emoji?.name;
        await confirmMsg.reactions.removeAll().catch(() => {});
        if (choice !== '✅') return confirmMsg.edit({ embeds: [new EmbedBuilder().setColor(0x808080).setDescription('❌ Cleanup cancelled.')] });
        botData.xpCooldowns      = {};
        botData.commandLog       = {};
        botData.dutyStatus       = {};
        botData.antiraidSnapshot = {};
        const result = await forceSaveNow();
        if (!result.success) return confirmMsg.edit({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription('❌ Cleanup save failed. Check logs.')] });
        return confirmMsg.edit({ embeds: [new EmbedBuilder()
            .setColor(0x2ECC71)
            .setTitle('🧹 JSON Cleanup Complete')
            .addFields(
                { name: '👤 Executed By',   value: `<@${uid}> (\`${uid}\`)`,              inline: true },
                { name: '🏠 Server',        value: `${message.guild.name} (\`${gid}\`)`,  inline: true },
                { name: '📦 New Size',      value: `${result.kb} KB`,                     inline: true },
                { name: '🗑️ Removed',      value: `XP cooldowns, command logs, duty statuses, antiraid snapshots`, inline: false },
                { name: '🕐 Timestamp',     value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
            ).setTimestamp().setFooter({ text: 'SOLDIER²' })] });
    }
    
    //classified — Service links for bot infrastructure\\
    if (command === 'classified') {
        if (!isFiveStar(uid) && !isGeneral(uid))
            return reply('❌ This command is restricted to Generals and above.');

        const embed = new EmbedBuilder()
            .setColor(0x2C3E50)
            .setTitle('🔒 CLASSIFIED — Bot Infrastructure')
            .setDescription('*All services used to keep SOLDIER² online and operational.*')
            .addFields(
                { name: '🤖 Google Gemini AI', value: '[aistudio.google.com](https://aistudio.google.com)\nProvides the AI engine. Manage API keys and monitor usage quota here.', inline: false },
                { name: '🖥️ Render', value: '[render.com/dashboard](https://dashboard.render.com)\nHosts the bot 24/7. Use this to deploy updates, view logs, and manage environment variables.', inline: false },
                { name: '🐙 GitHub', value: '[github.com](https://github.com)\nStores the bot\'s source code. Push new files here to trigger a Render redeploy.', inline: false },
                { name: '⏱️ UptimeRobot', value: '[uptimerobot.com/dashboard](https://uptimerobot.com/dashboard)\nPings the bot every 5 minutes to prevent Render free tier from sleeping.', inline: false },
                { name: '🗄️ JSONBin', value: '[jsonbin.io](https://jsonbin.io)\nCloud storage for all bot data — ranks, warnings, settings, coins, XP. Never lose data on restart.', inline: false },
            )
            .setFooter({ text: 'SOLDIER² — Generals+ only • Keep these links secure' })
            .setTimestamp();

        return reply({ embeds: [embed] });
    }
    
    //aistatus — Gemini AI status & memory info\\
    if (command === 'aistatus') {
        const userMemory = aiMemory.get(uid) || [];
        const exchanges  = Math.floor(userMemory.length / 2);
        const hasKey     = !!process.env.GEMINI_API_KEY;

        let statusText = '🟢 **Online** — Ready to respond';
        if (!hasKey) statusText = '🔴 **Offline** — No API key set';

        const embed = new EmbedBuilder()
            .setColor(hasKey ? 0x4285F4 : 0xe74c3c)
            .setTitle('🤖 SOLDIER² — AI Status')
            .addFields(
                { name: '📡 Status',       value: statusText,                                      inline: false },
                { name: '🧠 Model',        value: '`gemini-1.5-flash` (Free Tier)',                inline: true  },
                { name: '📝 Max Tokens',   value: '150 per response',                              inline: true  },
                { name: '💾 Your Memory',  value: `${exchanges}/${AI_MEMORY_LIMIT} exchanges stored`, inline: true },
                { name: '🔁 Memory Reset', value: 'Auto-clears after 4 exchanges',                 inline: true  },
                { name: '⚡ Trigger',      value: `Mention the bot: <@${client.user.id}> question`, inline: false },
                { name: '📊 Outage Info',  value: '[Google AI Status](https://status.cloud.google.com)', inline: true },
            )
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: 'SOLDIER² AI • Powered by Google Gemini' })
            .setTimestamp();

        return reply({ embeds: [embed] });
    }
    if (command === 'ping') {
        const loadingEmbed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('📡 Pinging...')
            .setThumbnail('https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif') // REPLACE — loading gif 1 (thumbnail)
            .setImage('https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif')     // REPLACE — loading gif 2 (banner)
            .setDescription('Measuring latency...')
            .setTimestamp();
        const sent = await message.channel.send({ embeds: [loadingEmbed] });

        const apiLatency  = Math.round(client.ws.ping);
        const roundTrip   = sent.createdTimestamp - message.createdTimestamp;

        let color, label, indicator;
        if (apiLatency < 100) {
            color = 0x2ECC71; label = 'Excellent'; indicator = '🟢';
        } else if (apiLatency < 200) {
            color = 0xF1C40F; label = 'Moderate'; indicator = '🟡';
        } else {
            color = 0xE74C3C; label = 'Poor'; indicator = '🔴';
        }

        const resultEmbed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`${indicator} SOLDIER² — Ping Results`)
            .setThumbnail('https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif') // REPLACE — result gif 1 (thumbnail)
            .setImage('https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif')     // REPLACE — result gif 2 (banner)
            .addFields(
                { name: '🏓 API Latency',     value: `\`${apiLatency}ms\``,   inline: true },
                { name: '↩️ Round Trip',      value: `\`${roundTrip}ms\``,    inline: true },
                { name: '📶 Status',          value: `${indicator} **${label}**`, inline: true },
                { name: '🏠 Servers',         value: `${client.guilds.cache.size}`,            inline: true },
                { name: '👥 Users',           value: `${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}`, inline: true },
                { name: '⏱️ Uptime',          value: (() => { const s = Math.floor(process.uptime()); const h = Math.floor(s/3600); const m = Math.floor((s%3600)/60); const sec = s%60; return `${h}h ${m}m ${sec}s`; })(), inline: true },
                { name: '💾 Memory',          value: `${(process.memoryUsage().heapUsed/1024/1024).toFixed(2)} MB`, inline: true },
                { name: '📅 Checked At',      value: `<t:${Math.floor(Date.now()/1000)}:F>`,  inline: true },
                { name: '🖥️ Server',          value: message.guild.name,                      inline: true }
            )
            .setFooter({ text: `SOLDIER² • ${label} Connection` })
            .setTimestamp();

        return sent.edit({ embeds: [resultEmbed] });
    }
    // ×xpcard
    if (command === 'xpcard') {
        const target = message.mentions.users.first() || message.author;
        const xpData = getUserXPData(isGlobalXPUser(target.id) ? 'GLOBAL' : gid, target.id);
        const balance = getUserBalance(target.id);
        const level = xpData.level || 1;
        const prestige = xpData.prestige || 0;
        const currentXP = xpData.xp || 0;
        const xpNeeded = XP_PER_LEVEL;
        const progress = Math.min(currentXP / xpNeeded, 1);

        let rankTitle = 'Civilian';
        if (target.id === OWNER_ID) rankTitle = 'FIVE STAR GENERAL';
        else if (getGeneralRank(target.id)) rankTitle = getGeneralRank(target.id);
        else if (getOfficerRank(target.id)) rankTitle = getOfficerRank(target.id);
        else if (getEnlistedRank(gid, target.id)) rankTitle = getEnlistedRank(gid, target.id);

        const cardCfg = botData.cardSettings?.[target.id] || {};
        const accent = cardCfg.accent || '#5865F2';
        const bgName = cardCfg.bg || 'default';

        const BG_COLORS = {
            default:['#1a1a2e','#16213e'], military:['#2d4a1e','#1a2e0f'],
            midnight:['#0a0a0a','#1a1a3e'], sunset:['#3d1c02','#6b2d00'],
            ocean:['#001a33','#003366'], crimson:['#2e0000','#5c0000'],
            forest:['#0d2e0d','#1a4a1a'], gold:['#2e2200','#5c4400'],
            arctic:['#0d1f2e','#1a3a4a'], void:['#050505','#0f0f0f'],
            cod:['#0a0a0a','#1a0f00'], fallout:['#1a1200','#2e2000'],
            battlefield:['#0a0f1a','#1a2030'], pokemon:['#1a0000','#2e0000'],
            neon:['#0a0a1a','#000a1a'], hacker:['#000a00','#001400'],
            kawaii:['#2e0a2e','#1a0a2e'],
        };

        const colors = BG_COLORS[bgName] || BG_COLORS.default;
        const W = 700, H = 220;
        const canvas = createCanvas(W, H);
        const ctx = canvas.getContext('2d');

        // Base gradient
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, colors[0]);
        bgGrad.addColorStop(1, colors[1]);
        ctx.fillStyle = bgGrad;
        ctx.beginPath(); ctx.roundRect(0, 0, W, H, 20); ctx.fill();

        // Theme overlays
        if (bgName === 'cod') {
            ctx.globalAlpha = 0.18;
            for (let i = 0; i < 60; i++) {
                ctx.fillStyle = ['#3a2a00','#2a1a00','#4a3a10','#1a1000'][i%4];
                ctx.beginPath();
                ctx.ellipse(Math.random()*W, Math.random()*H, 20+Math.random()*30, 10+Math.random()*15, Math.random()*Math.PI, 0, Math.PI*2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgba(255,80,0,0.25)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(W*0.75, H*0.1); ctx.lineTo(W*0.75, H*0.9); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(W*0.6, H*0.5); ctx.lineTo(W*0.9, H*0.5); ctx.stroke();
            ctx.beginPath(); ctx.arc(W*0.75, H*0.5, 30, 0, Math.PI*2); ctx.stroke();
            ctx.globalAlpha = 0.06; ctx.fillStyle = '#ff6600'; ctx.font = 'bold 80px sans-serif'; ctx.textAlign = 'right';
            ctx.fillText('MW2', W-20, H-10); ctx.globalAlpha = 1;
        }
        if (bgName === 'fallout') {
            ctx.globalAlpha = 0.08;
            for (let y = 0; y < H; y += 4) { ctx.fillStyle = '#aaff00'; ctx.fillRect(0, y, W, 2); }
            ctx.globalAlpha = 1;
            ctx.globalAlpha = 0.12; ctx.fillStyle = '#aaff00';
            ctx.font = 'bold 120px sans-serif'; ctx.textAlign = 'right';
            ctx.fillText('☢', W-10, H+10); ctx.globalAlpha = 1;
            const vg = ctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H*1.2);
            vg.addColorStop(0, 'transparent'); vg.addColorStop(1, 'rgba(0,80,0,0.5)');
            ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
        }
        if (bgName === 'battlefield') {
            const sg = ctx.createRadialGradient(W*0.3, H*0.4, 10, W*0.3, H*0.4, 200);
            sg.addColorStop(0, 'rgba(180,120,60,0.25)'); sg.addColorStop(1, 'transparent');
            ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
            const sg2 = ctx.createRadialGradient(W*0.75, H*0.6, 5, W*0.75, H*0.6, 150);
            sg2.addColorStop(0, 'rgba(200,100,30,0.2)'); sg2.addColorStop(1, 'transparent');
            ctx.fillStyle = sg2; ctx.fillRect(0, 0, W, H);
            ctx.strokeStyle = 'rgba(100,150,200,0.08)'; ctx.lineWidth = 1;
            for (let hx = 0; hx < W; hx += 40) {
                for (let hy = 0; hy < H; hy += 35) {
                    const ox = (hy/35)%2===0?0:20;
                    ctx.beginPath();
                    for (let a = 0; a < 6; a++) {
                        const ax = hx+ox+18*Math.cos(a*Math.PI/3), ay = hy+18*Math.sin(a*Math.PI/3);
                        a===0?ctx.moveTo(ax,ay):ctx.lineTo(ax,ay);
                    }
                    ctx.closePath(); ctx.stroke();
                }
            }
            ctx.globalAlpha = 0.05; ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 70px sans-serif'; ctx.textAlign = 'right';
            ctx.fillText('BF', W-15, H-10); ctx.globalAlpha = 1;
        }
        if (bgName === 'pokemon') {
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#cc0000'; ctx.beginPath(); ctx.arc(W-80, H/2, 90, Math.PI, 0); ctx.fill();
            ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(W-80, H/2, 90, 0, Math.PI); ctx.fill();
            ctx.strokeStyle = '#000000'; ctx.lineWidth = 6;
            ctx.beginPath(); ctx.arc(W-80, H/2, 90, 0, Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(W-170, H/2); ctx.lineTo(W+10, H/2); ctx.stroke();
            ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(W-80, H/2, 22, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#000000'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(W-80, H/2, 22, 0, Math.PI*2); ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.fillStyle = 'rgba(255,220,0,0.6)';
            for (let i = 0; i < 15; i++) {
                const sx = 30+Math.random()*400, sy = Math.random()*H;
                ctx.beginPath(); ctx.arc(sx, sy, 1+Math.random()*3, 0, Math.PI*2); ctx.fill();
            }
        }
        if (bgName === 'neon') {
            ctx.strokeStyle = 'rgba(0,255,255,0.08)'; ctx.lineWidth = 1;
            for (let gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke(); }
            for (let gy = 0; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke(); }
            const neonColors = ['#ff00ff','#00ffff','#ff0099','#00ff99'];
            for (let i = 0; i < 6; i++) {
                const nc = neonColors[i%4];
                const nx = 100+Math.random()*500, ny = Math.random()*H, nr = 15+Math.random()*40;
                const ng = ctx.createRadialGradient(nx,ny,0,nx,ny,nr);
                ng.addColorStop(0, nc+'55'); ng.addColorStop(1, 'transparent');
                ctx.fillStyle = ng; ctx.fillRect(0,0,W,H);
                ctx.strokeStyle = nc+'44'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.arc(nx,ny,nr,0,Math.PI*2); ctx.stroke();
            }
            ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 20;
            ctx.globalAlpha = 0.1; ctx.fillStyle = '#ff00ff';
            ctx.font = 'bold 60px sans-serif'; ctx.textAlign = 'right';
            ctx.fillText('NEON', W-15, H-10);
            ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        }
        if (bgName === 'hacker') {
            ctx.fillStyle = '#00ff00'; ctx.font = '11px monospace'; ctx.textAlign = 'left';
            const chars = '01アイウエオカキクケコ';
            for (let col = 0; col < W; col += 14) {
                const colLen = 3+Math.floor(Math.random()*8);
                for (let row = 0; row < colLen; row++) {
                    ctx.globalAlpha = (colLen-row)/colLen*0.35;
                    ctx.fillText(chars[Math.floor(Math.random()*chars.length)], col, (row*14)+Math.floor(Math.random()*H));
                }
            }
            ctx.globalAlpha = 1;
            ctx.fillStyle = 'rgba(0,255,0,0.04)';
            for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
            ctx.shadowColor = '#00ff00'; ctx.shadowBlur = 15;
            ctx.globalAlpha = 0.07; ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 55px monospace'; ctx.textAlign = 'right';
            ctx.fillText('</>', W-15, H-10);
            ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        }
        if (bgName === 'kawaii') {
            const kawaiiColors = ['#ff99cc','#ffccee','#cc99ff','#99ccff','#ffff99'];
            for (let i = 0; i < 25; i++) {
                ctx.globalAlpha = 0.25+Math.random()*0.3;
                ctx.fillStyle = kawaiiColors[i%5];
                ctx.font = `${14+Math.floor(Math.random()*22)}px sans-serif`;
                ctx.textAlign = 'left';
                ctx.fillText(['⭐','💖','✨','🌸','💕','🎀','🌙'][i%7], Math.random()*W, Math.random()*H);
            }
            ctx.globalAlpha = 1;
            const kg = ctx.createRadialGradient(W*0.5, H*0.5, 20, W*0.5, H*0.5, H);
            kg.addColorStop(0, 'rgba(255,150,200,0.15)'); kg.addColorStop(1, 'transparent');
            ctx.fillStyle = kg; ctx.fillRect(0, 0, W, H);
        }

        // Accent border
        ctx.strokeStyle = accent; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(1, 1, W-2, H-2, 20); ctx.stroke();

        // Avatar
        try {
            const avatarURL = target.displayAvatarURL({ extension: 'png', size: 128 });
            const avatar = await loadImage(avatarURL);
            ctx.save();
            ctx.beginPath(); ctx.arc(90, H/2, 65, 0, Math.PI*2); ctx.clip();
            ctx.drawImage(avatar, 25, H/2-65, 130, 130);
            ctx.restore();
            ctx.strokeStyle = accent; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(90, H/2, 67, 0, Math.PI*2); ctx.stroke();
        } catch {}

        if (prestige > 0) {
            ctx.fillStyle = '#FFD700'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(`${PRESTIGE_SYMBOL} Prestige ${prestige}`, 90, H/2+85);
        }

        // Username
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(target.username, 175, 60);

        // Rank
        const cleanRank = rankTitle.replace(/[★◆●]/g, '').trim();
        ctx.fillStyle = accent; ctx.font = '15px sans-serif';
        ctx.fillText(cleanRank, 175, 85);

        // Level & XP
        ctx.fillStyle = '#cccccc'; ctx.font = '14px sans-serif';
        ctx.fillText(`Level ${level}   •   ${currentXP.toLocaleString()} / ${xpNeeded.toLocaleString()} XP`, 175, 112);

        // Balance
        ctx.fillStyle = '#FFD700'; ctx.font = '14px sans-serif';
        ctx.fillText(`​☉ ${balance.toLocaleString()} coins`, 175, 135);

        // XP bar background
        ctx.fillStyle = '#333333';
        ctx.beginPath(); ctx.roundRect(175, 150, 480, 22, 11); ctx.fill();

        // XP bar fill
        const barFill = Math.max(10, Math.floor(480*progress));
        const barGrad = ctx.createLinearGradient(175, 0, 175+barFill, 0);
        barGrad.addColorStop(0, accent); barGrad.addColorStop(1, '#ffffff');
        ctx.fillStyle = barGrad;
        ctx.beginPath(); ctx.roundRect(175, 150, barFill, 22, 11); ctx.fill();

        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(progress*100)}%`, 175+barFill/2, 166);

        // Server rank
        const allXP = Object.entries(botData.xp?.[gid] || {}).sort((a,b)=>(b[1].xp||0)-(a[1].xp||0));
        const serverRank = allXP.findIndex(([id])=>id===target.id)+1;
        ctx.fillStyle = '#aaaaaa'; ctx.font = '13px sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(`Server Rank #${serverRank||'?'}`, W-20, H-15);

        ctx.fillStyle = '#555555'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`bg: ${bgName}`, 175, H-15);

        const att = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'xpcard.png' });
        return message.channel.send({ files: [att] });
    }

    // ×backgrounds
    if (command === 'backgrounds') {
        const ALL_BGS = [
            { name:'default',     price:0,     emoji:'🌌', desc:'Dark navy' },
            { name:'military',    price:2000,  emoji:'🪖', desc:'Tactical green' },
            { name:'midnight',    price:2000,  emoji:'🌑', desc:'Pure black' },
            { name:'sunset',      price:3000,  emoji:'🌅', desc:'Burnt orange' },
            { name:'ocean',       price:3000,  emoji:'🌊', desc:'Deep blue' },
            { name:'crimson',     price:4000,  emoji:'🔴', desc:'Dark red' },
            { name:'forest',      price:4000,  emoji:'🌲', desc:'Deep green' },
            { name:'gold',        price:5000,  emoji:'✨', desc:'Golden dark' },
            { name:'arctic',      price:5000,  emoji:'❄️', desc:'Icy blue' },
            { name:'void',        price:8000,  emoji:'⚫', desc:'Pure void' },
            { name:'warrior',         price:6000,  emoji:'🔫', desc:'COD MW2 camo' },
            { name:'fallout',     price:6000,  emoji:'☢️', desc:'Fallout wasteland' },
            { name:'battle', price:6000,  emoji:'💥', desc:'Battlefield smoke' },
            { name:'pokemon',     price:5000,  emoji:'⚡', desc:'Pokémon trainer' },
            { name:'neon',        price:7000,  emoji:'🌈', desc:'Neon city' },
            { name:'hacker',      price:7000,  emoji:'💻', desc:'Matrix hacker' },
            { name:'Kawaii',      price:5000,  emoji:'🌸', desc:'Cute kawaii' },
        ];
        const owned = botData.cardSettings?.[uid]?.ownedBgs || ['default'];
        const current = botData.cardSettings?.[uid]?.bg || 'default';
        const balance = getUserBalance(uid);
        const COLS = 3, CARD_W = 200, CARD_H = 100, PAD = 12;
        const ROWS = Math.ceil(ALL_BGS.length / COLS);
        const CW = COLS*CARD_W+(COLS+1)*PAD;
        const CH = ROWS*CARD_H+(ROWS+1)*PAD+40;
        const canvas = createCanvas(CW, CH);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0d0d0d'; ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('🎨 XP Card Backgrounds', CW/2, 28);
        const BG_COLORS = {
            default:['#1a1a2e','#16213e'], military:['#2d4a1e','#1a2e0f'],
            midnight:['#0a0a0a','#1a1a3e'], sunset:['#3d1c02','#6b2d00'],
            ocean:['#001a33','#003366'], crimson:['#2e0000','#5c0000'],
            forest:['#0d2e0d','#1a4a1a'], gold:['#2e2200','#5c4400'],
            arctic:['#0d1f2e','#1a3a4a'], void:['#050505','#0f0f0f'],
            cod:['#0a0a0a','#1a0f00'], fallout:['#1a1200','#2e2000'],
            battlefield:['#0a0f1a','#1a2030'], pokemon:['#1a0000','#2e0000'],
            neon:['#0a0a1a','#000a1a'], hacker:['#000a00','#001400'],
            kawaii:['#2e0a2e','#1a0a2e'],
        };
        for (let i = 0; i < ALL_BGS.length; i++) {
            const b = ALL_BGS[i];
            const col = i%COLS, row = Math.floor(i/COLS);
            const x = PAD+col*(CARD_W+PAD), y = 40+PAD+row*(CARD_H+PAD);
            const isOwned = owned.includes(b.name), isActive = current===b.name;
            const colors = BG_COLORS[b.name]||BG_COLORS.default;
            const g = ctx.createLinearGradient(x,y,x+CARD_W,y+CARD_H);
            g.addColorStop(0,colors[0]); g.addColorStop(1,colors[1]);
            ctx.fillStyle=g; ctx.beginPath(); ctx.roundRect(x,y,CARD_W,CARD_H,8); ctx.fill();
            if (b.name==='cod') {
                ctx.globalAlpha=0.2;
                for(let ci=0;ci<12;ci++){ctx.fillStyle=['#3a2a00','#4a3a10'][ci%2];ctx.beginPath();ctx.ellipse(x+Math.random()*CARD_W,y+Math.random()*CARD_H,15,7,Math.random()*Math.PI,0,Math.PI*2);ctx.fill();}
                ctx.globalAlpha=1;
            }
            if (b.name==='fallout') {
                ctx.globalAlpha=0.12;
                for(let fi=0;fi<CARD_H;fi+=4){ctx.fillStyle='#aaff00';ctx.fillRect(x,y+fi,CARD_W,1);}
                ctx.globalAlpha=0.15;ctx.fillStyle='#aaff00';ctx.font='40px sans-serif';ctx.textAlign='center';
                ctx.fillText('☢',x+CARD_W-25,y+CARD_H-5);ctx.globalAlpha=1;
            }
            if (b.name==='battlefield') {
                const sg=ctx.createRadialGradient(x+CARD_W*0.4,y+CARD_H*0.5,5,x+CARD_W*0.4,y+CARD_H*0.5,60);
                sg.addColorStop(0,'rgba(180,120,60,0.3)');sg.addColorStop(1,'transparent');
                ctx.fillStyle=sg;ctx.fillRect(x,y,CARD_W,CARD_H);
            }
            if (b.name==='pokemon') {
                ctx.globalAlpha=0.2;
                ctx.fillStyle='#cc0000';ctx.beginPath();ctx.arc(x+CARD_W-25,y+CARD_H/2,28,Math.PI,0);ctx.fill();
                ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(x+CARD_W-25,y+CARD_H/2,28,0,Math.PI);ctx.fill();
                ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x+CARD_W-25,y+CARD_H/2,28,0,Math.PI*2);ctx.stroke();
                ctx.beginPath();ctx.moveTo(x+CARD_W-53,y+CARD_H/2);ctx.lineTo(x+CARD_W+3,y+CARD_H/2);ctx.stroke();
                ctx.globalAlpha=1;
            }
            if (b.name==='neon') {
                const nc=['#ff00ff','#00ffff','#ff0099'];
                for(let ni=0;ni<3;ni++){const ng=ctx.createRadialGradient(x+40+ni*50,y+CARD_H/2,3,x+40+ni*50,y+CARD_H/2,25);ng.addColorStop(0,nc[ni]+'66');ng.addColorStop(1,'transparent');ctx.fillStyle=ng;ctx.fillRect(x,y,CARD_W,CARD_H);}
            }
            if (b.name==='hacker') {
                ctx.fillStyle='#00ff00';ctx.font='9px monospace';ctx.textAlign='left';ctx.globalAlpha=0.3;
                const ch='01アイウ';
                for(let hi=0;hi<8;hi++){ctx.fillText(ch[Math.floor(Math.random()*ch.length)],x+hi*24,y+20+Math.random()*60);}
                ctx.globalAlpha=1;
            }
            if (b.name==='kawaii') {
                ctx.globalAlpha=0.3;ctx.font='16px sans-serif';ctx.textAlign='left';
                ['💖','🌸','✨','⭐','🎀'].forEach((e,ei)=>{ctx.fillText(e,x+10+ei*35,y+30+Math.random()*40);});
                ctx.globalAlpha=1;
            }
            if (isActive) { ctx.strokeStyle='#FFD700';ctx.lineWidth=3; }
            else if (isOwned) { ctx.strokeStyle='#00cc44';ctx.lineWidth=2; }
            else { ctx.strokeStyle='#444444';ctx.lineWidth=1; }
            ctx.beginPath();ctx.roundRect(x,y,CARD_W,CARD_H,8);ctx.stroke();
            if (!isOwned) {
                ctx.fillStyle='rgba(0,0,0,0.45)';ctx.beginPath();ctx.roundRect(x,y,CARD_W,CARD_H,8);ctx.fill();
                ctx.fillStyle='rgba(255,255,255,0.5)';ctx.font='22px sans-serif';ctx.textAlign='center';
                ctx.fillText('🔒',x+CARD_W/2,y+CARD_H/2+8);
            }
            ctx.fillStyle='rgba(0,0,0,0.65)';ctx.beginPath();ctx.roundRect(x,y+CARD_H-28,CARD_W,28,[0,0,8,8]);ctx.fill();
            ctx.fillStyle='#ffffff';ctx.font='bold 11px sans-serif';ctx.textAlign='left';
            ctx.fillText(`${b.emoji} ${b.name}${isActive?' ✓':''}`,x+6,y+CARD_H-10);
            ctx.fillStyle=isOwned?'#00cc44':'#ffaa00';ctx.font='11px sans-serif';ctx.textAlign='right';
            ctx.fillText(isOwned?'owned':`${b.price.toLocaleString()}​☉`,x+CARD_W-6,y+CARD_H-10);
        }
        const att = new AttachmentBuilder(canvas.toBuffer('image/png'),{name:'backgrounds.png'});
        return message.channel.send({ embeds:[new EmbedBuilder()
            .setColor(0x5865F2).setTitle('🎨 XP Card Backgrounds')
            .setDescription(`✅ green border = owned  |  🔒 = locked  |  ✓ = active\n\n\`×buybg <name>\` — Purchase\n\`×setbg <name>\` — Equip\n\`×setaccent <#hex>\` — Change accent color`)
            .setImage('attachment://backgrounds.png')
            .setFooter({text:`Your balance: ${balance.toLocaleString()} ​☉`})
        ], files:[att] });
    }

    // ×buybg
    if (command === 'buybg') {
        const bgName = args[0]?.toLowerCase();
        const PRICES = { default:0, military:2000, midnight:2000, sunset:3000, ocean:3000, crimson:4000, forest:4000, gold:5000, arctic:5000, void:8000, cod:6000, fallout:6000, battlefield:6000, pokemon:5000, neon:7000, hacker:7000, kawaii:5000 };
        if (!bgName || !(bgName in PRICES)) return reply('❌ Invalid background. Use `×backgrounds` to see all options.');
        if (!botData.cardSettings) botData.cardSettings = {};
        if (!botData.cardSettings[uid]) botData.cardSettings[uid] = { bg:'default', accent:'#5865F2', ownedBgs:['default'] };
        const owned = botData.cardSettings[uid].ownedBgs || ['default'];
        if (owned.includes(bgName)) return reply(`❌ You already own \`${bgName}\`.`);
        const price = PRICES[bgName];
        if (getUserBalance(uid) < price) return reply(`❌ Not enough coins. Need **${price.toLocaleString()} 🪙**, you have **${getUserBalance(uid).toLocaleString()} 🪙**.`);
        addCoins(uid, -price);
        botData.cardSettings[uid].ownedBgs.push(bgName);
        markDirty(); scheduleSave();
        return reply({ embeds:[new EmbedBuilder()
            .setColor(0x00cc44).setTitle('✅ Background Purchased!')
            .setDescription(`You bought the **${bgName}** background for **${price.toLocaleString()} 🪙**!\nUse \`×setbg ${bgName}\` to equip it.`)
            .setFooter({text:`Balance: ${getUserBalance(uid).toLocaleString()} 🪙`})
        ]});
    }

    // ×setbg
    if (command === 'setbg') {
        const bgName = args[0]?.toLowerCase();
        const VALID = ['default','military','midnight','sunset','ocean','crimson','forest','gold','arctic','void','cod','fallout','battlefield','pokemon','neon','hacker','kawaii'];
        if (!bgName || !VALID.includes(bgName)) return reply('❌ Invalid background. Use `×backgrounds` to see all options.');
        if (!botData.cardSettings) botData.cardSettings = {};
        if (!botData.cardSettings[uid]) botData.cardSettings[uid] = { bg:'default', accent:'#5865F2', ownedBgs:['default'] };
        const owned = botData.cardSettings[uid].ownedBgs || ['default'];
        if (!owned.includes(bgName)) return reply(`❌ You don't own \`${bgName}\`. Buy it with \`×buybg ${bgName}\`.`);
        botData.cardSettings[uid].bg = bgName;
        markDirty(); scheduleSave();
        return reply(`✅ Background set to **${bgName}**! Use \`×xpcard\` to see your card.`);
    }

    // ×setaccent
    if (command === 'setaccent') {
        const hex = args[0];
        if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return reply('❌ Invalid hex color. Example: `×setaccent #FF5733`');
        if (!botData.cardSettings) botData.cardSettings = {};
        if (!botData.cardSettings[uid]) botData.cardSettings[uid] = { bg:'default', accent:'#5865F2', ownedBgs:['default'] };
        botData.cardSettings[uid].accent = hex;
        markDirty(); scheduleSave();
        return reply({ embeds:[new EmbedBuilder()
            .setColor(parseInt(hex.replace('#',''),16))
            .setTitle('✅ Accent Color Updated!')
            .setDescription(`Your card accent is now **${hex}**.\nUse \`×xpcard\` to preview.`)
        ]});
                                }
    //GIVEAWAY COMMANDS\\
    if (command === 'giveawaystart') {
        if (!canManageGiveaways(gid, uid))
            return message.reply('❌ You need a rank to start giveaways.');

        if (!args.length)
            return message.reply(
                '❌ **Usage:** `×giveawaystart <time> <winners> <prize>`\n' +
                '**Example:** `×giveawaystart 1h 1 test | prize2:also test | color:#FFD700 | text:Good luck!`'
            );

        if (botData.giveaways?.[gid] && !botData.giveaways[gid].ended)
            return message.reply('❌ There is already an active giveaway in this server. Use `×giveawayend` to end it first.');

        const raw = args.join(' ');

        const durationStr = args[0];
        const duration    = parseDuration(durationStr);
        if (!duration)
            return message.reply('❌ Invalid duration. Use format: `30m`, `2h`, `1d`');

        const winnerCount = parseInt(args[1]);
        if (isNaN(winnerCount) || winnerCount < 1 || winnerCount > 20)
            return message.reply('❌ Winner count must be a number between 1 and 20.');

        const rest = args.slice(2).join(' ');

        function extractParam(str, key) {
            const re = new RegExp(`\\|?\\s*${key}:([^|]+)`, 'i');
            const m  = str.match(re);
            return m ? m[1].trim() : null;
        }

        const prize2Param = extractParam(rest, 'prize2');
        const colorParam  = extractParam(rest, 'color');
        const textParam   = extractParam(rest, 'text');
        const gifParam    = extractParam(rest, 'gif');

        const basePrize = rest
            .replace(/\|?\s*prize2:[^|]+/i, '')
            .replace(/\|?\s*color:[^|]+/i,  '')
            .replace(/\|?\s*text:[^|]+/i,   '')
            .replace(/\|?\s*gif:[^|]+/i,    '')
            .replace(/^\s*\|?\s*/, '')
            .trim();

        if (!basePrize)
            return message.reply('❌ Please provide a prize.\nUsage: `×giveawaystart <time> <winners> <prize>`');

        const prizeDisplay = prize2Param
            ? `🥇 ${basePrize}\n🥈 ${prize2Param}`
            : `🎁 ${basePrize}`;

        let embedColor = 0xFF69B4;
        if (colorParam) {
            const cleaned = colorParam.replace('#', '');
            const parsed  = parseInt(cleaned, 16);
            if (!isNaN(parsed)) embedColor = parsed;
        }

        const introText = textParam || '🎊 A giveaway has started! React below to enter.';

        let gifBottom = GIVEAWAY_GIF_BOTTOM;
        let gifSide   = GIVEAWAY_GIF_SIDE;
        let winnerGif = GIVEAWAY_WINNER_GIF;

        if (gifParam) {
            const gf = gifParam.toLowerCase();
            if (gf === 'none')   { gifBottom = null; gifSide = null; }
            if (gf === 'bottom') { gifSide   = null; }
            if (gf === 'side')   { gifBottom = null; }
            if (gf === 'winner') { gifBottom = null; gifSide = null; }
        }

        const endTime = Date.now() + duration;

        const gData = {
            channelId: message.channel.id,
            messageId: null,
            prize:     prizeDisplay,
            text:      introText,
            color:     embedColor,
            winners:   winnerCount,
            endTime,
            gifBottom,
            gifSide,
            winnerGif,
            ended:     false,
            startedBy: uid,
        };

        const remaining   = duration;
        const activeEmbed = buildGiveawayEmbed(gData, remaining);
        const gMsg        = await message.channel.send({ embeds: [activeEmbed] });

        await gMsg.react('🎉').catch(() => {});

        gData.messageId = gMsg.id;

        if (!botData.giveaways) botData.giveaways = {};
        botData.giveaways[gid] = gData;
        markDirty(); scheduleSave();

        setTimeout(() => endGiveaway(client, gid), duration);

        return;
    }
    if (command === 'giveawayend') {
        if (!canManageGiveaways(gid, uid))
            return message.reply('❌ You need a rank to end giveaways.');

        const gData = botData.giveaways?.[gid];
        if (!gData || gData.ended)
            return message.reply('❌ There is no active giveaway in this server.');

        const channel = message.guild.channels.cache.get(gData.channelId);
        if (!channel)
            return message.reply('❌ Giveaway channel not found.');

        const gMsg = await channel.messages.fetch(gData.messageId).catch(() => null);
        if (!gMsg)
            return message.reply('❌ Giveaway message not found. It may have been deleted.');

        const reaction = gMsg.reactions.cache.get('🎉');
        const users    = reaction ? await reaction.users.fetch() : new Map();
        const entries  = [...users.values()].filter(u => !u.bot).map(u => u.id);

        if (entries.length === 0) {
            gData.ended = true;
            markDirty(); scheduleSave();

            const noEntryEmbed = new EmbedBuilder()
                .setColor(gData.color)
                .setTitle('🎉 GIVEAWAY ENDED')
                .setDescription(`**Prize**\n${gData.prize}\n\n😔 **No valid entries — no winner this time.**`)
                .setFooter({ text: 'SOLDIER² Giveaway System' })
                .setTimestamp();

            if (gData.winnerGif) noEntryEmbed.setImage(gData.winnerGif);
            await gMsg.edit({ embeds: [noEntryEmbed] });
            return message.reply('✅ Giveaway ended. No entries were found.');
        }

        const winnerMentions = [];
        const pool = [...entries];
        const picks = Math.min(gData.winners, pool.length);
        for (let i = 0; i < picks; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            winnerMentions.push(`<@${pool.splice(idx, 1)[0]}>`);
        }

        const winnerStr   = winnerMentions.join(', ');
        const winnerEmbed = buildWinnerEmbed(gData, winnerStr);
        await gMsg.edit({ embeds: [winnerEmbed] });

        gData.ended = true;
        markDirty(); scheduleSave();

        const announceEmbed = new EmbedBuilder()
            .setColor(gData.color)
            .setTitle('🎊 Giveaway Winner(s) Announced!')
            .setDescription(`Congratulations ${winnerStr}!\nYou won: **${gData.prize}**\n\n🔗 [Jump to Giveaway](${gMsg.url})`)
            .setFooter({ text: 'SOLDIER² Giveaway System' })
            .setTimestamp();

        if (gData.winnerGif) announceEmbed.setImage(gData.winnerGif);

        return message.channel.send({ embeds: [announceEmbed] });
    }
    if (command === 'giveawaycontinue') {
        if (!canManageGiveaways(gid, uid))
            return message.reply('❌ You need a rank to continue giveaways.');

        const targetMsgId = args[0];
        if (!targetMsgId)
            return message.reply('❌ Please provide the giveaway message ID.\nUsage: `×giveawaycontinue <messageID>`');

        const existing = botData.giveaways?.[gid];
        if (existing && !existing.ended)
            return message.reply(`❌ There is already an active giveaway in this server. End it first with \`×giveawayend\`.`);

        let foundMsg     = null;
        let foundChannel = null;

        for (const ch of message.guild.channels.cache.values()) {
            if (!ch.isTextBased()) continue;
            const m = await ch.messages.fetch(targetMsgId).catch(() => null);
            if (m) { foundMsg = m; foundChannel = ch; break; }
        }

        if (!foundMsg)
            return message.reply('❌ Could not find that message ID in any channel. Make sure the message still exists.');

        const embed = foundMsg.embeds?.[0];
        if (!embed || !embed.title?.includes('GIVEAWAY'))
            return message.reply('❌ That message does not appear to be a SOLDIER² giveaway embed.');

        const promptEmbed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('⏱️ Giveaway Continue — Set Remaining Time')
            .setDescription(
                `Found the giveaway message in <#${foundChannel.id}>.\n\n` +
                `**Reply with the remaining time** (e.g. \`30m\`, \`2h\`, \`1d\`) ` +
                `to resume the countdown from now.\n\nYou have 30 seconds to respond.`
            )
            .setFooter({ text: 'SOLDIER² Giveaway System' });

        await message.reply({ embeds: [promptEmbed] });

        const filter    = m => m.author.id === uid;
        const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] })
            .catch(() => null);

        if (!collected || collected.size === 0)
            return message.channel.send('⏱️ Timed out. Giveaway continue cancelled.');

        const timeInput   = collected.first().content.trim();
        const newDuration = parseDuration(timeInput);
        if (!newDuration)
            return message.channel.send('❌ Invalid duration. Giveaway continue cancelled.');

        const oldDescription = embed.description || '';

        const prizeMatch  = oldDescription.match(/\*\*Prize\*\*\s*\n([^\n]+(?:\n[^\n]+)?)/);
        const savedPrize  = prizeMatch ? prizeMatch[1].trim() : '*(prize not recovered — check original embed)*';

        const winnerMatch  = oldDescription.match(/\*\*Winners\*\*\s*\n(\d+)/);
        const savedWinners = winnerMatch ? parseInt(winnerMatch[1]) : 1;

        const newEndTime = Date.now() + newDuration;

        const resumedData = {
            channelId: foundChannel.id,
            messageId: targetMsgId,
            prize:     savedPrize,
            text:      '🔄 Giveaway resumed after bot restart!',
            color:     embed.color ?? 0xFF69B4,
            winners:   savedWinners,
            endTime:   newEndTime,
            gifBottom: GIVEAWAY_GIF_BOTTOM,
            gifSide:   GIVEAWAY_GIF_SIDE,
            winnerGif: GIVEAWAY_WINNER_GIF,
            ended:     false,
            startedBy: uid,
            resumed:   true,
        };

        if (!botData.giveaways) botData.giveaways = {};
        botData.giveaways[gid] = resumedData;
        markDirty(); scheduleSave();

        const updatedEmbed = buildGiveawayEmbed(resumedData, newDuration);
        await foundMsg.edit({ embeds: [updatedEmbed] }).catch(() => {});

        const existingReaction = foundMsg.reactions.cache.get('🎉');
        if (!existingReaction) await foundMsg.react('🎉').catch(() => {});

        setTimeout(() => endGiveaway(client, gid), newDuration);

        const successEmbed = new EmbedBuilder()
            .setColor(0x00FF7F)
            .setTitle('✅ Giveaway Resumed!')
            .addFields(
                { name: '🎁 Prize',        value: savedPrize,                              inline: false },
                { name: '⏱️ New Duration', value: formatDuration(newDuration),             inline: true  },
                { name: '🏆 Winners',      value: `${savedWinners}`,                       inline: true  },
                { name: '📍 Channel',      value: `<#${foundChannel.id}>`,                 inline: true  },
                { name: '🔗 Message',      value: `[Jump to Giveaway](${foundMsg.url})`,   inline: false }
            )
            .setFooter({ text: 'SOLDIER² Giveaway System' })
            .setTimestamp();

        return message.channel.send({ embeds: [successEmbed] });
    }
    // ============================================================
    // ━━━ GAMES ━━━
    // ============================================================

    // ×8ball
    if (command === '8ball') {
        const question = args.join(' ');
        if (!question) return reply('❌ Ask a question! `×8ball <question>`');
        const answers = [
            'It is certain.','It is decidedly so.','Without a doubt.','Yes, definitely.',
            'You may rely on it.','As I see it, yes.','Most likely.','Outlook good.','Yes.',
            'Signs point to yes.','Reply hazy, try again.','Ask again later.',
            'Better not tell you now.','Cannot predict now.','Concentrate and ask again.',
            "Don't count on it.",'My reply is no.','My sources say no.',
            'Outlook not so good.','Very doubtful.'
        ];
        const answer = answers[Math.floor(Math.random() * answers.length)];
        const idx = answers.indexOf(answer);
        const isPositive = idx < 10, isNeutral = idx < 15 && !isPositive;
        const canvas = createCanvas(500, 100);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#111111'; ctx.fillRect(0, 0, 500, 100);
        const gradient = ctx.createRadialGradient(250, 50, 5, 250, 50, 120);
        gradient.addColorStop(0, isPositive ? '#00ff88' : isNeutral ? '#ffcc00' : '#ff4444');
        gradient.addColorStop(1, '#111111');
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, 500, 100);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(answer, 250, 58);
        const att = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: '8ball.png' });
        return message.channel.send({ embeds: [new EmbedBuilder()
            .setColor(0x000000).setTitle('🎱 Magic 8 Ball')
            .setDescription(`**Question:** ${question}`)
            .setImage('attachment://8ball.png')
            .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()
        ], files: [att] });
    }

    // ×dice
    if (command === 'dice') {
        const roll = Math.floor(Math.random() * 6) + 1;
        const DOTS = {
            1:[[2,2]], 2:[[1,1],[3,3]], 3:[[1,1],[2,2],[3,3]],
            4:[[1,1],[1,3],[3,1],[3,3]], 5:[[1,1],[1,3],[2,2],[3,1],[3,3]],
            6:[[1,1],[1,2],[1,3],[3,1],[3,2],[3,3]]
        };
        const canvas = createCanvas(200, 200);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#cccccc'; ctx.beginPath(); ctx.roundRect(10,10,180,180,20); ctx.fill();
        ctx.strokeStyle = '#888888'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(10,10,180,180,20); ctx.stroke();
        ctx.fillStyle = '#222222';
        for (const [col, row] of DOTS[roll]) {
            ctx.beginPath(); ctx.arc(col*50+5, row*50+5, 14, 0, Math.PI*2); ctx.fill();
        }
        const att = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'dice.png' });
        return message.channel.send({ embeds: [new EmbedBuilder()
            .setColor(0x888888).setTitle('🎲 Dice Roll')
            .setDescription(`<@${uid}> rolled a **${roll}**!`)
            .setImage('attachment://dice.png')
            .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()
        ], files: [att] });
    }

    // ×flip
    if (command === 'flip') {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        addXP(gid, uid, 10);
        return message.channel.send({ embeds: [new EmbedBuilder()
            .setColor(0xFFD700).setTitle('🪙 Coin Flip')
            .setDescription(`<@${uid}> flipped a coin...\n\n**${result === 'Heads' ? '👑 HEADS!' : '🦅 TAILS!'}**`)
            .setImage('https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif')
            .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()
        ]});
    }

    // ×flipbet
    if (command === 'flipbet') {
        const opponent = message.mentions.users.first();
        const bet = parseInt(args[0]);
        if (!bet || bet < 1) return reply('❌ Usage: `×flipbet <amount> <heads/tails>` or `×flipbet <amount> @opponent`');
        if (getUserBalance(uid) < bet) return reply(`❌ Not enough coins. Balance: **${getUserBalance(uid).toLocaleString()} 🪙**`);

        if (opponent && !opponent.bot && opponent.id !== uid) {
            if (getUserBalance(opponent.id) < bet) return reply(`❌ <@${opponent.id}> doesn't have enough coins.`);
            const cMsg = await message.channel.send({ embeds: [new EmbedBuilder()
                .setColor(0xFFD700).setTitle('🪙 Coin Flip Challenge!')
                .setDescription(`<@${opponent.id}> you've been challenged by <@${uid}>!\nBet: **${bet.toLocaleString()} 🪙** each\n\nReact ✅ to accept or ❌ to decline.`)
            ]});
            await cMsg.react('✅'); await cMsg.react('❌');
            const col = await cMsg.awaitReactions({ filter: (r,u) => ['✅','❌'].includes(r.emoji.name) && u.id === opponent.id, max:1, time:30000 }).catch(()=>null);
            if (!col?.first() || col.first().emoji.name === '❌')
                return cMsg.edit({ embeds: [new EmbedBuilder().setColor(0xe74c3c).setTitle('❌ Declined').setDescription(`<@${opponent.id}> declined.`)] });
            const winner = Math.random() < 0.5 ? uid : opponent.id;
            const loser  = winner === uid ? opponent.id : uid;
            addCoins(winner, bet); addCoins(loser, -bet);
            addXP(gid, winner, 100); addXP(gid, loser, 10);
            return cMsg.edit({ embeds: [new EmbedBuilder()
                .setColor(0xFFD700).setTitle('🪙 Coin Flip Result!')
                .setDescription(`🏆 **<@${winner}>** wins **${bet.toLocaleString()} 🪙**!\n<@${loser}> loses.`)
                .setImage('https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif')
                .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()
            ]});
        }

        const choice = args[1]?.toLowerCase();
        if (!['heads','tails','h','t'].includes(choice)) return reply('❌ Pick `heads` or `tails`! `×flipbet <amount> <heads/tails>`');
        const pick = choice.startsWith('h') ? 'heads' : 'tails';
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const won = pick === result;
        addCoins(uid, won ? bet : -bet);
        addXP(gid, uid, won ? 100 : 10);
        return message.channel.send({ embeds: [new EmbedBuilder()
            .setColor(0xFFD700).setTitle(`🪙 Coin Flip — ${won ? 'You Win! 🏆' : 'You Lose!'}`)
            .setDescription(`You picked **${pick}** — landed on **${result}**!\n\n${won ? `+**${bet.toLocaleString()} 🪙**` : `-**${bet.toLocaleString()} 🪙**`}\nBalance: **${getUserBalance(uid).toLocaleString()} 🪙**`)
            .setImage('https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif')
            .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()
        ]});
    }

    // ×rps
    if (command === 'rps') {
        const CHOICES  = ['🪨 Rock', '📄 Paper', '✂️ Scissors'];
        const BEATS    = { '🪨 Rock': '✂️ Scissors', '📄 Paper': '🪨 Rock', '✂️ Scissors': '📄 Paper' };
        const EMOJI_MAP = { '🪨': '🪨 Rock', '📄': '📄 Paper', '✂️': '✂️ Scissors' };
        const bet      = parseInt(args[0]) || 0;
        const opponent = message.mentions.users.first();

        if (bet > 0 && getUserBalance(uid) < bet)
            return reply(`❌ Not enough coins. Balance: **${getUserBalance(uid).toLocaleString()} 🪙**`);

        // Helper — sends a private DM to a player to pick their move
        async function getChoiceViaDM(targetUser) {
            try {
                const dm = await targetUser.send({ embeds: [new EmbedBuilder()
                    .setColor(0xe74c3c).setTitle('✊ RPS — Make your move!')
                    .setDescription(`React below to make your pick!\n🪨 Rock | 📄 Paper | ✂️ Scissors`)
                    .setFooter({ text: 'You have 30 seconds' })
                ]});
                await dm.react('🪨');
                await dm.react('📄');
                await dm.react('✂️');

                const col = await dm.awaitReactions({
                    filter: (r, u) => Object.keys(EMOJI_MAP).includes(r.emoji.name) && u.id === targetUser.id,
                    max: 1, time: 30000
                }).catch(() => null);

                await dm.edit({ embeds: [new EmbedBuilder()
                    .setColor(0x888888).setTitle('✅ Move locked in!')
                    .setDescription(`You picked **${col?.first() ? EMOJI_MAP[col.first().emoji.name] : 'nothing'}**. Waiting for result...`)
                ]}).catch(() => {});

                return col?.first() ? EMOJI_MAP[col.first().emoji.name] : null;
            } catch {
                // DMs closed — fall back to channel
                const m = await message.channel.send({ embeds: [new EmbedBuilder()
                    .setColor(0xe74c3c).setTitle('✊ RPS — Make your move!')
                    .setDescription(`<@${targetUser.id}> react below (DMs are closed):`)
                    .setFooter({ text: 'You have 30 seconds' })
                ]});
                await m.react('🪨');
                await m.react('📄');
                await m.react('✂️');

                const col = await m.awaitReactions({
                    filter: (r, u) => Object.keys(EMOJI_MAP).includes(r.emoji.name) && u.id === targetUser.id,
                    max: 1, time: 30000
                }).catch(() => null);

                await m.delete().catch(() => {});
                return col?.first() ? EMOJI_MAP[col.first().emoji.name] : null;
            }
        }

        // ── PvP Mode ──
        if (opponent && !opponent.bot && opponent.id !== uid) {
            if (bet > 0 && getUserBalance(opponent.id) < bet)
                return reply(`❌ <@${opponent.id}> doesn't have enough coins.`);

            const waitMsg = await message.channel.send({ embeds: [new EmbedBuilder()
                .setColor(0xe74c3c).setTitle('✊ Rock Paper Scissors — PvP')
                .setDescription(
                    `<@${uid}> vs <@${opponent.id}>\n` +
                    `${bet > 0 ? `Bet: **${bet.toLocaleString()} 🪙**\n` : ''}` +
                    `\nBoth players check their DMs to make their pick!\n` +
                    `*(If DMs are closed, pick in channel)*`
                )
                .setFooter({ text: 'Waiting for both players...' }).setTimestamp()
            ]});

            // Both players pick simultaneously
            const [p1, p2] = await Promise.all([
                getChoiceViaDM(message.author),
                getChoiceViaDM(opponent)
            ]);

            if (!p1 || !p2) {
                return waitMsg.edit({ embeds: [new EmbedBuilder()
                    .setColor(0x888888).setTitle('❌ RPS — Timed Out')
                    .setDescription(`Someone didn't respond in time. No coins exchanged.`)
                    .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()] });
            }

            let winner = null, loser = null;
            if (p1 !== p2) {
                winner = BEATS[p1] === p2 ? uid : opponent.id;
                loser  = winner === uid ? opponent.id : uid;
            }

            if (winner && bet > 0) { addCoins(winner, bet); addCoins(loser, -bet); }
            if (winner) { addXP(gid, winner, 100); addXP(gid, loser, 10); }
            else        { addXP(gid, uid, 10); addXP(gid, opponent.id, 10); }

            return waitMsg.edit({ embeds: [new EmbedBuilder()
                .setColor(winner ? 0x00cc00 : 0xFFD700).setTitle('✊ RPS Result!')
                .addFields(
                    { name: `<@${uid}>`,        value: p1,  inline: true },
                    { name: 'VS',               value: '⚔️', inline: true },
                    { name: `<@${opponent.id}>`, value: p2,  inline: true }
                )
                .setDescription(
                    winner
                        ? `🏆 <@${winner}> wins${bet > 0 ? ` **${bet.toLocaleString()} 🪙**` : ''}!`
                        : `🤝 Tie! No coins exchanged.`
                )
                .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()
            ]});
        }

        // ── vs Bot Mode ──
        const playerChoice = await getChoiceViaDM(message.author);
        if (!playerChoice) return reply("❌ You didn't respond in time.");

        const botChoice = CHOICES[Math.floor(Math.random() * 3)];
        const outcome   = playerChoice === botChoice ? 'tie' : BEATS[playerChoice] === botChoice ? 'win' : 'lose';

        if (bet > 0) addCoins(uid, outcome === 'win' ? bet : outcome === 'lose' ? -bet : 0);
        addXP(gid, uid, outcome === 'win' ? 100 : 10);

        return message.channel.send({ embeds: [new EmbedBuilder()
            .setColor(outcome === 'win' ? 0x00cc00 : outcome === 'tie' ? 0xFFD700 : 0xe74c3c)
            .setTitle(`✊ RPS — ${outcome === 'win' ? 'You Win! 🏆' : outcome === 'tie' ? 'Tie! 🤝' : 'You Lose!'}`)
            .addFields(
                { name: 'Your Pick', value: playerChoice, inline: true },
                { name: 'Bot Pick',  value: botChoice,    inline: true }
            )
            .setDescription(
                bet > 0
                    ? outcome === 'win'  ? `+**${bet.toLocaleString()} 🪙**`
                    : outcome === 'lose' ? `-**${bet.toLocaleString()} 🪙**`
                    : '🤝 No coins exchanged.'
                    : null
            )
            .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()
        ]});
    }

    // ×roulette
    if (command === 'roulette') {
        const REDS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
        const betType = args[0]?.toLowerCase();
        const bet = parseInt(args[1]);
        if (!betType || !bet || bet < 1) return reply('❌ Usage: `×roulette <red/black/green/0-36> <bet>`');
        if (getUserBalance(uid) < bet) return reply(`❌ Not enough coins. Balance: **${getUserBalance(uid).toLocaleString()} 🪙**`);
        const spin = Math.floor(Math.random()*37);
        const isRed = REDS.includes(spin);
        const color = spin===0?'green':isRed?'red':'black';
        const emoji = spin===0?'🟢':isRed?'🔴':'⚫';
        let won=false, mult=0;
        if (!isNaN(parseInt(betType))) { won=parseInt(betType)===spin; mult=35; }
        else if (betType==='red')   { won=color==='red';   mult=1; }
        else if (betType==='black') { won=color==='black'; mult=1; }
        else if (betType==='green') { won=color==='green'; mult=17; }
        else return reply('❌ Bet type must be `red`, `black`, `green`, or a number `0-36`.');
        const winnings = won ? bet*mult : -bet;
        addCoins(uid, winnings); addXP(gid, uid, won?100:10);
        const canvas = createCanvas(400,200); const ctx = canvas.getContext('2d');
        ctx.fillStyle='#1a1a1a'; ctx.fillRect(0,0,400,200);
        const wg = ctx.createRadialGradient(100,100,10,100,100,80);
        wg.addColorStop(0,'#2d2d2d'); wg.addColorStop(1,'#111');
        ctx.fillStyle=wg; ctx.beginPath(); ctx.arc(100,100,80,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='#FFD700'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(100,100,80,0,Math.PI*2); ctx.stroke();
        ctx.fillStyle=spin===0?'#00cc00':REDS.includes(spin)?'#cc0000':'#222222';
        ctx.beginPath(); ctx.arc(100,100,60,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#ffffff'; ctx.font='bold 32px sans-serif'; ctx.textAlign='center'; ctx.fillText(spin,100,112);
        ctx.font='bold 16px sans-serif'; ctx.fillText(won?'🏆 WIN!':'💸 LOSS',280,80);
        ctx.font='14px sans-serif'; ctx.fillText(`Landed: ${emoji} ${spin} (${color})`,280,110);
        ctx.fillText(`${won?'+':'-'}${Math.abs(winnings)} 🪙`,280,140);
        const att = new AttachmentBuilder(canvas.toBuffer('image/png'),{name:'roulette.png'});
        return message.channel.send({ embeds: [new EmbedBuilder()
            .setColor(0xe74c3c).setTitle(`🎡 Roulette — ${won?'Winner! 🏆':'Better luck next time!'}`)
            .setDescription(`Landed on ${emoji} **${spin}** (${color})\n\n${won?`🏆 +**${winnings.toLocaleString()} 🪙**`:`💸 -**${bet.toLocaleString()} 🪙**`}\nBalance: **${getUserBalance(uid).toLocaleString()} 🪙**`)
            .setImage('attachment://roulette.png').setFooter({text:'SOLDIER² Games'}).setTimestamp()
        ], files:[att] });
    }

    // ×rr
    if (command === 'rr') {
        if (!botData.activeGames) botData.activeGames = {};
        const rrKey = `rr_${gid}_${uid}`;
        if (botData.activeGames[rrKey]) return reply('❌ You already have a Russian Roulette game active!');

        const bulletPos = Math.floor(Math.random() * 6);
        let shots = 0;
        botData.activeGames[rrKey] = true;
        const BASE = 500;

        const buildRREmbed = (s, status) => new EmbedBuilder()
            .setColor(0x000000).setTitle('🔫 Russian Roulette')
            .setDescription(
                `<@${uid}> is playing Russian Roulette!\n\n` +
                `🔫 **Shots fired:** ${s}/6\n` +
                `💰 **Current prize:** ${(BASE * s).toLocaleString()} 🪙\n\n` +
                `React 🔫 to pull the trigger | 🏃 to run away`
            )
            .setImage('https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif')
            .setFooter({ text: status }).setTimestamp();

        const msg = await message.channel.send({ embeds: [buildRREmbed(0, 'The chamber is loaded...')] });
        await msg.react('🔫');
        await msg.react('🏃');

        const collector = msg.createReactionCollector({
            filter: (r, u) => ['🔫', '🏃'].includes(r.emoji.name) && u.id === uid && !u.bot,
            time: 300000,
            dispose: true
        });

        collector.on('collect', async (r) => {
            try { await r.users.remove(uid); } catch {}
            const choice = r.emoji.name;

            if (choice === '🏃') {
                collector.stop('done');
                const prize = BASE * shots;
                addCoins(uid, prize);
                addXP(gid, uid, 100);
                delete botData.activeGames[rrKey];
                await msg.edit({ embeds: [new EmbedBuilder()
                    .setColor(0x00cc00).setTitle('🏃 Smart Move!')
                    .setDescription(`<@${uid}> ran after **${shots}** shot(s)!\nWon **${prize.toLocaleString()} 🪙**!`)
                    .setImage('https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif')
                    .setFooter({ text: 'Wise choice.' }).setTimestamp()] });
                return;
            }

            // Pull trigger
            if (shots === bulletPos) {
                collector.stop('done');
                delete botData.activeGames[rrKey];
                addXP(gid, uid, 10);
                const member = message.guild.members.cache.get(uid);
                if (member) await member.timeout(5 * 60 * 1000, 'Lost Russian Roulette').catch(() => {});
                await msg.edit({ embeds: [new EmbedBuilder()
                    .setColor(0xFF0000).setTitle('💥 BANG!')
                    .setDescription(`<@${uid}> pulled the trigger and got shot! 💀\nMuted for **5 minutes**.`)
                    .setImage('https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif')
                    .setFooter({ text: "Should've run." }).setTimestamp()] });
                return;
            }

            shots++;

            if (shots >= 6) {
                collector.stop('done');
                const prize = BASE * shots;
                addCoins(uid, prize);
                addXP(gid, uid, 500);
                delete botData.activeGames[rrKey];
                await msg.edit({ embeds: [new EmbedBuilder()
                    .setColor(0xFFD700).setTitle('🏆 Unbelievable!')
                    .setDescription(`<@${uid}> survived all 6 chambers! 🤯\nWon **${prize.toLocaleString()} 🪙**!`)
                    .setImage('https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif')
                    .setFooter({ text: 'Absolute legend.' }).setTimestamp()] });
                return;
            }

            await msg.edit({ embeds: [buildRREmbed(shots, `Click... ${shots} down, ${6 - shots} left.`)] });
        });

        collector.on('end', (_, reason) => {
            if (reason !== 'done') {
                delete botData.activeGames[rrKey];
                msg.edit({ embeds: [new EmbedBuilder()
                    .setColor(0x888888).setTitle('🔫 Russian Roulette')
                    .setDescription('⏰ Game timed out.')] }).catch(() => {});
            }
        });

        return;
    }


    // ×slots
    if (command === 'slots') {
        const bet = parseInt(args[0]);
        if (!bet || bet < 1) return reply('❌ Usage: `×slots <bet>`');
        if (getUserBalance(uid) < bet) return reply(`❌ Not enough coins. Balance: **${getUserBalance(uid).toLocaleString()} 🪙**`);

        const SYMS    = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7'];
        const LABELS  = ['CHR', 'LEM', 'ONG', 'GRP', 'STR', 'GEM', ' 7 '];
        const COLORS  = ['#ff4444', '#ffee00', '#ff8800', '#aa44ff', '#ffdd00', '#00eeff', '#FFD700'];
        const WEIGHTS = [30, 25, 20, 15, 6, 3, 1];
        const PAYS    = { '🍒': 2, '🍋': 2, '🍊': 3, '🍇': 4, '⭐': 5, '💎': 10, '7': 50 };

        function wRand() {
            let r = Math.random() * 100;
            for (let i = 0; i < SYMS.length; i++) { r -= WEIGHTS[i]; if (r <= 0) return i; }
            return 0;
        }

        function randIdx() { return Math.floor(Math.random() * SYMS.length); }

        const reelIdx = [wRand(), wRand(), wRand()];
        const reels   = reelIdx.map(i => SYMS[i]);
        const jackpot = reels[0] === reels[1] && reels[1] === reels[2];
        const twoKind = (reels[0] === reels[1] || reels[1] === reels[2]) && !jackpot;
        const payout  = jackpot ? bet * PAYS[reels[0]] : twoKind ? bet : -bet;

        // Build canvas frame
        function buildFrame(r0, r1, r2, spinning, finalResult) {
            const canvas = createCanvas(520, 180);
            const ctx    = canvas.getContext('2d');

            const bg = ctx.createLinearGradient(0, 0, 0, 180);
            bg.addColorStop(0, '#2d2200');
            bg.addColorStop(1, '#1a1400');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, 520, 180);

            const rx     = [80, 260, 440];
            const idxs   = [r0, r1, r2];

            for (let i = 0; i < 3; i++) {
                const idx = idxs[i];
                const isLocked = !spinning[i];

                ctx.fillStyle = '#111111';
                ctx.beginPath(); ctx.roundRect(rx[i] - 60, 15, 120, 130, 12); ctx.fill();

                ctx.strokeStyle = isLocked ? '#00FF88' : (finalResult && jackpot ? '#FFD700' : '#555555');
                ctx.lineWidth   = isLocked || (finalResult && jackpot) ? 4 : 2;
                ctx.beginPath(); ctx.roundRect(rx[i] - 60, 15, 120, 130, 12); ctx.stroke();

                ctx.fillStyle = spinning[i] ? '#888888' : COLORS[idx];
                ctx.font      = 'bold 42px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(spinning[i] ? '???' : LABELS[idx], rx[i], 95);
            }

            // Bottom text
            if (finalResult) {
                ctx.fillStyle = jackpot ? '#FFD700' : twoKind ? '#00ff88' : '#ff4444';
                ctx.font      = 'bold 15px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(
                    jackpot ? `JACKPOT! +${payout.toLocaleString()} coins`
                    : twoKind ? `Two of a kind! +${bet.toLocaleString()} coins`
                    : `No match. -${bet.toLocaleString()} coins`,
                    260, 165
                );
            } else {
                ctx.fillStyle = '#888888';
                ctx.font      = 'bold 15px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Spinning...', 260, 165);
            }

            return new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'slots.png' });
        }

        function buildEmbed(title, desc, final) {
            return new EmbedBuilder()
                .setColor(final ? (jackpot ? 0xFFD700 : twoKind ? 0x00FF88 : 0xFF4444) : 0x888888)
                .setTitle(title)
                .setDescription(desc)
                .setImage('attachment://slots.png')
                .setFooter({ text: 'SOLDIER² Games' })
                .setTimestamp();
        }

        // Frame 1 — all spinning
        const f1  = buildFrame(randIdx(), randIdx(), randIdx(), [true, true, true], false);
        const msg = await message.channel.send({
            embeds: [buildEmbed('🎰 Spinning...', '🎰  |  🎰  |  🎰', false)],
            files: [f1]
        });

        await new Promise(r => setTimeout(r, 600));

        // Frame 2 — still spinning
        const f2 = buildFrame(randIdx(), randIdx(), randIdx(), [true, true, true], false);
        await msg.edit({ embeds: [buildEmbed('🎰 Spinning...', '🎰  |  🎰  |  🎰', false)], files: [f2] });

        await new Promise(r => setTimeout(r, 600));

        // Frame 3 — reel 1 locks in
        const f3 = buildFrame(reelIdx[0], randIdx(), randIdx(), [false, true, true], false);
        await msg.edit({ embeds: [buildEmbed('🎰 Spinning...', '🎰  |  🎰  |  🎰', false)], files: [f3] });

        await new Promise(r => setTimeout(r, 600));

        // Frame 4 — reel 2 locks in
        const f4 = buildFrame(reelIdx[0], reelIdx[1], randIdx(), [false, false, true], false);
        await msg.edit({ embeds: [buildEmbed('🎰 Spinning...', '🎰  |  🎰  |  🎰', false)], files: [f4] });

        await new Promise(r => setTimeout(r, 700));

        // Final frame — all locked, show result
        addCoins(uid, payout);
        addXP(gid, uid, jackpot ? 100 : 10);

        const displayReels = reelIdx.map(i => SYMS[i] === '7' ? '7️⃣' : SYMS[i]);
        const f5 = buildFrame(reelIdx[0], reelIdx[1], reelIdx[2], [false, false, false], true);
        await msg.edit({
            embeds: [buildEmbed(
                `🎰 Slots — ${jackpot ? 'JACKPOT! 🏆' : twoKind ? 'Two of a Kind!' : 'No Match'}`,
                `${displayReels.join('  |  ')}\n\n` +
                `${jackpot ? `🏆 **+${payout.toLocaleString()} 🪙**` : twoKind ? `🎊 **+${payout.toLocaleString()} 🪙**` : `💸 **-${bet.toLocaleString()} 🪙**`}\n` +
                `Balance: **${getUserBalance(uid).toLocaleString()} 🪙**`,
                true
            )],
            files: [f5]
        });

        return;
    }

    // ×blackjack / ×bj
    if (command==='blackjack'||command==='bj') {
        const bet = parseInt(args[0]);
        if (!bet || bet < 1) return reply('❌ Usage: `×blackjack <bet>`');
        if (getUserBalance(uid) < bet) return reply(`❌ Not enough coins. Balance: **${getUserBalance(uid).toLocaleString()} 🪙**`);

        const SUITS = ['♠️','♥️','♦️','♣️'];
        const VALS  = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

        function deck()  { return [...SUITS.flatMap(s => VALS.map(v => ({ s, v })))].sort(() => Math.random() - 0.5); }
        function val(v)  { return ['J','Q','K'].includes(v) ? 10 : v === 'A' ? 11 : +v; }
        function total(h){ let t = 0, a = 0; for (const c of h) { t += val(c.v); if (c.v === 'A') a++; } while (t > 21 && a > 0) { t -= 10; a--; } return t; }
        function hStr(h, hide = false) { return h.map((c, i) => hide && i === 1 ? '🂠' : `${c.v}${c.s}`).join(' '); }

        const d      = deck();
        const player = [d.pop(), d.pop()];
        const dealer = [d.pop(), d.pop()];
        let gameOver = false;

        const bldEmbed = (status, hide = true) => new EmbedBuilder()
            .setColor(0x000000).setTitle('🃏 Blackjack')
            .addFields(
                { name: `Your Hand (${total(player)})`,           value: hStr(player),       inline: false },
                { name: `Dealer (${hide ? '?' : total(dealer)})`, value: hStr(dealer, hide), inline: false }
            )
            .setDescription(status)
            .setFooter({ text: '👊 Hit  |  ✋ Stand' })
            .setTimestamp();

        if (total(player) === 21) {
            const w = Math.floor(bet * 1.5);
            addCoins(uid, w); addXP(gid, uid, 100);
            return reply({ embeds: [bldEmbed(`🃏 **BLACKJACK!** +**${w.toLocaleString()} 🪙**!`, false)] });
        }

        const msg = await message.channel.send({ embeds: [bldEmbed('Your move!')] });
        await msg.react('👊');
        await msg.react('✋');

        const collector = msg.createReactionCollector({
            filter: (r, u) => ['👊','✋'].includes(r.emoji.name) && u.id === uid && !u.bot,
            time: 60000,
            dispose: true
        });

        collector.on('collect', async (r) => {
            if (gameOver) return;
            try { await r.users.remove(uid); } catch {}
            const choice = r.emoji.name;

            if (choice === '👊') {
                player.push(d.pop());
                if (total(player) > 21) {
                    gameOver = true;
                    collector.stop('done');
                    addCoins(uid, -bet); addXP(gid, uid, 10);
                    return msg.edit({ embeds: [bldEmbed(`💥 **Bust!** -**${bet.toLocaleString()} 🪙**`, false)] });
                }
                await msg.edit({ embeds: [bldEmbed('Your move!')] });
                return;
            }

            // Stand
            gameOver = true;
            collector.stop('done');
            while (total(dealer) < 17) dealer.push(d.pop());
            const pt = total(player), dt = total(dealer);
            let res, coins;
            if (dt > 21 || pt > dt)  { res = '🏆 You win!';                    coins =  bet; }
            else if (pt === dt)       { res = '🤝 Push! Your bet is returned.'; coins =  0;   }
            else                      { res = `💸 Dealer wins with ${dt}.`;     coins = -bet; }
            addCoins(uid, coins); addXP(gid, uid, coins > 0 ? 100 : 10);
            msg.edit({ embeds: [bldEmbed(`${res}\nBalance: **${getUserBalance(uid).toLocaleString()} 🪙**`, false)] });
        });

        collector.on('end', (_, reason) => {
            if (reason !== 'done' && !gameOver) {
                gameOver = true;
                msg.edit({ embeds: [bldEmbed('⏰ Timed out.', false)] }).catch(() => {});
            }
        });

        return;
    }

            
    // ×gtn
    if (command==='gtn') {
        const bet = parseInt(args[0]) || 0;
        if (bet > 0 && getUserBalance(uid) < bet) return reply('❌ Not enough coins.');

        const secret  = Math.floor(Math.random() * 11);
        let tries     = 0;
        let gameOver  = false;
        const nums    = ['0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

        const msg = await message.channel.send({ embeds: [new EmbedBuilder()
            .setColor(0xffffff).setTitle('🔢 Guess the Number!')
            .setDescription(
                `Thinking of a number **0-10**. You have **2 tries**.\n` +
                `${bet > 0 ? `Bet: **${bet.toLocaleString()} 🪙**` : ''}`
            )
            .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()
        ]});

        for (const e of nums) await msg.react(e).catch(() => {});

        const collector = msg.createReactionCollector({
            filter: (r, u) => nums.includes(r.emoji.name) && u.id === uid && !u.bot,
            time: 60000,
            dispose: true
        });

        collector.on('collect', async (r) => {
            if (gameOver) return;
            try { await r.users.remove(uid); } catch {}
            const guess = nums.indexOf(r.emoji.name);
            tries++;

            if (guess === secret) {
                gameOver = true;
                collector.stop('done');
                if (bet > 0) addCoins(uid, bet);
                addXP(gid, uid, 100);
                return msg.edit({ embeds: [new EmbedBuilder()
                    .setColor(0x00ff88).setTitle('✅ Correct!')
                    .setDescription(`You guessed **${secret}** in ${tries} tr${tries === 1 ? 'y' : 'ies'}!${bet > 0 ? `\n+**${bet.toLocaleString()} 🪙**` : ''}`)
                    .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()] });
            }

            if (tries >= 2) {
                gameOver = true;
                collector.stop('done');
                if (bet > 0) addCoins(uid, -bet);
                addXP(gid, uid, 10);
                return msg.edit({ embeds: [new EmbedBuilder()
                    .setColor(0xe74c3c).setTitle('❌ Wrong!')
                    .setDescription(`The number was **${secret}**.${bet > 0 ? `\n-**${bet.toLocaleString()} 🪙**` : ''}`)
                    .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()] });
            }

            await msg.edit({ embeds: [new EmbedBuilder()
                .setColor(0xffcc00).setTitle('❌ Wrong! One try left.')
                .setDescription(`Not **${guess}**. One more guess!\n${bet > 0 ? `Bet: **${bet.toLocaleString()} 🪙**` : ''}`)
                .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()] });
        });

        collector.on('end', (_, reason) => {
            if (reason !== 'done' && !gameOver) {
                gameOver = true;
                msg.edit({ embeds: [new EmbedBuilder()
                    .setColor(0x888888).setTitle('⏰ Timed out!')
                    .setDescription(`The number was **${secret}**.`)] }).catch(() => {});
            }
        });

        return;
    }

    // ×biggtn
    if (command==='biggtn') {
        const secret = Math.floor(Math.random() * 101);
        let tries    = 0;
        let ended    = false;

        const askEmbed = (hint = '') => new EmbedBuilder()
            .setColor(0xffffff).setTitle('🔢 Big Guess the Number!')
            .setDescription(
                `Thinking of a number **0-100**!\n` +
                `First to guess right wins **100,000 🪙**!\n` +
                `${hint}\nAnyone can guess — type a number in chat!`
            )
            .setFooter({ text: 'SOLDIER² Games' }).setTimestamp();

        await message.channel.send({ embeds: [askEmbed()] });

        const doGuess = async () => {
            if (ended) return;

            const chatFilter = m =>
                !m.author.bot &&
                !isNaN(+m.content.trim()) &&
                +m.content.trim() >= 0 &&
                +m.content.trim() <= 100;

            const col = await message.channel.awaitMessages({
                filter: chatFilter,
                max: 1,
                time: 60000,
                errors: ['time']
            }).catch(() => null);

            if (!col?.first() || ended) {
                ended = true;
                return message.channel.send({ embeds: [new EmbedBuilder()
                    .setColor(0x888888).setTitle('⏰ Big GTN — Timed Out!')
                    .setDescription(`Nobody guessed it in time! The number was **${secret}**.`)
                    .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()] });
            }

            const guesser = col.first().author;
            const guess   = +col.first().content.trim();
            tries++;

            if (guess === secret) {
                ended = true;
                addCoins(guesser.id, 100000);
                addXP(gid, guesser.id, 100);
                return message.channel.send({ embeds: [new EmbedBuilder()
                    .setColor(0xFFD700).setTitle('🏆 JACKPOT!')
                    .setDescription(
                        `🎉 <@${guesser.id}> guessed the number **${secret}** correctly!\n` +
                        `💰 +**100,000 🪙**!\n` +
                        `Total guesses: **${tries}**`
                    )
                    .setThumbnail(guesser.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()] });
            }

            const hint = guess < secret ? `📈 **${guess}** is too low!` : `📉 **${guess}** is too high!`;
            await message.channel.send({ embeds: [askEmbed(`${hint} — Keep guessing! (${tries} guess${tries === 1 ? '' : 'es'} so far)`)] });
            doGuess();
        };

        doGuess();
        return;
    }

    // ×howgay
    if (command==='howgay') {
        const target=message.mentions.users.first()||message.author;
        const pct=Math.floor(Math.random()*101);
        const bar='█'.repeat(Math.floor(pct/10))+'░'.repeat(10-Math.floor(pct/10));
        return reply({embeds:[new EmbedBuilder().setColor(0xFF69B4).setTitle('🏳️‍🌈 Gay Meter')
            .setDescription(`**${target.username}** is...\n\n\`[${bar}]\` **${pct}% gay**\n\n${pct>75?'🌈 Very gay!':pct>50?'😅 Pretty gay.':pct>25?'🤔 A little gay.':'😐 Not very gay.'}`)
            .setThumbnail(target.displayAvatarURL({dynamic:true})).setFooter({text:'Results are random and for fun only'})
        ]});
    }

    // ×rate
    if (command==='rate') {
        const thing=args.join(' ');
        if(!thing) return reply('❌ Usage: `×rate <anything>`');
        const score=Math.floor(Math.random()*101);
        const bar='█'.repeat(Math.floor(score/10))+'░'.repeat(10-Math.floor(score/10));
        const verdict=score>=90?'🌟 Exceptional!':score>=70?'👍 Pretty good!':score>=50?'😐 Mediocre.':score>=30?'👎 Not great.':'💀 Terrible.';
        return reply({embeds:[new EmbedBuilder().setColor(0xe74c3c).setTitle('⭐ Rate-O-Meter')
            .setDescription(`**${thing}**\n\n\`[${bar}]\` **${score}/100**\n\n${verdict}`)
            .setFooter({text:'Results are random'})
        ]});
    }

    // ×highlow
    if (command==='highlow') {
        const bet = parseInt(args[0]);
        if (!bet || bet < 1) return reply('❌ Usage: `×highlow <bet>`');
        if (getUserBalance(uid) < bet) return reply(`❌ Not enough coins. Balance: **${getUserBalance(uid).toLocaleString()} 🪙**`);

        const SUITS = ['♠️','♥️','♦️','♣️'];
        const VALS  = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
        function cardVal(v) { return VALS.indexOf(v); }

        const first = VALS[Math.floor(Math.random() * 13)];
        const suit  = SUITS[Math.floor(Math.random() * 4)];

        const msg = await message.channel.send({ embeds: [new EmbedBuilder()
            .setColor(0xFFD700).setTitle('🃏 High or Low?')
            .setDescription(`Current card: **${first}${suit}**\n\nWill the next card be **higher** or **lower**?\n\n📈 Higher | 📉 Lower`)
            .setFooter({ text: `Bet: ${bet.toLocaleString()} 🪙` }).setTimestamp()
        ]});

        await msg.react('📈');
        await msg.react('📉');

        const collector = msg.createReactionCollector({
            filter: (r, u) => ['📈','📉'].includes(r.emoji.name) && u.id === uid && !u.bot,
            max: 1,
            time: 30000,
            dispose: true
        });

        collector.on('collect', async (r) => {
            try { await r.users.remove(uid); } catch {}
            const pick  = r.emoji.name === '📈' ? 'higher' : 'lower';
            const next  = VALS[Math.floor(Math.random() * 13)];
            const suit2 = SUITS[Math.floor(Math.random() * 4)];
            const won   = (pick === 'higher' && cardVal(next) > cardVal(first)) || (pick === 'lower' && cardVal(next) < cardVal(first));
            const tie   = cardVal(next) === cardVal(first);
            if (!tie) { addCoins(uid, won ? bet : -bet); addXP(gid, uid, won ? 100 : 10); }
            msg.edit({ embeds: [new EmbedBuilder()
                .setColor(tie ? 0xFFD700 : won ? 0x00cc00 : 0xe74c3c)
                .setTitle(`🃏 High or Low — ${tie ? 'Tie!' : won ? 'Correct! 🏆' : 'Wrong!'}`)
                .setDescription(
                    `First: **${first}${suit}** | Next: **${next}${suit2}**\n\n` +
                    `You picked **${pick}**` +
                    `${tie ? '\n🤝 Tie — no coins exchanged.' : won ? `\n🏆 +**${bet.toLocaleString()} 🪙**!` : `\n💸 -**${bet.toLocaleString()} 🪙**`}\n` +
                    `Balance: **${getUserBalance(uid).toLocaleString()} 🪙**`
                )
                .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()
            ]});
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') msg.edit({ embeds: [new EmbedBuilder()
                .setColor(0x888888).setTitle('⏰ Timed out!')] }).catch(() => {});
        });

        return;
    }

    // ×scratch
if (command==='scratch') {
        const bet = parseInt(args[0]);
        if (!bet || bet < 1) return reply('❌ Usage: `×scratch <bet>`');
        if (getUserBalance(uid) < bet) return reply(`❌ Not enough coins. Balance: **${getUserBalance(uid).toLocaleString()} 🪙**`);

        addCoins(uid, -bet);

        const PRIZES   = ['💎','⭐','🍒','💰','🎯','❌'];
        const PAYS     = { '💎': 20, '⭐': 10, '🍒': 5, '💰': 3, '🎯': 2, '❌': 0 };
        const tiles    = Array.from({ length: 9 }, () => PRIZES[Math.floor(Math.random() * PRIZES.length)]);
        const revealed = new Array(9).fill(false);
        const nums     = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];
        let scratched  = 0;
        let gameOver   = false;

        const buildBoard = () => {
            let board = '';
            for (let i = 0; i < 9; i++) {
                board += (revealed[i] ? tiles[i] : '🟦') + ((i + 1) % 3 === 0 ? '\n' : ' ');
            }
            return board;
        };

        const msg = await message.channel.send({ embeds: [new EmbedBuilder()
            .setColor(0x00cc44).setTitle('🎟️ Scratch Card')
            .setDescription(`React with a number to scratch a tile! Pick **3**.\n\n${buildBoard()}`)
            .setFooter({ text: `Bet: ${bet.toLocaleString()} 🪙 | Match 3 to win!` }).setTimestamp()
        ]});

        for (const n of nums) await msg.react(n).catch(() => {});

        const finish = async () => {
            gameOver = true;
            revealed.fill(true);
            const counts = {};
            for (const t of tiles) counts[t] = (counts[t] || 0) + 1;
            const match3 = Object.entries(counts).find(([k, v]) => v >= 3 && k !== '❌');
            const won    = match3 ? bet * PAYS[match3[0]] : 0;
            if (won > 0) { addCoins(uid, won); addXP(gid, uid, 100); } else { addXP(gid, uid, 10); }
            await msg.edit({ embeds: [new EmbedBuilder()
                .setColor(won ? 0xFFD700 : 0xe74c3c)
                .setTitle(`🎟️ Scratch Card — ${won ? 'Winner! 🏆' : 'No Match'}`)
                .setDescription(
                    `${buildBoard()}\n\n` +
                    `${won ? `🏆 Matched 3x ${match3[0]}! +**${won.toLocaleString()} 🪙**` : '💸 No match this time.'}\n` +
                    `Balance: **${getUserBalance(uid).toLocaleString()} 🪙**`
                )
                .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()
            ]});
        };

        const collector = msg.createReactionCollector({
            filter: (r, u) => nums.includes(r.emoji.name) && u.id === uid && !u.bot,
            time: 60000,
            dispose: true
        });

        collector.on('collect', async (r) => {
            if (gameOver) return;
            try { await r.users.remove(uid); } catch {}
            const idx = nums.indexOf(r.emoji.name);

            if (revealed[idx]) {
                await msg.edit({ embeds: [new EmbedBuilder()
                    .setColor(0x00cc44).setTitle('🎟️ Scratch Card')
                    .setDescription(`Already scratched! Pick another.\n\n${buildBoard()}`)
                    .setFooter({ text: `${3 - scratched} scratches left` })] });
                return;
            }

            revealed[idx] = true;
            scratched++;

            if (scratched >= 3) {
                collector.stop('done');
                return finish();
            }

            await msg.edit({ embeds: [new EmbedBuilder()
                .setColor(0x00cc44).setTitle('🎟️ Scratch Card')
                .setDescription(`${buildBoard()}`)
                .setFooter({ text: `${3 - scratched} scratches left` })] });
        });

        collector.on('end', (_, reason) => {
            if (!gameOver) finish();
        });

        return;
}
                
        
    // ×crash
    if (command==='crash') {
        const bet = parseInt(args[0]);
        if (!bet || bet < 1) return reply('❌ Usage: `×crash <bet>`');
        if (getUserBalance(uid) < bet) return reply(`❌ Not enough coins. Balance: **${getUserBalance(uid).toLocaleString()} 🪙**`);

        addCoins(uid, -bet);
        const crashAt = +(1 + Math.random() * 9).toFixed(2);
        let mult      = 1.00;
        let cashedOut = false;
        let crashed   = false;
        let interval  = null;

        const msg = await message.channel.send({ embeds: [new EmbedBuilder()
            .setColor(0x00cc44).setTitle('📈 CRASH')
            .setDescription(`Multiplier: **${mult.toFixed(2)}×**\n\nReact 💰 to **cash out** before it crashes!\nBet: **${bet.toLocaleString()} 🪙**`)
            .setFooter({ text: 'Cash out before it crashes!' }).setTimestamp()
        ]});

        await msg.react('💰');

        const collector = msg.createReactionCollector({
            filter: (r, u) => r.emoji.name === '💰' && u.id === uid && !u.bot,
            time: 120000,
            dispose: true
        });

        collector.on('collect', async () => {
            if (cashedOut || crashed) return;
            cashedOut = true;
            if (interval) clearInterval(interval);
            collector.stop('done');

            const winnings = Math.floor(bet * mult);
            addCoins(uid, winnings);
            addXP(gid, uid, 100);

            await msg.edit({ embeds: [new EmbedBuilder()
                .setColor(0x00cc44).setTitle('💰 Cashed Out!')
                .setDescription(
                    `Cashed out at **${mult.toFixed(2)}×**!\n` +
                    `🏆 +**${winnings.toLocaleString()} 🪙**\n` +
                    `Balance: **${getUserBalance(uid).toLocaleString()} 🪙**`
                )
                .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()
            ]});
        });

        interval = setInterval(async () => {
            if (cashedOut || crashed) { clearInterval(interval); return; }

            mult = +(mult + 0.1).toFixed(2);

            if (mult >= crashAt) {
                crashed = true;
                clearInterval(interval);
                collector.stop('done');
                addXP(gid, uid, 10);
                await msg.edit({ embeds: [new EmbedBuilder()
                    .setColor(0xe74c3c).setTitle('💥 CRASHED!')
                    .setDescription(`Crashed at **${crashAt}×**!\n💸 Lost **${bet.toLocaleString()} 🪙**\nBalance: **${getUserBalance(uid).toLocaleString()} 🪙**`)
                    .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()
                ]}).catch(() => {});
                return;
            }

            await msg.edit({ embeds: [new EmbedBuilder()
                .setColor(mult > 3 ? 0xFFD700 : 0x00cc44).setTitle('📈 CRASH')
                .setDescription(
                    `Multiplier: **${mult.toFixed(2)}×**\n\n` +
                    `React 💰 to **cash out**!\n` +
                    `Bet: **${bet.toLocaleString()} 🪙** → **${Math.floor(bet * mult).toLocaleString()} 🪙**`
                )
                .setFooter({ text: 'Cash out before it crashes!' }).setTimestamp()
            ]}).catch(() => {});
        }, 2000);

        return;
    }

    // ×wheel
    if (command==='wheel') {
        const bet = parseInt(args[0]);
        if (!bet || bet < 1) return reply('❌ Usage: `×wheel <bet>`');
        if (getUserBalance(uid) < bet) return reply(`❌ Not enough coins. Balance: **${getUserBalance(uid).toLocaleString()} 🪙**`);

        const SEGMENTS = [
            { label: '2×',   mult: 2,   color: '#e74c3c' },
            { label: '0×',   mult: 0,   color: '#333333' },
            { label: '1.5×', mult: 1.5, color: '#3498db' },
            { label: '3×',   mult: 3,   color: '#2ecc71' },
            { label: '0×',   mult: 0,   color: '#333333' },
            { label: '1×',   mult: 1,   color: '#9b59b6' },
            { label: '0×',   mult: 0,   color: '#333333' },
            { label: '5×',   mult: 5,   color: '#FFD700' },
        ];

        const finalIdx = Math.floor(Math.random() * SEGMENTS.length);

        function buildWheel(highlightIdx) {
            const canvas = createCanvas(440, 440);
            const ctx    = canvas.getContext('2d');
            const cx = 220, cy = 220, r = 180;
            const slice = Math.PI * 2 / SEGMENTS.length;

            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, 440, 440);

            for (let i = 0; i < SEGMENTS.length; i++) {
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, r, i * slice, (i + 1) * slice);
                ctx.closePath();
                ctx.fillStyle = i === highlightIdx ? '#ffffff' : SEGMENTS[i].color;
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth   = 2;
                ctx.stroke();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(i * slice + slice / 2);
                ctx.fillStyle  = i === highlightIdx ? '#000000' : '#ffffff';
                ctx.font       = 'bold 18px sans-serif';
                ctx.textAlign  = 'right';
                ctx.fillText(SEGMENTS[i].label, r - 15, 6);
                ctx.restore();
            }

            // Arrow points at the highlighted segment from outside the wheel
            const arrowAngle = highlightIdx * slice + slice / 2;
            const arrowDist  = r + 30;
            const ax = cx + Math.cos(arrowAngle) * arrowDist;
            const ay = cy + Math.sin(arrowAngle) * arrowDist;

            ctx.save();
            ctx.translate(ax, ay);
            ctx.rotate(arrowAngle + Math.PI); // point inward toward center
            ctx.fillStyle   = '#FFD700';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth   = 2;
            ctx.beginPath();
            ctx.moveTo(0, -14);
            ctx.lineTo(10, 10);
            ctx.lineTo(-10, 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Center cap
            ctx.fillStyle   = '#1a1a2e';
            ctx.beginPath();
            ctx.arc(cx, cy, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth   = 2;
            ctx.stroke();

            return new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'wheel.png' });
        }

        // Spin frames — simulate wheel moving through segments
        const spinFrames = [];
        const totalFrames = 10;
        for (let i = 0; i < totalFrames; i++) {
            // Last 3 frames slow down toward final
            if (i >= totalFrames - 3) {
                spinFrames.push((finalIdx - (totalFrames - 1 - i) + SEGMENTS.length) % SEGMENTS.length);
            } else {
                spinFrames.push(Math.floor(Math.random() * SEGMENTS.length));
            }
        }
        spinFrames.push(finalIdx); // always end on final

        // Send initial frame
        const f0  = buildWheel(spinFrames[0]);
        const msg = await message.channel.send({
            embeds: [new EmbedBuilder()
                .setColor(0x888888).setTitle('🎡 Prize Wheel — Spinning...')
                .setDescription(`Spinning...\nBet: **${bet.toLocaleString()} 🪙**`)
                .setImage('attachment://wheel.png')
                .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()
            ],
            files: [f0]
        });

        // Animate through frames
        for (let i = 1; i < spinFrames.length; i++) {
            const delay = i >= spinFrames.length - 4 ? 700 : 300;
            await new Promise(res => setTimeout(res, delay));
            const frame = buildWheel(spinFrames[i]);
            await msg.edit({
                embeds: [new EmbedBuilder()
                    .setColor(0x888888).setTitle('🎡 Prize Wheel — Spinning...')
                    .setDescription(`Spinning...\nBet: **${bet.toLocaleString()} 🪙**`)
                    .setImage('attachment://wheel.png')
                    .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()
                ],
                files: [frame]
            });
        }

        // Final result
        const seg    = SEGMENTS[finalIdx];
        const payout = Math.floor(bet * seg.mult);
        addCoins(uid, payout - bet);
        addXP(gid, uid, payout > 0 ? 100 : 10);

        const finalFrame = buildWheel(finalIdx);
        await msg.edit({
            embeds: [new EmbedBuilder()
                .setColor(payout > bet ? 0xFFD700 : payout > 0 ? 0x3498db : 0xe74c3c)
                .setTitle(`🎡 Prize Wheel — ${seg.label} ${payout > bet ? 'Win! 🏆' : payout > 0 ? 'Break Even!' : 'Loss!'}`)
                .setDescription(
                    `Landed on **${seg.label}**!\n\n` +
                    `${payout > 0 ? `+**${(payout - bet).toLocaleString()} 🪙**` : `💸 -**${bet.toLocaleString()} 🪙**`}\n` +
                    `Balance: **${getUserBalance(uid).toLocaleString()} 🪙**`
                )
                .setImage('attachment://wheel.png')
                .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()
            ],
            files: [finalFrame]
        });

        return;
    }

    // ×war
    if (command==='war') {
        const bet=parseInt(args[0]);
        if(!bet||bet<1) return reply('❌ Usage: `×war <bet>`');
        if(getUserBalance(uid)<bet) return reply(`❌ Not enough coins. Balance: **${getUserBalance(uid).toLocaleString()} 🪙**`);
        const SUITS=['♠️','♥️','♦️','♣️'], VALS=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
        function draw(){return{v:VALS[Math.floor(Math.random()*13)],s:SUITS[Math.floor(Math.random()*4)]};}
        function rank(v){return VALS.indexOf(v);}
        let pc=draw(), bc=draw();
        while(rank(pc.v)===rank(bc.v)){pc=draw();bc=draw();}
        const won=rank(pc.v)>rank(bc.v);
        addCoins(uid,won?bet:-bet); addXP(gid,uid,won?100:10);
        return reply({embeds:[new EmbedBuilder().setColor(won?0x00cc00:0xe74c3c).setTitle(`🃏 War — ${won?'You Win! 🏆':'Bot Wins!'}`)
            .addFields({name:'Your Card',value:`**${pc.v}${pc.s}**`,inline:true},{name:'VS',value:'⚔️',inline:true},{name:'Bot Card',value:`**${bc.v}${bc.s}**`,inline:true})
            .setDescription(`${won?`🏆 +**${bet.toLocaleString()} 🪙**`:`💸 -**${bet.toLocaleString()} 🪙**`}\nBalance: **${getUserBalance(uid).toLocaleString()} 🪙**`)
            .setFooter({text:'SOLDIER² Games'}).setTimestamp()
        ]});
    }

    // ×diceduel
    if (command==='diceduel') {
        const opponent=message.mentions.users.first();
        const bet=parseInt(args[0]);
        if(!bet||bet<1||!opponent||opponent.bot) return reply('❌ Usage: `×diceduel <bet> @opponent`');
        if(getUserBalance(uid)<bet) return reply(`❌ Not enough coins.`);
        if(getUserBalance(opponent.id)<bet) return reply(`❌ <@${opponent.id}> doesn't have enough coins.`);
        const cMsg=await message.channel.send({embeds:[new EmbedBuilder().setColor(0x888888).setTitle('🎲 Dice Duel!')
            .setDescription(`<@${opponent.id}> you've been challenged to a dice duel by <@${uid}>!\nBet: **${bet.toLocaleString()} 🪙**\n\nReact ✅ to accept or ❌ to decline.`)
        ]});
        await cMsg.react('✅'); await cMsg.react('❌');
        const col=await cMsg.awaitReactions({filter:(r,u)=>['✅','❌'].includes(r.emoji.name)&&u.id===opponent.id,max:1,time:30000}).catch(()=>null);
        if(!col?.first()||col.first().emoji.name==='❌') return cMsg.edit({embeds:[new EmbedBuilder().setColor(0xe74c3c).setTitle('❌ Declined')]});
        let p1=Math.floor(Math.random()*6)+1, p2=Math.floor(Math.random()*6)+1;
        while(p1===p2){p1=Math.floor(Math.random()*6)+1;p2=Math.floor(Math.random()*6)+1;}
        const winner=p1>p2?uid:opponent.id, loser=winner===uid?opponent.id:uid;
        addCoins(winner,bet); addCoins(loser,-bet); addXP(gid,winner,100); addXP(gid,loser,10);
        return cMsg.edit({embeds:[new EmbedBuilder().setColor(0x888888).setTitle('🎲 Dice Duel Result!')
            .addFields({name:`<@${uid}>`,value:`🎲 **${p1}**`,inline:true},{name:'VS',value:'⚔️',inline:true},{name:`<@${opponent.id}>`,value:`🎲 **${p2}**`,inline:true})
            .setDescription(`🏆 <@${winner}> wins **${bet.toLocaleString()} 🪙**!`)
            .setFooter({text:'SOLDIER² Games'}).setTimestamp()
        ]});
    }

    // ×race
    if (command==='race') {
        const opponent = message.mentions.users.first();
        const bet      = parseInt(args[0]);
        if (!bet || bet < 1 || !opponent || opponent.bot)
            return reply('❌ Usage: `×race <bet> @opponent`');
        if (opponent.id === uid)
            return reply('❌ You cannot race yourself.');
        if (getUserBalance(uid) < bet)
            return reply(`❌ Not enough coins.`);
        if (getUserBalance(opponent.id) < bet)
            return reply(`❌ <@${opponent.id}> doesn't have enough coins.`);

        // Challenge message
        const cMsg = await message.channel.send({ embeds: [new EmbedBuilder()
            .setColor(0xe74c3c).setTitle('🏁 Race Challenge!')
            .setDescription(`<@${opponent.id}> you've been challenged to a race by <@${uid}>!\nBet: **${bet.toLocaleString()} 🪙**\n\nReact ✅ to accept.`)
            .setFooter({ text: 'Expires in 30 seconds' }).setTimestamp()
        ]});
        await cMsg.react('✅');

        const accepted = await cMsg.awaitReactions({
            filter: (r, u) => r.emoji.name === '✅' && u.id === opponent.id,
            max: 1, time: 30000
        }).catch(() => null);

        if (!accepted?.first())
            return cMsg.edit({ embeds: [new EmbedBuilder()
                .setColor(0x888888).setTitle('❌ Race Declined')
                .setDescription(`<@${opponent.id}> did not respond in time.`)] });

        // Race start
        await cMsg.edit({ embeds: [new EmbedBuilder()
            .setColor(0xFFD700).setTitle('🏁 RACE START!')
            .setDescription(`**BOTH PLAYERS** react ⚡ as fast as possible!\n<@${uid}> vs <@${opponent.id}>\n\nBet: **${bet.toLocaleString()} 🪙**`)
            .setFooter({ text: 'First to react wins!' }).setTimestamp()
        ]});
        await cMsg.react('⚡');

        // Track who reacted first using a collector with individual collect events
        let raceWinner = null;

        const raceCollector = cMsg.createReactionCollector({
            filter: (r, u) => r.emoji.name === '⚡' && [uid, opponent.id].includes(u.id) && u.id !== client.user.id,
            time: 15000
        });

        raceCollector.on('collect', (r, u) => {
            if (!raceWinner) {
                raceWinner = u.id;
                raceCollector.stop('winner');
            }
        });

        raceCollector.on('end', async (collected, reason) => {
            if (reason === 'time' || !raceWinner) {
                return cMsg.edit({ embeds: [new EmbedBuilder()
                    .setColor(0x888888).setTitle('🏁 Race')
                    .setDescription('Nobody reacted in time! No coins exchanged.')
                    .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()] });
            }

            const loser = raceWinner === uid ? opponent.id : uid;
            addCoins(raceWinner, bet);
            addCoins(loser, -bet);
            addXP(gid, raceWinner, 100);
            addXP(gid, loser, 10);

            return cMsg.edit({ embeds: [new EmbedBuilder()
                .setColor(0x00cc00).setTitle('🏁 Race Result!')
                .setDescription(
                    `⚡ <@${raceWinner}> reacted first and wins **${bet.toLocaleString()} 🪙**!\n` +
                    `<@${loser}> was too slow.\n\n` +
                    `Balance: **${getUserBalance(raceWinner).toLocaleString()} 🪙**`
                )
                .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()] });
        });

        return;
    }

    // ×hangman
    if (command==='hangman') {
        const WORDS = ['soldier','discord','military','fortress','commander','battalion','sergeant','lieutenant','colonel','general','operation','classified','protocol','tactical','squadron'];
        const word    = WORDS[Math.floor(Math.random() * WORDS.length)];
        const guessed = new Set();
        let wrong     = 0;
        const MAX_WRONG = 6;

        const GALLOWS = [
            '```\n\n\n\n\n=========```',
            '```\n  |\n  |\n  |\n  |\n=========```',
            '```\n  +---+\n  |\n  |\n  |\n  |\n=========```',
            '```\n  +---+\n  |   |\n  O   |\n      |\n      |\n=========```',
            '```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n=========```',
            '```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n=========```',
            '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n=========```',
        ];

        const display    = () => word.split('').map(l => guessed.has(l) ? l : '_').join(' ');
        const wrongList  = () => [...guessed].filter(l => !word.includes(l)).join(' ') || 'none';
        const buildEmbed = () => new EmbedBuilder()
            .setColor(wrong >= MAX_WRONG ? 0xe74c3c : 0x3498db)
            .setTitle('🔤 Hangman')
            .setDescription(
                `${GALLOWS[wrong]}\n\n` +
                `**Word:** \`${display()}\`\n` +
                `**Wrong guesses (${wrong}/${MAX_WRONG}):** ${wrongList()}\n\n` +
                `Type a **single letter** in chat to guess!`
            )
            .setFooter({ text: 'SOLDIER² Games' }).setTimestamp();

        const msg = await message.channel.send({ embeds: [buildEmbed()] });

        const doGuess = async () => {
            if (wrong >= MAX_WRONG || display().replace(/ /g, '') === word) return;

            const chatFilter = m =>
                m.author.id === uid &&
                !m.author.bot &&
                m.content.length === 1 &&
                /^[a-zA-Z]$/.test(m.content);

            const col = await message.channel.awaitMessages({
                filter: chatFilter,
                max: 1,
                time: 60000,
                errors: ['time']
            }).catch(() => null);

            if (!col?.first()) {
                return msg.edit({ embeds: [new EmbedBuilder()
                    .setColor(0x888888).setTitle('⏰ Hangman timed out!')
                    .setDescription(`The word was **${word}**`)
                    .setFooter({ text: 'SOLDIER² Games' })] });
            }

            const letter = col.first().content.toLowerCase();

            if (guessed.has(letter)) {
                await msg.edit({ embeds: [new EmbedBuilder()
                    .setColor(0x3498db).setTitle('🔤 Hangman')
                    .setDescription(
                        `${GALLOWS[wrong]}\n\n` +
                        `**Word:** \`${display()}\`\n` +
                        `**Wrong guesses (${wrong}/${MAX_WRONG}):** ${wrongList()}\n\n` +
                        `⚠️ You already guessed **${letter}**! Try another letter.`
                    )
                    .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()] });
                return doGuess();
            }

            guessed.add(letter);
            if (!word.includes(letter)) wrong++;

            if (wrong >= MAX_WRONG) {
                addXP(gid, uid, 10);
                return msg.edit({ embeds: [new EmbedBuilder()
                    .setColor(0xe74c3c).setTitle('💀 You were hanged!')
                    .setDescription(
                        `${GALLOWS[MAX_WRONG]}\n\n` +
                        `The word was **${word}**\n` +
                        `Wrong guesses: ${wrongList()}`
                    )
                    .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()] });
            }

            if (display().replace(/ /g, '') === word) {
                addXP(gid, uid, 100);
                addCoins(uid, 500);
                return msg.edit({ embeds: [new EmbedBuilder()
                    .setColor(0x00cc00).setTitle('✅ You guessed it!')
                    .setDescription(
                        `The word was **${word}**!\n\n` +
                        `+**500 🪙** +**100 XP**\n` +
                        `Guessed letters: ${[...guessed].join(' ')}`
                    )
                    .setFooter({ text: 'SOLDIER² Games' }).setTimestamp()] });
            }

            await msg.edit({ embeds: [buildEmbed()] });
            doGuess();
        };

        doGuess();
        return;
    }

    // ×wordle
    if (command==='wordle') {
        const WORDS = ['brave','sword','guard','steel','force','ranks','staff','march','scout','tower','flank','blitz','radio','siege','scout'];
        const word  = WORDS[Math.floor(Math.random() * WORDS.length)];
        let attempts  = 0;
        const MAX     = 6;
        const guesses = [];
        let wordleMsg = null;

        const buildCanvas = () => {
            const canvas = createCanvas(350, 420);
            const ctx    = canvas.getContext('2d');
            ctx.fillStyle = '#121213';
            ctx.fillRect(0, 0, 350, 420);

            for (let r = 0; r < MAX; r++) {
                const guess  = guesses[r] || '';
                for (let c = 0; c < 5; c++) {
                    const x      = 15 + c * 65;
                    const y      = 15 + r * 65;
                    const letter = guess[c] || '';
                    let bg       = '#3a3a3c';

                    if (letter) {
                        if (word[c] === letter)       bg = '#538d4e'; // green
                        else if (word.includes(letter)) bg = '#b59f3b'; // yellow
                        else                            bg = '#3a3a3c'; // grey
                    }

                    ctx.fillStyle = bg;
                    ctx.beginPath(); ctx.roundRect(x, y, 60, 60, 5); ctx.fill();
                    ctx.fillStyle  = '#ffffff';
                    ctx.font       = 'bold 28px sans-serif';
                    ctx.textAlign  = 'center';
                    ctx.fillText(letter.toUpperCase(), x + 30, y + 42);
                }
            }
            return canvas.toBuffer('image/png');
        };

        const sendOrEdit = async () => {
            const att = new AttachmentBuilder(buildCanvas(), { name: 'wordle.png' });
            if (!wordleMsg) {
                wordleMsg = await message.channel.send({
                    embeds: [new EmbedBuilder()
                        .setColor(0x538d4e).setTitle('🟩 Wordle')
                        .setDescription(`Guess the **5-letter** word! Type in chat.\n**${MAX - attempts} guesses left.**`)
                        .setImage('attachment://wordle.png')
                        .setFooter({ text: 'SOLDIER² Games' })
                    ],
                    files: [att]
                });
            } else {
                await wordleMsg.edit({
                    embeds: [new EmbedBuilder()
                        .setColor(0x538d4e).setTitle('🟩 Wordle')
                        .setDescription(`**${MAX - attempts} guesses left.**`)
                        .setImage('attachment://wordle.png')
                        .setFooter({ text: 'SOLDIER² Games' })
                    ],
                    files: [att]
                });
            }
        };

        await sendOrEdit();

        const doGuess = async () => {
            const chatFilter = m =>
                m.author.id === uid &&
                !m.author.bot &&
                m.content.length === 5 &&
                /^[a-zA-Z]+$/.test(m.content);

            const col = await message.channel.awaitMessages({
                filter: chatFilter,
                max: 1,
                time: 60000,
                errors: ['time']
            }).catch(() => null);

            if (!col?.first()) {
                return message.channel.send(`⏰ <@${uid}> timed out! The word was **${word.toUpperCase()}**.`);
            }

            const guess = col.first().content.toLowerCase();
            guesses.push(guess);
            attempts++;
            await sendOrEdit();

            if (guess === word) {
                addXP(gid, uid, 100);
                addCoins(uid, 1000);
                return message.channel.send(`✅ <@${uid}> got **${word.toUpperCase()}** in ${attempts} tr${attempts === 1 ? 'y' : 'ies'}! +**1000 🪙**`);
            }

            if (attempts >= MAX) {
                addXP(gid, uid, 10);
                return message.channel.send(`💀 <@${uid}> ran out of guesses! The word was **${word.toUpperCase()}**.`);
            }

            doGuess();
        };

        doGuess();
        return;
    }

    // ×daily
    if (command==='daily') {
        if(!botData.gameCooldowns) botData.gameCooldowns={};
        if(!botData.gameCooldowns[uid]) botData.gameCooldowns[uid]={};
        const last=botData.gameCooldowns[uid].daily||0;
        const now=Date.now(); const CD=86400000;
        if(now-last<CD){
            const left=CD-(now-last);
            const h=Math.floor(left/3600000), m=Math.floor((left%3600000)/60000);
            return reply(`⏰ Daily already claimed! Come back in **${h}h ${m}m**.`);
        }
        botData.gameCooldowns[uid].daily=now;
        const amount=1000+Math.floor(Math.random()*500);
        addCoins(uid,amount); addXP(gid,uid,50); markDirty(); scheduleSave();
        return reply({embeds:[new EmbedBuilder().setColor(0xFFD700).setTitle('💰 Daily Reward!')
            .setDescription(`<@${uid}> claimed their daily reward!\n\n+**${amount.toLocaleString()} 🪙**\nBalance: **${getUserBalance(uid).toLocaleString()} 🪙**`)
            .setFooter({text:'Come back tomorrow!'}).setTimestamp()
        ]});
    }

    // ×work
    if (command==='work') {
        if(!botData.gameCooldowns) botData.gameCooldowns={};
        if(!botData.gameCooldowns[uid]) botData.gameCooldowns[uid]={};
        const last=botData.gameCooldowns[uid].work||0;
        const now=Date.now(); const CD=3600000;
        if(now-last<CD){
            const left=CD-(now-last);
            const m=Math.floor(left/60000), s=Math.floor((left%60000)/1000);
            return reply(`⏰ You're still on duty! Back in **${m}m ${s}s**.`);
        }
        botData.gameCooldowns[uid].work=now;
        const JOBS=[
            {title:'🪖 Army Soldier',msgs:['completed a combat patrol','secured the perimeter','ran drills with the unit','conducted a weapons inspection']},
            {title:'👮 Police Officer',msgs:['responded to a call','filed incident reports','conducted a traffic stop','patrolled the district']},
            {title:'🛡️ Security Guard',msgs:['monitored the premises','checked IDs at the gate','responded to an alarm','completed a security sweep']},
            {title:'🔒 Correctional Officer',msgs:['managed cell block operations','conducted inmate count','supervised yard time','completed paperwork']},
            {title:'⭐ Constable',msgs:['served legal documents','assisted local law enforcement','conducted community patrols','responded to a dispute']},
            {title:'🤠 Sheriff',msgs:['kept order in the county','served a warrant','assisted a deputy','held court security']},
            {title:'🚧 Border Patrol Agent',msgs:['monitored the border line','processed entry documents','conducted a vehicle inspection','responded to a crossing alert']},
            {title:'🧊 ICE Agent',msgs:['executed an enforcement operation','processed case files','conducted a compliance check','coordinated with local PD']},
            {title:'✈️ TSA Officer',msgs:['screened passengers at the checkpoint','flagged a suspicious bag','ran security drills','processed a long security line']},
            {title:'🚔 State Trooper',msgs:['patrolled the highway','responded to an accident','issued traffic citations','conducted a sobriety checkpoint']},
            {title:'🚁 Military Police',msgs:['secured the base entrance','responded to an on-base incident','conducted a routine patrol','assisted with a criminal investigation']},
            {title:'🎖️ Sergeant',msgs:['led a squad through training','debriefed the platoon','supervised equipment maintenance','filed an after-action report']},
            {title:'🦅 Air Marshal',msgs:['completed a flight security detail','monitored suspicious passengers','filed a threat assessment report','coordinated with the flight crew']},
        ];
        const job=JOBS[Math.floor(Math.random()*JOBS.length)];
        const action=job.msgs[Math.floor(Math.random()*job.msgs.length)];
        const earned=300+Math.floor(Math.random()*400);
        addCoins(uid,earned); addXP(gid,uid,30); markDirty(); scheduleSave();
        return reply({embeds:[new EmbedBuilder().setColor(0x2ecc71).setTitle(`${job.title}`)
            .setDescription(`<@${uid}> ${action} and earned **${earned.toLocaleString()} 🪙**!\nBalance: **${getUserBalance(uid).toLocaleString()} 🪙**`)
            .setFooter({text:'Cooldown: 1 hour'}).setTimestamp()
        ]});
    }

    // ×rob
    if (command==='rob') {
        const target=message.mentions.users.first()||await resolveUser(client,args[0]);
        if(!target||target.bot) return reply('❌ Usage: `×rob @user`');
        if(target.id===uid) return reply('❌ You cannot rob yourself.');
        if(!botData.gameCooldowns) botData.gameCooldowns={};
        if(!botData.gameCooldowns[uid]) botData.gameCooldowns[uid]={};
        const last=botData.gameCooldowns[uid].rob||0;
        const now=Date.now(); const CD=1800000;
        if(now-last<CD){
            const left=CD-(now-last);
            const m=Math.floor(left/60000), s=Math.floor((left%60000)/1000);
            return reply(`⏰ Lay low! Rob cooldown: **${m}m ${s}s** left.`);
        }
        const targetBal=getUserBalance(target.id);
        if(targetBal<100) return reply(`❌ <@${target.id}> is broke. Not worth the risk.`);
        botData.gameCooldowns[uid].rob=now; markDirty(); scheduleSave();
        const success=Math.random()<0.45;
        if(success){
            const stolen=Math.floor(targetBal*(0.1+Math.random()*0.2));
            addCoins(target.id,-stolen); addCoins(uid,stolen); addXP(gid,uid,100);
            return reply({embeds:[new EmbedBuilder().setColor(0x00cc00).setTitle('🦹 Robbery Successful!')
                .setDescription(`<@${uid}> robbed <@${target.id}> and got away with **${stolen.toLocaleString()} 🪙**!\nBalance: **${getUserBalance(uid).toLocaleString()} 🪙**`)
                .setFooter({text:'SOLDIER² Games'}).setTimestamp()
            ]});
        } else {
            const fine=Math.floor(getUserBalance(uid)*(0.1+Math.random()*0.15));
            addCoins(uid,-fine); addXP(gid,uid,10);
            const member=message.guild.members.cache.get(uid);
            if(member) await member.timeout(5*60*1000,'Caught robbing').catch(()=>{});
            return reply({embeds:[new EmbedBuilder().setColor(0xe74c3c).setTitle('🚔 Caught!')
                .setDescription(`<@${uid}> got caught trying to rob <@${target.id}>!\n\nFined **${fine.toLocaleString()} 🪙** and muted for **5 minutes**.\nBalance: **${getUserBalance(uid).toLocaleString()} 🪙**`)
                .setFooter({text:'Do the crime, do the time.'}).setTimestamp()
            ]});
        }
    }

    // ×sus
    if (command==='sus') {
        const target=message.mentions.users.first()||message.author;
        const pct=Math.floor(Math.random()*101);
        const bar='█'.repeat(Math.floor(pct/10))+'░'.repeat(10-Math.floor(pct/10));
        return reply({embeds:[new EmbedBuilder().setColor(0xc0392b).setTitle('📮 Sus Meter')
            .setDescription(`**${target.username}** is...\n\n\`[${bar}]\` **${pct}% sus**\n\n${pct>75?'🔴 VERY sus. Eject them.':pct>50?'🟠 Pretty sus ngl.':pct>25?'🟡 A little sus.':'🟢 Not sus at all.'}`)
            .setThumbnail(target.displayAvatarURL({dynamic:true})).setFooter({text:'Among Us vibes only'})
        ]});
    }

    // ×iq
    if (command==='iq') {
        const target=message.mentions.users.first()||message.author;
        const iq=Math.floor(Math.random()*201)+50;
        const bar='█'.repeat(Math.min(10,Math.floor((iq-50)/20)))+'░'.repeat(Math.max(0,10-Math.min(10,Math.floor((iq-50)/20))));
        const verdict=iq>=180?'🧠 Galaxy brain.':iq>=140?'🎓 Genius level.':iq>=110?'👍 Above average.':iq>=90?'😐 Average.':iq>=70?'🤔 Below average.':'💀 Yikes.';
        return reply({embeds:[new EmbedBuilder().setColor(0x9b59b6).setTitle('🧠 IQ Test Results')
            .setDescription(`**${target.username}**'s IQ is...\n\n\`[${bar}]\` **${iq}**\n\n${verdict}`)
            .setThumbnail(target.displayAvatarURL({dynamic:true})).setFooter({text:'Totally scientific'})
        ]});
    }

    // ×pp
    if (command==='pp') {
        const target=message.mentions.users.first()||message.author;
        const size=Math.floor(Math.random()*16);
        const bar='8'+'='+'='.repeat(size)+'D';
        return reply({embeds:[new EmbedBuilder().setColor(0xe67e22).setTitle('📏 PP Size')
            .setDescription(`**${target.username}**'s pp:\n\n\`${bar}\` **(${size} inches)**\n\n${size>=14?'💀 Dangerous.':size>=10?'😳 Impressive.':size>=6?'😊 Respectable.':size>=3?'😅 It\'s fine.':'🤏 RIP.'}`)
            .setThumbnail(target.displayAvatarURL({dynamic:true})).setFooter({text:'Results are random and for fun only'})
        ]});
    }

    // ×ship
    if (command==='ship') {
        const u1=message.mentions.users.first();
        const u2=message.mentions.users.at ? message.mentions.users.at(1) : [...message.mentions.users.values()][1];
        if(!u1||!u2) return reply('❌ Usage: `×ship @user1 @user2`');
        const pct=Math.floor(Math.random()*101);
        const canvas=createCanvas(500,120); const ctx=canvas.getContext('2d');
        ctx.fillStyle='#1a1a2e'; ctx.fillRect(0,0,500,120);
        const grad=ctx.createLinearGradient(0,0,500,0);
        grad.addColorStop(0,'#e91e8c'); grad.addColorStop(1,'#ff6b9d');
        ctx.fillStyle='#333333'; ctx.beginPath(); ctx.roundRect(20,45,460,30,15); ctx.fill();
        ctx.fillStyle=grad; ctx.beginPath(); ctx.roundRect(20,45,Math.floor(460*(pct/100)),30,15); ctx.fill();
        ctx.fillStyle='#ffffff'; ctx.font='bold 16px sans-serif'; ctx.textAlign='center';
        ctx.fillText(`💕 ${pct}% compatible 💕`,250,66);
        ctx.font='14px sans-serif';
        ctx.fillText(u1.username,80,30); ctx.fillText(u2.username,420,30);
        ctx.font='24px sans-serif'; ctx.fillText('❤️',250,30);
        const att=new AttachmentBuilder(canvas.toBuffer('image/png'),{name:'ship.png'});
        const verdict=pct>=90?'💍 Soulmates!':pct>=70?'💕 Great match!':pct>=50?'🙂 Could work.':pct>=30?'😬 Unlikely.':'💔 Terrible match.';
        return message.channel.send({embeds:[new EmbedBuilder().setColor(0xe91e8c).setTitle('💕 Ship Meter')
            .setDescription(`**${u1.username}** ❤️ **${u2.username}**\n\n**${pct}% compatible** — ${verdict}`)
            .setImage('attachment://ship.png').setFooter({text:'SOLDIER² Games'}).setTimestamp()
        ],files:[att]});
                    }
// =========================================================
//  HELP COMMANDS
// =========================================================

    if (command === 'help') {
        const embed1 = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('📖 SOLDIER² — Commands (1/3)')
            .setDescription(
                `**━━━ RANK COMMANDS ━━━**\n` +
                `• \`${prefix}ranks\` — View full rank hierarchy\n` +
                `• \`${prefix}myrank\` — View your current rank\n` +
                `• \`${prefix}promote @user <rank>\` — Promote a user\n` +
                `• \`${prefix}demote @user [rank]\` — Demote a user\n` +
                `• \`${prefix}csmtransfer @user\` — Transfer CSM rank\n` +
                `• \`${prefix}globalranks\` — View global rank list *(Officers+)*\n` +
                `• \`${prefix}serverranks\` — View server rank list *(Officers+/CSM)*\n\n` +
                `**━━━ MODERATION ━━━**\n` +
                `• \`${prefix}kick @user [reason]\` — Kick a user\n` +
                `• \`${prefix}ban @user [reason]\` — Permanently ban a user\n` +
                `• \`${prefix}target\` — Autodelete user's messages\n` +
                `• \`${prefix}unban <userID>\` — Unban by ID\n` +
                `• \`${prefix}mute @user [duration] [reason]\` — Timeout a user\n` +
                `• \`${prefix}unmute @user\` — Remove timeout\n` +
                `• \`${prefix}warn @user <reason>\` — Issue a warning\n` +
                `• \`${prefix}warnings @user\` — View all warnings\n` +
                `• \`${prefix}clearwarnings @user\` — Clear all warnings\n` +
                `• \`${prefix}removewarning @user <id>\` — Remove one warning\n` +
                `• \`${prefix}softban @user [reason]\` — Ban+unban (clears messages)\n` +
                `• \`${prefix}tempban @user <duration> [reason]\` — Temp ban\n` +
                `• \`${prefix}tempmute @user <duration> [reason]\` — Temp mute\n` +
                `• \`${prefix}massban @user1 @user2...\` — Ban multiple users\n\n` +
                `**━━━ WELCOME SYSTEM ━━━**\n` +
                `• \`${prefix}setwelcome #channel <hexcolor> <message> [gif]\` — Set server welcome message (Staff)\n` +
                `• \`${prefix}deletewelcome\` — Remove the welcome message (Staff)\n` +
                `• \`${prefix}setleave #channel <hexcolor> <message> [gif]\` — Set server leave message (Staff)\n` +
                `• \`${prefix}deleteleave\` — Remove the leave message (Staff)\n` +
                `• \`${prefix}testwelcome\` — Test welcome/leave messages (Staff)\n\n` +
               `**━━━ BIRTHDAYS ━━━**\n` +
                `• \`${prefix}birthday <MM/DD> or <MM/DD/YYYY>\` — Register your own birthday\n` +
               `• \`${prefix}removebirthday\` — Remove your registered birthday\n` +
               `• \`${prefix}birthdaylist\` — View all birthdays in this server *(Officers+)*\n` +
               `• \`${prefix}setbirthday @user <MM/DD> or <MM/DD/YYYY>\` — Set a birthday for someone *(Officers+)*\n` +
               `• \`${prefix}setbirthdaychannel <channelID>\` — Set the birthday announcement channel *(Enlisted+)*\n` +
               `• \`${prefix}enablebirthdays\` — Enable birthday announcements *(Enlisted+)*\n` +
               `• \`${prefix}disablebirthdays\` — Disable birthday announcements *(Enlisted+)*\n` +
               `• \`${prefix}setbirthdaymessage <#hexColor> <message>\` — Custom birthday message & color *(Enlisted+)*\n` +
               `• \`${prefix}testbirthday\` — Preview the birthday embed\n\n` +
                `**━━━ MESSAGE MANAGEMENT ━━━**\n` +
                `• \`${prefix}purge <amount>\` ��� Delete X messages\n` +
                `• \`${prefix}purgeuser @user <amount>\` — Delete user messages\n` +
                `• \`${prefix}purgebot <amount>\` — Delete bot messages\n` +
                `• \`${prefix}purgelinks <amount>\` — Delete link messages\n` +
                `• \`${prefix}lock [#channel]\` — Lock a channel\n` +
                `• \`${prefix}unlock [#channel]\` — Unlock a channel\n` +
                `• \`${prefix}slowmode <seconds>\` — Set slowmode`
            );

        const embed2 = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('📖 SOLDIER² — Commands (2/3)')
            .setDescription(
                `**━━━ USER & SERVER INFO ━━━**\n` +
                `• \`${prefix}userinfo [@user]\` — Detailed user info\n` +
                `• \`${prefix}serverinfo [serverID]\` — Server info\n` +
                `• \`${prefix}avatar [@user]\` — View avatar\n` +
                `• \`${prefix}roleinfo @role/roleID\` — Role name, ID, color, perms\n` +
                `• \`${prefix}rolelist\` — List all roles\n` +
                `• \`${prefix}membercount\` — Total members, bots, humans\n` +
                `• \`${prefix}lookup <userID>\` — Look up any user\n` +
                `• \`${prefix}joinpos @user\` — Server join position\n` +
                `• \`${prefix}newaccounts [days]\` — List new accounts\n\n` +
                `**━━━ MODERATION LOGS ━━━**\n` +
                `• \`${prefix}modlog @user\` — View mod history\n` +
                `• \`${prefix}modstats\` — Server mod stats\n` +
                `• \`${prefix}setlogchannel #channel\` — Set log channel\n` +
                `• \`${prefix}modreason <caseID> <reason>\` — Edit case reason\n\n` +
                `**━━━ SERVER PROTECTION ━━━**\n` +
                `• \`${prefix}lockdown\` — Lock ALL channels\n` +
                `• \`${prefix}ping\` — pong!\n` +
                `• \`${prefix}unlockdown\` — Unlock all channels\n` +
                `• \`${prefix}antiraid on/off\` — Toggle anti-raid (auto-restores)\n` +
                `• \`${prefix}antispam on/off\` — Toggle anti-spam\n` +
                `• \`${prefix}antilink on/off\` — Toggle anti-link\n` +
                `• \`${prefix}anticaps <percent>\` — Auto-warn on caps %\n` +
                `• \`${prefix}antiemoji <limit>\` — Limit emojis per message\n` +
                `• \`${prefix}antimentions <limit>\` — Limit mentions per message\n` +
                `• \`${prefix}automod on/off\` — Master automod toggle\n` +
                `• \`${prefix}badwords add/remove <word>\` — Manage banned words\n` +
                `• \`${prefix}badwordslist\` — View banned words\n` +
                `• \`${prefix}setmuterole @role\` — Set mute role\n\n` +
                `**━━━ GOLD COINS & XP ━━━**\n` +
                `• \`${prefix}balance [@user]\` — Check wallet & XP\n` +
                `• \`${prefix}richest [server|global]\` — Richest players leaderboard\n` +
                `• \`${prefix}levels [server|global]\` — Top players by level\n` +
                `• \`${prefix}prestige\` — Prestige at level 100\n` +
                `• \`${prefix}howtoearnxp\` — Learn how to gain XP\n` +
                `• \`${prefix}givecoin @user <amount>\` — Give coins *(Staff)*\n` +
                `• \`${prefix}takecoin @user <amount>\` — Take coins *(Staff)*\n` +
                `• \`${prefix}addxp @user <amount>\` — Add XP *(Staff)*\n` +
                `• \`${prefix}removexp @user <amount>\` — Remove XP *(Staff)*\n` +
                `• \`${prefix}resetxp @user\` — Reset XP *(Staff)*\n` +
                `• \`${prefix}setlevelupchannel #channel\` — Set levelup announcement channel\n\n` +
                `**━━━ ROLES ━━━**\n` +
                `• \`${prefix}giverole @user @role\` — Give Discord role\n` +
                `• \`${prefix}removerole @user @role\` — Remove Discord role\n` +
                ` • \`${prefix}createrole <n> [color]\` — Create a role\n` +
                `• \`${prefix}deleterole @role\` — Delete a role\n` +
                `• \`${prefix}reactionrole\` — create reaction role message\n` +
                `• \`${prefix}rolecolor @role <hex>\` — Change role color`
            );

        const embed3 = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('📖 SOLDIER² — Commands (3/4)')
            .setDescription(
                `**━━━ COUNTING GAME ━━━**\n` +
                `• \`${prefix}counting setchannel #channel\` — Set counting channel *(Enlisted+)*\n` +
                `• \`${prefix}counting setnext <number>\` — Manually jump to a number *(Officers+)*\n` +
                `• \`${prefix}counting leaderboard\` — Global highest-count leaderboard\n\n` +
                `**━━━ QUESTION OF THE DAY ━━━**\n` +
                `• \`${prefix}qotd setchannel #channel\` — Set the QOTD channel *(Enlisted+)*\n` +
                `• \`${prefix}qotd start\` — Start sending questions every 24 hours *(Enlisted+)*\n` +
                `• \`${prefix}qotd stop\` — Stop the question schedule *(Enlisted+)*\n` +
                `• \`${prefix}qotd send\` — Send a bonus question immediately *(Enlisted+)*\n` +
                `• \`${prefix}qotd ping on/off\` — Toggle @everyone ping *(Enlisted+)*\n` +
                `• \`${prefix}qotd status\` — View current QOTD config *(Enlisted+)*\n\n` +
                `**━━━ ANNOUNCEMENTS & UTILITIES ━━━**\n` +
                `• \`${prefix}announce #channel <message>\` — Send announcement\n` +
                `• \`${prefix}say <message>\` — Bot says something\n` +
                `• \`${prefix}info [#color] | <title> | <desc> [| gif]\` — Custom embed\n` +
                `• \`${prefix}poll <question> | <opt1> | <opt2>\` — Create a poll\n` +
                `• \`${prefix}botstats\` — Bot uptime, ping, memory\n` +
                `• \`${prefix}botinfo\` — Full bot info embed\n\n` +
                `**━━━ VERIFICATION ━━━**\n` +
                `• \`${prefix}verify @user\` — Manually verify a user\n` +
                `• \`${prefix}unverify @user\` — Remove verification\n` +
                `• \`${prefix}setverifyrole @role\` — Set verify role\n\n` +
                `**━━━ NICK MANAGEMENT ━━━**\n` +
                `• \`${prefix}nick @user <nickname>\` — Change nickname\n` +
                `• \`${prefix}resetnick @user\` — Reset nickname\n\n` +
                `**━━━ STAFF ━━━**\n` +
                `• \`${prefix}stafflist\` — View all staff\n` +
                `• \`${prefix}spam @user \` — spam plus dm spam\n` +
                `• \`${prefix}aicheck \` — ai status check\n` +
                `• \`${prefix}staffadd @user\` — Add to staff list\n` +
                `• \`${prefix}staffremove @user\` — Remove from staff list\n` +
                `• \`${prefix}duty on/off\` — Toggle on/off duty\n` +
                `• \`${prefix}onduty\` — View who is on duty\n\n` +
                `**━━━ NOTES & WATCHLIST ━━━**\n` +
                `• \`${prefix}note @user <note>\` — Add private staff note\n` +
                `• \`${prefix}notes @user\` — View all notes on a user\n` +
                `• \`${prefix}watchlist @user <reason>\` — Add to watchlist\n` +
                `• \`${prefix}unwatchlist @user\` — Remove from watchlist\n` +
                `• \`${prefix}watchlistview\` — View all watched users\n\n` +
                `**━━━ GIVEAWAYS ━━━**\n` +
                `• \`${prefix}giveawaystart <time> <winners> <prize> [prize2:<p2>] [color:<#hex>] [text:<intro>] [gif:bottom|side|winner|none]\` — Start a giveaway *(Enlisted+)*\n` +
                `• \`${prefix}giveawayend\` — End active giveaway early *(Enlisted+)*\n` +
                `• \`${prefix}giveawaycontinue <messageID>\` — Resume after bot restart *(Enlisted+)*\n\n` +
                `**━━━ CONFIG ━━━**\n` +
                `• \`${prefix}setprefix <prefix>\` — Change server prefix\n` +
                `• \`${prefix}settings\` — View all bot settings\n` +
                `• \`${prefix}disable <command>\` — Disable a command\n` +
                `• \`${prefix}enable <command>\` — Re-enable a command`
            )
            
        const embed4 = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('📖 SOLDIER² — Commands (4/4)')
            .setDescription(
                `**━━━ GAMES ━━━**\n` +
                `• \`${prefix}xpcard [@user]\` — View XP card\n` +
                `• \`${prefix}backgrounds\` — Browse & buy card backgrounds\n` +
                `• \`${prefix}buybg <name>\` — Purchase a background\n` +
                `• \`${prefix}setbg <name>\` — Equip a background\n` +
                `• \`${prefix}setaccent <#hex>\` — Set card accent color\n` +
                `• \`${prefix}8ball <question>\` — Magic 8 Ball\n` +
                `• \`${prefix}dice\` — Roll a dice\n` +
                `• \`${prefix}flip\` — Coin flip\n` +
                `• \`${prefix}flipbet <amount> <heads/tails or @user>\` — Bet on a flip\n` +
                `• \`${prefix}rps [bet] [@user]\` — Rock Paper Scissors\n` +
                `• \`${prefix}roulette <red/black/green/0-36> <bet>\` — Roulette\n` +
                `• \`${prefix}rr\` — Russian Roulette (muted if shot!)\n` +
                `• \`${prefix}slots <bet>\` — Slot Machine\n` +
                `• \`${prefix}blackjack <bet>\` — Blackjack\n` +
                `• \`${prefix}gtn [bet]\` — Guess the Number 0-10\n` +
                `• \`${prefix}biggtn\` — Guess 0-100, win 100k!\n` +
                `• \`${prefix}howgay [@user]\` — Gay meter\n` +
                `• \`${prefix}rate <thing>\` — Rate anything\n` +
                `• \`${prefix}highlow <bet>\` — Higher or lower card\n` +
                `• \`${prefix}scratch <bet>\` — Scratch card\n` +
                `• \`${prefix}crash <bet>\` — Crash multiplier\n` +
                `• \`${prefix}wheel <bet>\` — Prize wheel\n` +
                `• \`${prefix}war <bet>\` — Card war vs bot\n` +
                `• \`${prefix}diceduel <bet> @user\` — Dice duel PvP\n` +
                `• \`${prefix}race <bet> @user\` — React fastest to win\n` +
                `• \`${prefix}hangman\` — Classic hangman\n` +
                `• \`${prefix}wordle\` — 5-letter word game\n` +
                `• \`${prefix}daily\` — Claim daily coins\n` +
                `• \`${prefix}work\` — Work for coins (1hr cooldown)\n` +
                `• \`${prefix}rob @user\` — Rob someone (muted if caught!)\n` +
                `• \`${prefix}sus [@user]\` — Sus meter\n` +
                `• \`${prefix}iq [@user]\` — IQ meter\n` +
                `• \`${prefix}pp [@user]\` — PP size meter\n` +
                `• \`${prefix}ship @user1 @user2\` — Compatibility meter`
            )
            .setImage('https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif')
            .setFooter({ text: 'SOLDIER² — Bot developer: TX-SOLDIER' });


        await message.channel.send({ embeds: [embed1] });
        await message.channel.send({ embeds: [embed2] });
        await message.channel.send({ embeds: [embed3] });
        await message.channel.send({ embeds: [embed4] });
        return;
    }

    // --------------------------------------------------
    // ×staffhelp — Staff help Generals/Officers/Owner only
    // --------------------------------------------------
    if (command === 'staffhelp') {
        if (!isFiveStar(uid) && !isGeneral(uid) && !isOfficer(uid))
            return message.reply('❌ You do not have access to this command list.');

        const embed1 = new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('🔐 SOLDIER² — Staff Commands (1/2)')
            .setDescription(
                `**━━━ REMOTE SERVER CONTROL ━━━**\n` +
                `• \`${prefix}serverlist\` — All servers: name, ID, member count\n` +
                `• \`${prefix}remotekick <serverID> <userID> [reason]\` — Remote kick\n` +
                `• \`${prefix}remoteban <serverID> <userID> [reason]\` — Remote ban\n` +
                `• \`${prefix}remoteunban <serverID> <userID>\` — Remote unban\n` +
                `• \`${prefix}remotelockdown <serverID>\` — Lock all channels remotely\n` +
                `• \`${prefix}remoteunlockdown <serverID>\` — Unlock remotely\n` +
                `• \`${prefix}remotenuke <serverID>\` — Kick all from remote server\n` +
                `• \`${prefix}remoteannounce <serverID> <message>\` — Remote announce\n` +
                `• \`${prefix}servermembers <serverID>\` — List members of a server\n` +
                `• \`${prefix}serverleave <serverID>\` — Force bot to leave *(Owner)*\n\n` +
                `**━━━ SURVEILLANCE ━━━**\n` +
                `• \`${prefix}userlookup <userID>\` — Full profile across all servers\n` +
                `• \`${prefix}trackuser <userID>\` — Get DM'd when user sends a message\n` +
                `• \`${prefix}untrackuser <userID>\` — Stop tracking\n` +
                `• \`${prefix}tracklist\` — View all tracked users\n` +
                `• \`${prefix}flaguser <userID> <reason>\` — Flag user globally\n` +
                `• \`${prefix}unflaguser <userID>\` — Remove global flag\n` +
                `• \`${prefix}flaggedlist\` — View all flagged users\n` +
                `• \`${prefix}crosswarn <userID> <reason>\` — Warn across all servers\n` +
                `• \`${prefix}globalhistory <userID>\` — Full mod history across servers\n\n` +
                `**━━━ GLOBAL ACTIONS ━━━**\n` +
                `• \`${prefix}globalban <userID> [reason]\` — Ban from ALL servers\n` +
                `• \`${prefix}globalunban <userID>\` — Unban from ALL servers\n` +
                `• \`${prefix}globalannounce <message>\` — Announce to all servers\n` +
                `• \`${prefix}globaldm <userID> <message>\` — DM any user\n` +
                `• \`${prefix}massdm <serverID> <message>\` — DM every member of a server\n` +
                `• \`${prefix}broadcast <message>\` — Send to all server system channels`
            );

        const embed2 = new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('🔐 SOLDIER² — Staff Commands (2/2)')
            .setDescription(
                `**━━━ RANK SYSTEM CONTROL ━━━**\n` +
                `• \`${prefix}rankaudit [serverID]\` — View all ranks globally/per server\n` +
                `• \`${prefix}rankwipe <serverID>\` — Wipe all enlisted ranks from a server\n` +
                `• \`${prefix}globalrankwipe\` — Wipe ALL ranks everywhere *(Owner)*\n` +
                `• \`${prefix}rankreport\` — Full rank report across all servers\n\n` +
                `**━━━ GLOBAL ANALYTICS ━━━**\n` +
                `• \`${prefix}globalstats\` — Total users, servers, warnings, cases\n` +
                `• \`${prefix}topservers\` — Servers ranked by member count\n` +
                `• \`${prefix}serverstats [serverID]\` — Detailed stats for a server\n\n` +
                `**━━━ SECURITY & EMERGENCY *(Owner only)* ━━━**\n` +
                `• \`${prefix}nuke\` — Kick ALL members from current server\n` +
                `• \`${prefix}nukeall\` — Kick ALL members from ALL servers\n` +
                `• \`${prefix}emergency <serverID>\` — Lock all + mute all in a server\n` +
                `• \`${prefix}emergencyoff <serverID>\` — Lift emergency mode\n` +
                `• \`${prefix}emergencyall\` — Emergency across ALL servers\n` +
                `• \`${prefix}emergencyoffall\` — Lift emergency across all servers\n\n` +
                `**━━━ BOT MANAGEMENT *(Owner only)* ━━━**\n` +
                `• \`${prefix}botstatus <text>\` — Change bot status\n` +
                `• \`${prefix}botavatar <url>\` — Change bot avatar\n` +
                `• \`${prefix}botname <n>\` — Change bot username\n` +
                `• \`${prefix}classified\` — Bot infrastructure service links *(Generals+)*\n` +
                `• \`${prefix}restart\` — Restart the bot\n` +
                `• \`${prefix}shutdown\` — Shut down the bot\n` +
                `• \`${prefix}forcesave\` — Force save all data to JSONBin immediately *(Owner/Generals/Officers)*\n` +
                `• \`${prefix}cleanjson\` — Strip junk data and save to JSONBin *(Owner/Generals/Officers)*\n` +
                `• \`${prefix}eval <code>\` — Execute raw JS ⚠️\n\n` +
                `**━━━ BLACKLIST *(Owner only)* ━━━**\n` +
                `• \`${prefix}blacklistuser <userID>\` — Block user from bot globally\n` +
                `• \`${prefix}unblacklistuser <userID>\` — Remove user blacklist\n` +
                `• \`${prefix}blacklistserver <serverID>\` — Block server from bot\n` +
                `• \`${prefix}unblacklistserver <serverID>\` — Remove server blacklist\n` +
                `• \`${prefix}blacklistedlist\` — View all blacklisted users & servers`
            )
            .setImage('https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif')
            .setFooter({ text: 'SOLDIER² — Restricted Command List • Bot developer: TX-SOLDIER' });

        await message.channel.send({ embeds: [embed1] });
        await message.channel.send({ embeds: [embed2] });
        return;
    }

});

// ☆ END: MASTER MESSAGE HANDLER/MESSAGE CREATE END ☆ \\

// ============================================================
// ☆ SECTION 7 START: INFRASTRUCTURE & LOGIN ☆ \\
// ============================================================
//  SLASH COMMAND HANDLER /
// ============================================================
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'hello') {
        return interaction.reply('👋 Hello! I am **SOLDIER²** — the Ultimate Mod & Rank Authority System. ★');
    }
});

// ============================================================
//  LOGIN
// ============================================================
client.login(process.env.BOT_TOKEN);

// ☆ END: INFRASTRUCTURE & LOGIN ☆
