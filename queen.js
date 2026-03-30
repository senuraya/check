// MUST BE FIRST LINES — BEFORE require/import baileys
const blocked = [
  'Failed to decrypt message',
  'Bad MAC',
  'Closing session',
  'Closing open session',
  'Session error',
  'SessionEntry',
  'decryptWithSessions',
  'verifyMAC'
]

const origLog = console.log
const origError = console.error
const origWarn = console.warn

console.log = (...args) => {
  if (args.join(' ').match(new RegExp(blocked.join('|'), 'i'))) return
  origLog(...args)
}

console.error = (...args) => {
  if (args.join(' ').match(new RegExp(blocked.join('|'), 'i'))) return
  origError(...args)
}

console.warn = (...args) => {
  if (args.join(' ').match(new RegExp(blocked.join('|'), 'i'))) return
  origWarn(...args)
}

// ========== AUTO-RESTART CONFIG ==========
const AUTO_RESTART_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds
const AUTO_RESTART_BUFFER = 30 * 1000; // 30 seconds buffer time
let restartTimer = null;
let lastRestartTime = 0;
let isRestarting = false;
let conn = null; // Global connection variable
let isBotAlive = false;

// ========== AUTO-RESTART FUNCTIONS ==========
// Add at the top with other global variables
let isAutoRestart = false;

// Modify the scheduleAutoRestart function
async function scheduleAutoRestart() {
  try {
    if (restartTimer) {
      clearTimeout(restartTimer);
    }

    const timeSinceLastRestart = Date.now() - lastRestartTime;
    const timeToNextRestart = Math.max(
      0,
      AUTO_RESTART_INTERVAL - timeSinceLastRestart
    );

    console.log(`⏰ Next auto-restart in ${Math.ceil(timeToNextRestart / 60000)} minutes`);
    
    restartTimer = setTimeout(async () => {
      try {
        console.log('🔄 Auto-restart triggered by timer');
        isAutoRestart = true; // Mark as auto-restart
        await performSoftRestart();
      } catch (error) {
        console.error('❌ Auto-restart failed:', error);
        setTimeout(() => scheduleAutoRestart(), 30000);
      }
    }, timeToNextRestart);

  } catch (error) {
    console.error('❌ Error scheduling auto-restart:', error);
  }
}

async function performSoftRestart() {
  if (isRestarting) {
    console.log('⚠️ Restart already in progress, skipping...');
    return;
  }

  try {
    isRestarting = true;
    console.log('🔄 Starting soft restart...');

    // Mark as not alive
    isBotAlive = false;

    // Close existing connection if it exists
    if (conn) {
      try {
        // Send unavailable presence
        await conn.sendPresenceUpdate('unavailable').catch(() => {});
        
        // Close WebSocket connection
        if (conn.ws && conn.ws.readyState !== conn.ws.CLOSED) {
          conn.ws.close();
        }
        
        // Remove all event listeners
        if (conn.ev) {
          conn.ev.removeAllListeners();
        }
        
        // Clear message retry cache
        if (conn.msgRetryCounterCache) {
          conn.msgRetryCounterCache.flushAll();
        }
        
        conn = null;
        console.log('✅ Connection closed cleanly');
      } catch (cleanupError) {
        console.error('⚠️ Error during cleanup:', cleanupError.message);
      }
    }

    // Clear NodeCache instances
    try {
      const NodeCache = require("node-cache");
      const caches = require('module')._cache;
      Object.keys(caches).forEach(key => {
        if (key.includes('node-cache')) {
          delete caches[key];
        }
      });
    } catch (cacheError) {
      // Ignore cache cleanup errors
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Wait a moment before restarting
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Reconnect
    console.log('🔄 Reconnecting...');
    await connectToWA();

    // Update restart time
    lastRestartTime = Date.now();
    isRestarting = false;
    
    console.log('✅ Soft restart completed successfully');

  } catch (error) {
    console.error('❌ Soft restart failed:', error);
    isRestarting = false;
    
    // Try again after 30 seconds
    setTimeout(() => {
      console.log('🔄 Retrying restart after failure...');
      performSoftRestart();
    }, 30000);
  }
}

// Function to check connection health
async function checkConnectionHealth() {
  if (!conn || !isBotAlive) return false;

  try {
    // Simple health check - try to get user info
    const user = conn.user;
    if (!user || !user.id) {
      console.log('⚠️ Connection health check failed: No user info');
      return false;
    }

    // Check last activity time
    const now = Date.now();
    const timeSinceLastActivity = now - lastRestartTime;
    
    // If connection is older than 20 minutes and seems stale, restart early
    if (timeSinceLastActivity > 20 * 60 * 1000) {
      console.log('⚠️ Connection appears stale, performing early restart');
      await performSoftRestart();
      return false;
    }

    return true;
  } catch (error) {
    console.log('⚠️ Connection health check failed:', error.message);
    return false;
  }
}

// Function to force immediate restart (for debugging)
async function forceRestart() {
  console.log('🔄 Manual restart requested');
  await performSoftRestart();
}

//=================imports=======================
const {
  BufferJSON,
  Browsers,
  WA_DEFAULT_EPHEMERAL,
  default: makeWASocket,
  generateWAMessageFromContent,
  proto,
  getBinaryNodeChildren,
  generateWAMessageContent,
  generateWAMessage,
  prepareWAMessageMedia,
  areJidsSameUser,
  jidNormalizedUser,
  getContentType,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  downloadContentFromMessage,
} = require("anju-xpro-baileys");
const ooo = "`";
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const util = require("util");
const os = require("os");
const FileType = require("file-type");
const AdmZip = require("adm-zip");
const sharp = require("sharp");
const pino = require("pino");
const express = require("express");
const { File } = require("megajs");
const ownerNumber = ["94787751901"];
const l = console.log;
const ALLOWED_NEWSLETTER = "120363420375356804@newsletter"
const DEDUP_TTL = 8000
const seen = new Map();
const NodeCache = require("node-cache");

const isDup = (id) => {
  if (seen.has(id)) return true
  seen.set(id, Date.now())
  setTimeout(() => seen.delete(id), DEDUP_TTL)
  return false
}
//======================================================
function linkToCommand(text, prefix) {
  if (text.includes("〽")) return;
  text = text.trim();

  const map = [
    { regex: /youtube\.com|youtu\.be/, cmd: "yts1" },
    { regex: /instagram\.com/, cmd: "ig" },
    { regex: /facebook\.com|fb\.watch/, cmd: "fb" },
    { regex: /tiktok\.com/, cmd: "tiktok" },
    { regex: /twitter\.com|x\.com/, cmd: "twitter" }
  ];

  for (const m of map) {
    if (m.regex.test(text)) {
      return `${prefix}${m.cmd} ${text}`;
    }
  }

  return text;
}
//======================================================
/**
 * Fetch, resize, and format the thumbnail as a Buffer
 * @param {string} url - The URL of the thumbnail image
 * @returns {Promise<Buffer|null>} - Returns a properly formatted JPEG Buffer
 */
async function getThumbnailBuffer(url) {
  if (!url) {
    console.error("Invalid URL provided for thumbnail.");
    return null;
  }

  try {
    const { data } = await axios.get(url, { responseType: "arraybuffer" });

    // Convert to JPEG and resize to WhatsApp-compatible size
    const processedBuffer = await sharp(data)
      .resize(300, 300) // WhatsApp prefers small images
      .jpeg({ quality: 80 }) // Convert to JPEG format
      .toBuffer();

    return processedBuffer;
  } catch (error) {
    console.error("Error processing thumbnail:", error.message || error);
    return null;
  }
}
//======================================================
// Function to handle status updates
async function handleStatusUpdate(sock, status) {
    try {
        // Add delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        let jid = await jidNormalizedUser(sock.user.id);
        // Handle status from messages.upsert
        if (status.messages && status.messages.length > 0) {
            const msg = status.messages[0];
            if (msg.key && msg.key.remoteJid === 'status@broadcast') {
                try {
                    await sock.readMessages([msg.key]);
                    const sender = msg.key.participant || msg.key.remoteJid;
                    await sock.sendMessage(msg.key.remoteJid, { react: { key: msg.key, text: '💚'}}, { statusJidList: [msg.key.participant, jid] })
                    console.log(`✅ Status Viewed `);
                } catch (err) {
                    if (err.message?.includes('rate-overlimit')) {
                        console.log('⚠️ Rate limit hit, waiting before retrying...');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        await sock.readMessages([msg.key]);
                        const sender = msg.key.participant || msg.key.remoteJid;
                        await sock.sendMessage(msg.key.remoteJid, { react: { key: msg.key, text: '💚'}}, { statusJidList: [msg.key.participant, jid] })
                   } else {
                        throw err;
                    }
                }
                return;
            }
        }

        // Handle direct status updates
        if (status.key && status.key.remoteJid === 'status@broadcast') {
            try {
                await sock.readMessages([status.key]);
                const sender = msg.key.participant || msg.key.remoteJid;
                await sock.sendMessage(msg.key.remoteJid, { react: { key: msg.key, text: '💚'}}, { statusJidList: [msg.key.participant, jid] })
                console.log(`✅ Viewed status from: ${sender.split('@')[0]}`);
            } catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    console.log('⚠️ Rate limit hit, waiting before retrying...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await sock.readMessages([status.key]);
                    const sender = msg.key.participant || msg.key.remoteJid;
                    await sock.sendMessage(msg.key.remoteJid, { react: { key: msg.key, text: '💚'}}, { statusJidList: [msg.key.participant, jid] })
                } else {
                    throw err;
                }
            }
            return;
        }
    } catch (error) {
        console.error('❌ Error in auto status view:', error.message);
    }
}

//===================SESSION============================
const sess = require("./session");
const SESSION_DIR = path.join(__dirname, "/session");
async function sessdl(sessionKey) {
  try {
    // Validate sessionKey format
    if (typeof sessionKey !== 'string' || !sessionKey.trim()) {
      throw new Error("Session key must be a non-empty string");
    }

    // Clean up the sessionKey
    sessionKey = sessionKey.trim();
    
    console.log(`🔍 Attempting to download session with key: ${sessionKey}`);
    
    // API configuration
    const API_URL = "https://19d6da26-56d8-4f65-a619-94edf5f0401c-00-2v1yc6q5f6bya.sisko.replit.dev/";
    const ENDPOINT = `/session/bot-download?key=${encodeURIComponent(sessionKey)}`;
    
    // Download session from API
    const response = await axios({
      method: 'GET',
      url: `${API_URL}${ENDPOINT}`,
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'senura-md',
        'Accept': 'application/json'
      },
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      }
    });
    
    console.log(`📥 API Response Status: ${response.status}`);
    
    // Check if request was successful
    if (response.status !== 200) {
      const errorMsg = response.data?.message || `Server returned ${response.status}`;
      throw new Error(`Failed to download session: ${errorMsg}`);
    }
    
    // Check if we got valid data
    if (!response.data || !response.data.success) {
      throw new Error("Invalid response format from server or session not found");
    }
    
    console.log(`✅ Session data retrieved successfully for number: ${response.data.number}`);
    
    // Remove existing session directory
    try {
      if (fs.existsSync(SESSION_DIR)) {
        console.log(`🧹 Removing existing session directory`);
        await fs.promises.rm(SESSION_DIR, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      console.warn("⚠️ Could not clear session directory:", cleanupError.message);
    }

    // Create fresh session directory
    await fs.promises.mkdir(SESSION_DIR, { recursive: true });
    console.log("📁 Created new session directory");

    // Extract and decode the session data
    const sessionId = response.data.sessionId;
    if (!sessionId) {
      throw new Error("No sessionId in API response");
    }

    // Decode the base64 sessionId to get the actual credentials
    const decodedSession = Buffer.from(sessionId, 'base64').toString('utf-8');
    let sessionData;
    
    try {
      sessionData = JSON.parse(decodedSession);
    } catch (parseError) {
      console.warn("⚠️ Could not parse sessionId as JSON, using raw sessionId");
      // If it's not JSON, it might be already a string representation
      sessionData = decodedSession;
    }

    // Save session data
    const credsPath = path.join(SESSION_DIR, "creds.json");
    
    // Write the session data
    await fs.promises.writeFile(credsPath, JSON.stringify(sessionData, null, 2));
    
    // Verify the file was created
    const stats = await fs.promises.stat(credsPath);
    console.log(`✅ Session saved successfully (${stats.size} bytes)`);
    console.log(`📄 Saved to: ${credsPath}`);
    
    // Save the session key for reference
    const keyPath = path.join(SESSION_DIR, "session_key.txt");
    await fs.promises.writeFile(keyPath, sessionKey);
    
    // Save additional metadata from API response
    const metaPath = path.join(SESSION_DIR, "metadata.json");
    const metadata = {
      key: response.data.key,
      number: response.data.number,
      jsonName: response.data.jsonName,
      source: response.data.source,
      pairedCount: response.data.pairedCount,
      timestamp: response.data.timestamp,
      message: response.data.message,
      downloadedAt: new Date().toISOString()
    };
    
    await fs.promises.writeFile(metaPath, JSON.stringify(metadata, null, 2));
    
    // Also save the original API response for debugging
    const apiResponsePath = path.join(SESSION_DIR, "api_response.json");
    await fs.promises.writeFile(apiResponsePath, JSON.stringify(response.data, null, 2));
    
    return {
      success: true,
      message: response.data.message || "Session downloaded and saved successfully",
      sessionKey: sessionKey,
      number: response.data.number,
      filePath: credsPath,
      fileSize: stats.size,
      timestamp: response.data.timestamp,
      pairedCount: response.data.pairedCount
    };
    
  } catch (err) {
    console.error("❌ Failed to download session:", err.message);
    console.error("Stack trace:", err.stack);
    
    // Re-throw error with context
    throw new Error(`Session download failed: ${err.message}`);
  }
}
// <<==========PORTS===========>>
const port = process.env.PORT || sess.PORT || 8000;
//================ZIP Download====================
const ZIP_DIR = path.join(__dirname, "src");
const EXT_DIR = path.join(__dirname, "./");
async function downloadAndExtractZip() {
  try {
    if (fs.existsSync(ZIP_DIR)) {
      console.log("🔍 'src' directory already exists. Skipping download.");
      return;
    }

    // 1️⃣ Fetch info.json
    const infoRes = await axios.get(
      "https://raw.githubusercontent.com/senuraya/info/refs/heads/main/info.json",
      { timeout: 15000 }
    );

    const ZIP_LINK = infoRes.data?.zip;
    if (!ZIP_LINK) {
      throw new Error("ZIP link not found in info.json");
    }

    // 2️⃣ Download ZIP (IMPORTANT FIX)
    const zipRes = await axios.get(ZIP_LINK, {
      responseType: "arraybuffer",
      timeout: 60000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    const tempZipPath = path.join(__dirname, "temp.zip");
    await fs.promises.writeFile(tempZipPath, zipRes.data);

    // 3️⃣ Extract
    const zip = new AdmZip(tempZipPath);
    zip.extractAllTo(EXT_DIR, true);

    // 4️⃣ Cleanup
    await fs.promises.unlink(tempZipPath);

    console.log("✅ ZIP downloaded and extracted successfully.");
  } catch (error) {
    console.error("❌ Error during download and extraction:");
    console.error(error?.message || error);
    process.exit(1);
  }
}
//===============NIGHT-MODE=====================
function isNightModeActive() {
  const now = new Date();
  // Convert to Sri Lanka time (UTC+5:30)
  const sriLankaOffset = 5.5 * 60; // in minutes
  const localOffset = now.getTimezoneOffset(); // local offset in minutes
  const totalOffset = sriLankaOffset + localOffset;
  const sriLankaTime = new Date(now.getTime() + totalOffset * 60000);
  const hour = sriLankaTime.getHours();
  return hour >= 21 || hour < 6;
}
//=======================================

function scanPlugins(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const full = path.join(dir, file);

    if (fs.lstatSync(full).isDirectory()) {
      scanPlugins(full);
    } else if (file.endsWith(".js")) {
      // load only metadata
      try {
        require(full); 
        //console.log("Meta loaded:", file);
      } catch (e) {
        console.log("Error loading meta:", full, e);
      }
    }
  }
}

const GITHUB_USERNAME = process.env.GITHUB_USERNAME || sess.USERNAME;
const TOKEN = process.env.GITHUB_TOKEN || sess.TOKEN;
const GITHUB_TOKEN = `ghp_${TOKEN}`;
const REPO_NAME = process.env.GITHUB_REPO || sess.REPO_NAME;
const FILE_PATH = 'settings.json';

const defaultSettings = {
  lastPing: new Date().toISOString()
};

// Check or create settings.json
async function checkOrCreateSettingsFile() {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );
    return JSON.parse(Buffer.from(response.data.content, 'base64').toString());
  } catch (error) {
    if (error.response && error.response.status === 404) {
      await updateGitHubSettings(defaultSettings);
      return defaultSettings;
    }
    console.error("❌ Error checking settings.json:", error.message);
    return null;
  }
}

// Update settings.json on GitHub
async function updateGitHubSettings(newSettings) {
  try {
    let sha = null;

    // Try to get current SHA if file exists
    try {
      const response = await axios.get(
        `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`,
        { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
      );
      sha = response.data.sha;
    } catch (err) {
      // File may not exist (first commit)
    }

    const encodedContent = Buffer.from(JSON.stringify(newSettings, null, 2)).toString('base64');

    await axios.put(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        message: `Auto update settings @ ${new Date().toISOString()}`,
        content: encodedContent,
        sha: sha || undefined
      },
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );

    console.log("✅ settings.json committed successfully.");
  } catch (error) {
    console.error("❌ Failed to update settings.json:", error.message);
  }
}
//====================================
async function connectToWA() {
  try {
    await sessdl(sess.SESSION_ID).catch(err => logError("sessdl", err));
    await downloadAndExtractZip().catch(err => logError("downloadAndExtractZip", err));
    console.log("🔥> SENURA MD is starting...");
    //===================================================
    //const { getRegistry,saveRegistryToFile } = require("./src/Utils/registry");
    //await scanPlugins(path.join(__dirname, "src/commands"));
    //await saveRegistryToFile();
    const {
      getBuffer,
      getGroupAdmins,
      getRandom,
      h2k,
      isUrl,
      Json,
      runtime,
      sleep,
      fetchJson,
      fetchBuffer,
      getFile,
    } = require("./src/Utils/functions");
    const { sms, downloadMediaMessage } = require("./src/Utils/msg");
    var {
      updateCMDStore,
      isbtnID,
      getCMDStore,
      getCmdForCmdId,
      getAllSettings,
      connectdb,
      input,
      get,
      updfb,
    } = require("./src/Utils/database");
    //===================================================
    const { version, isLatest } = await fetchLatestBaileysVersion();
    //console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR + "/");
    //const msgRetryCounterCache = new NodeCache()
    //await state.keys.clear?.()
const msgRetryCounterCache = new NodeCache()
const groupCache = new NodeCache()
const conn = makeWASocket({
    version,
    logger: pino({ level: "silent" }), 
    printQRInTerminal: false,
    auth: state,
    syncFullHistory: false,      
    markOnlineOnConnect: true,        
    generateHighQualityLinkPreview: false, 
    msgRetryCounterCache: msgRetryCounterCache, 
    //cachedGroupMetadata: async (jid) => groupCache.get(jid),
    getMessage: async (key) => {
        return undefined; 
    }
});
    //store.bind(conn.ev)
    //===================================================
    connectdb(`+${conn.user.id.split(":")[0]}`);
    conn.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "close") {
        if (lastDisconnect.error.output.statusCode) {
          connectToWA();
        }
      } else if (connection === "open") {
        isBotAlive = true;
        lastRestartTime = Date.now();
        console.log("🔥 SENURA MD connected ✅");
        // Start auto-restart schedule after successful connection
        //scheduleAutoRestart();
    
        // Clear cached sender keys (Baileys internal)
    if (conn.groupMetadataCache) {
      conn.groupMetadataCache.clear();
    }
        // Start periodic health checks (every 5 minutes)
// Only send welcome message if NOT an auto-restart
    if (!isAutoRestart) {
      let up = `
╔════════════════════╗
║ ⚙ ** System Online **
╚════════════════════╝
📊 Connection Success:

| *System Status* | *Details* |
| 
| *Version*          | ${require("./package.json").version}
| *Platform*       | ${os.platform()}
| *Host System* | ${os.hostname()}
---
*Welcome.* Senura MD is running in *Expert Professional Mode*.
Your multi-device service is initialized and ready for command processing.

> SENURA 〽ᗪ`;
  
      try {
  // Wait 10-15 seconds before sending welcome
  setTimeout(async () => {
    await conn.sendMessage(`${conn.user.id.split(":")[0]}@s.whatsapp.net`, {
      image: {
        url: "https://github.com/senuraya/images/blob/main/Gemini_Generated_Image_pu3x97pu3x97pu3x%20(1).png?raw=true",
      },
      caption: up,
    });
    console.log("✅ Welcome message sent (delayed)");
  }, 5000); // 15 seconds delay
} catch (err) {
  console.error("❌ Failed to send welcome message:", err);
}
    } else {
      console.log("✅ Auto-restart completed (no welcome message sent)");
      isAutoRestart = false; // Reset flag
    }

      }
    });
    //===================================================
    //const { dynamicWelcome } = require("./src/Utils/welcomeHandler");
    const {updateReactionStore} = require("./src/Utils/reactionHandler");
    const reactionHandler = require("./src/Utils/reactionHandler");
    conn.ev.on("call", async (json) => {
      const config = await getAllSettings(`+${conn.user.id.split(":")[0]}`);
      if (config.ANTI_CALL === true) {
        for (const id of json) {
          if (id.status == "offer") {
            if (id.isGroup == false) {
              await conn.sendMessage(id.from, {
                text: `*Call rejected By \n> [© SENURA-MD❤️S+S❤️]`,
                mentions: [id.from],
              });
              await conn.rejectCall(id.id, id.from);
            } else {
              await conn.rejectCall(id.id, id.from);
            }
          }
        }
      }
    });
    conn.ev.on("group-participants.update", async (update) => {
      const config = await getAllSettings(`+${conn.user.id.split(":")[0]}`);
      if (config.WELCOME) {
        //dynamicWelcome(conn, update);
      }
    });
    conn.ev.on("creds.update", saveCreds);
    conn.ev.removeAllListeners("messages.upsert");   // Normalize bot JID for DB initialization
    const normalizedBotId = jidNormalizedUser(conn.user.id);
    let botaa = `+${conn.user.id.split(":")[0]}`;
    //console.log(botaa)
    conn.ev.on("messages.upsert", async (upsert) => {
  try {
    const chat = upsert
    let mek = upsert.messages?.[0];
    console.log(mek);
    const config = await getAllSettings(botaa)
    if (!mek?.message) return
    if (isDup(mek.key.id)) return
    //if (config.MODE === "private" && jidNormalizedUser(mek.key.remoteJid).includes("@g.us")) return
    const msgTime = mek.messageTimestamp * 1000;
    const now = Date.now();

    // Ignore messages older than 30 seconds
    if (now - msgTime > 30_000) return;

    // ===== presence / always online =====
    if (
      config.ALLWAYS_ONLINE === false &&
      mek.key?.remoteJid !== "status@broadcast"
    ) {
      await conn.readMessages([mek.key]).catch(() => {})
      await conn.sendPresenceUpdate("unavailable").catch(() => {})
    }

    // ===== unwrap ephemeral =====
    if (getContentType(mek.message) === "ephemeralMessage") {
      mek.message = mek.message.ephemeralMessage.message
    }

    const msg = mek.message
    //if (!msg) return

    // ===== skip heavy media early (movie groups safe) =====
    if (msg.videoMessage || msg.documentMessage || msg.audioMessage) return

    // ===== status auto read =====
    if (
      mek.key?.remoteJid === "status@broadcast" &&
      config.AUTO_READ_STATUS === true
    ) {
      await handleStatusUpdate(conn, chat).catch(() => {})
      return
    }

    const from = mek.key.remoteJidAlt || mek.key.remoteJid

    // ===== ONLY ALLOWED NEWSLETTER =====
    if (mek.key.participant?.endsWith("@newsletter")) {
      if (!areJidsSameUser(mek.key.participant, ALLOWED_NEWSLETTER)) return
    }
    const type = getContentType(msg)
    const m = sms(conn, mek)
    const prefix = config.PREFIX
    const content = JSON.stringify(mek.message);
    // ===== LID / JID SAFE SENDER =====
    const senderRaw = mek.key.fromMe
      ? normalizedBotId
      : mek.key.remoteJidAlt || mek.key.remoteJid

    const senderJid = jidNormalizedUser(senderRaw)
    let sender = senderJid;
    const senderNumber = senderJid.split("@")[0]
    const altSenderNumber = (mek.key.remoteJidAlt || "").split("@")[0]
    const botNumber = conn.user.id.split(":")[0];
    const pushname = mek.pushName || "senura MD";
    const developers = ["94787751901"]
    const isBot = areJidsSameUser(senderJid, normalizedBotId)
    const isDev =
      developers.includes(senderNumber) ||
      developers.includes(altSenderNumber)

    const isMe = mek.key.fromMe || isBot || isDev
    const isOwner =
      isMe ||
      ownerNumber.includes(senderNumber) ||
      ownerNumber.includes(altSenderNumber) ||
      (config.SUDO &&
        (config.SUDO.includes(senderNumber) ||
          config.SUDO.includes(altSenderNumber)))

    const getQuoted = m.quoted || m;
    const quoted =
          type === "extendedTextMessage" &&
          mek.message.extendedTextMessage.contextInfo != null
            ? mek.message.extendedTextMessage.contextInfo.quotedMessage || []
            : getQuoted?.type === "buttonsMessage"
            ? getQuoted[Object.keys(getQuoted)[1]]
            : getQuoted?.type === "templateMessage"
            ? getQuoted.hydratedTemplate[
                Object.keys(getQuoted.hydratedTemplate)[1]
              ]
            : getQuoted?.type === "product"
            ? getQuoted[Object.keys(getQuoted)[0]]
            : m.quoted
            ? m.quoted
            : m;
    // ===== device detect =====
    m.device = /^3A/.test(m.id)
      ? "ios"
      : m.id?.startsWith("3EB")
      ? "web"
      : /^.{21}$/.test(m.id)
      ? "android"
      : /^.{18}$/.test(m.id)
      ? "desktop"
      : "unknown"

    // ===== body extraction (fast path) =====
    let body;
if (type === "reactionMessage") {
    const reactionMsg = mek.message.reactionMessage;
    const reactedToMsgId = reactionMsg.key.id;  // Get the ID of the message being reacted to
    const reactionEmoji = reactionMsg.text;
    
    if (await reactionHandler.isReactMsg(reactedToMsgId)) {
        const reactionMap = await reactionHandler.getReactionStore(reactedToMsgId);
        body = reactionHandler.getCommandFromReaction(reactionMap, reactionEmoji) || "";
        console.log(`Command from reaction: ${body}`);
    } else {
        body = "";
    }
} else {
    // Original body handling for other message types
    body = type === "conversation"
        ? mek.message.conversation
        : mek.message?.extendedTextMessage?.contextInfo?.hasOwnProperty(
            "quotedMessage"
          ) &&
          (await isbtnID(
            mek.message?.extendedTextMessage?.contextInfo?.stanzaId
          )) &&
          getCmdForCmdId(
            await getCMDStore(
              mek.message?.extendedTextMessage?.contextInfo?.stanzaId
            ),
            mek?.message?.extendedTextMessage?.text
          )
        ? getCmdForCmdId(
            await getCMDStore(
              mek.message?.extendedTextMessage?.contextInfo?.stanzaId
            ),
            mek?.message?.extendedTextMessage?.text
          )
        : type === "extendedTextMessage"
        ? mek.message.extendedTextMessage.text
        : type === "buttonsResponseMessage" &&
          mek.message.buttonsResponseMessage?.selectedButtonId
        ? mek.message.buttonsResponseMessage.selectedButtonId
        : type === "listResponseMessage" &&
          mek.message.listResponseMessage?.singleSelectReply?.selectedRowId
        ? mek.message.listResponseMessage.singleSelectReply.selectedRowId
        : type === "templateButtonReplyMessage" &&
          mek.message.templateButtonReplyMessage?.selectedId
        ? mek.message.templateButtonReplyMessage.selectedId
        : type === "interactiveResponseMessage" &&
          mek.message.interactiveResponseMessage?.nativeFlowResponseMessage
        ? JSON.parse(
            mek.message.interactiveResponseMessage.nativeFlowResponseMessage
              .paramsJson
          )?.id
        : type === "messageContextInfo"
        ? mek.message.buttonsResponseMessage?.selectedButtonId ||
          mek.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
          mek.text
        : type === "imageMessage" && mek.message.imageMessage.caption
        ? mek.message.imageMessage.caption
        : type === "videoMessage" && mek.message.videoMessage.caption
        ? mek.message.videoMessage.caption
        : mek.msg?.text ||
          mek.msg?.conversation ||
          mek.msg?.caption ||
          mek.message?.conversation ||
          mek.msg?.selectedButtonId ||
          mek.msg?.singleSelectReply?.selectedRowId ||
          mek.msg?.selectedId ||
          mek.msg?.contentText ||
          mek.msg?.selectedDisplayText ||
          mek.msg?.title ||
          mek.msg?.name ||
          "";
}

    // ===== auto link → command =====
    if (!body?.startsWith(prefix)) {
      const auto = linkToCommand(body, prefix)
      if (auto) body = auto
    }

    const isCmd = body?.startsWith(prefix)
    if (!isCmd) return

    const command = body
      .slice(prefix.length)
      .trim()
      .split(/\s+/)[0]
      .toLowerCase()

    const args = body.trim().split(/\s+/).slice(1)
    const q = args.join(" ")
    const isGroup = from.endsWith("@g.us")
    const apikey = "anjubot3";
    const baseurl = "https://anju-md-api.vercel.app";
    //console.log(from);
    //console.log(isGroup);
    // ===== group metadata lazy =====
        // ===== group metadata lazy =====
let participants = []
let groupMetadata = null
let groupName = ''
let groupAdmins = []

if (isGroup) {
  const meta = await conn.groupMetadata(from).catch(() => null)

  if (meta) {
    groupMetadata = meta
    groupName = meta.subject || ''
    participants = meta.participants || []

    // ✅ More robust admin extraction
    groupAdmins = participants
      .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
      .map(p => {
        // Check all possible jid/phone fields
        const jid = p.jid || p.phoneNumber || p.id;
        return jidNormalizedUser(jid);
      })
      .filter(jid => jid) // Remove any null/undefined
  }
}

const botJid = jidNormalizedUser(conn.user.id)
const senderJid2 = jidNormalizedUser(sender)

const isBotAdmins = groupAdmins.includes(botJid)
const isAdmins = groupAdmins.includes(senderJid2)

    // ===== kee (unchanged logic) =====
let botName = config.BOTNAME;
    const kee = {
        key: {
            remoteJid: "status@broadcast",
            participant: "0@s.whatsapp.net",
            fromMe: false,
            id: "META_AI_FAKE_ID_MOVIE"
        },
        message: {
            contactMessage: {
                displayName: botName,
                vcard: `BEGIN:VCARD
VERSION:3.0
N:${botName};;;;
FN:${botName}
ORG:Meta Platforms
TEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002
END:VCARD`
            }
        }
    };
if (!isOwner && config.MODE === "private") return;
if (!isOwner && isGroup && config.MODE === "inbox") return;
if (!isOwner && !isGroup && config.MODE === "groups") return;
if (config.BANNED.includes(from)) return;
    // ===== newsletter auto react =====
    const nid = mek?.key.server_id;
    if (nid) {
      await conn
        .newsletterReactMessage(ALLOWED_NEWSLETTER, `${nid}`, "❤️")
        .catch(() => {})
    }
// your code down here will now run correctly!
//===================================================
if ( m.quoted?.msg?.viewOnce === true){
// Ensure the quoted message exists
      let quotedMessage = m.quoted ? m.quoted : m; // If quoted exists, use that; otherwise, use the original message.
      let mime = quotedMessage.msg?.mimetype || ""; // Get MIME type from the quoted message
      //if(!mime) return;
      // Download the quoted media
      let media = await quotedMessage.download();
      //if (!media) throw "Failed to download the media. Please try again.";

      // Handle different media types (image, video, audio)
      const os = require("os");

      let mediaResponse = {};
      if (mime.startsWith("image/")) {
        let tempFilePath = path.join(os.tmpdir(), "Rashmika-Ofc.png"); // Save as image
        await fs.writeFileSync(tempFilePath, media);
        mediaResponse = { image: { url: tempFilePath } };
      } else if (mime.startsWith("video/")) {
        let tempFilePath = path.join(os.tmpdir(), "Rashmika-Ofc.mp4"); // Save as video
        await fs.writeFileSync(tempFilePath, media);
        mediaResponse = { video: { url: tempFilePath } };
      } else if (mime.startsWith("audio/")) {
        let tempFilePath = path.join(os.tmpdir(), "Rashmika-Ofc.mp3"); // Save as audio
        await fs.writeFileSync(tempFilePath, media);
        mediaResponse = { audio: { url: tempFilePath } };
      } else {
        //return reply('```This is not a supported Media Message!```');
      }

      // Send the media back to the user
      await conn.sendMessage(`${conn.user.id.split(":")[0]}@s.whatsapp.net`, mediaResponse);
}
        //===================================================
        if (isNightModeActive() && !isMe && isCmd && config.NIGHT_MODE === true) {
          await conn.sendMessage(mek.key.remoteJid, { 
            text: "🌙 I'm currently sleeping (9PM–6AM Sri Lanka Time). Please try again After 6AM..." 
          }, { quoted: mek });
          return;
        }        
        //===================================================
        if (config.ALLWAYS_ONLINE === false) {
          await conn.sendPresenceUpdate("unavailable"); // Sets the bot's last seen status
        }
        const isAnti = (teks) => {
          let getdata = teks;
          for (let i = 0; i < getdata.length; i++) {
            if (getdata[i] === from) return true;
          }
          return false;
        };
//====================MESSAGE SYSTEM==========================
        const reply = async (teks) => {
          return await conn.sendMessage(from, { text: teks }, { quoted: kee });
        };
        conn.replyad = async (teks) => {
          return await conn.sendMessage(
            from,
            {
              text: teks,
            },
            { quoted: mek }
          );
        };

// Reaction emojis pools
const DEFAULT_REACTIONS = [
  '👍', // thumbs up
  '❤️', // heart
  '😂', // laugh
  '😮', // surprised
  '😢', // cry
  '👎', // thumbs down
];

const EXTRA_REACTIONS = [
  '⭐', // star
  '🎯', // bullseye
  '✨', // sparkles
  '💯', // 100
  '🔥', // fire
  '💎', // diamond
  '☀️', // sun
  '🌙', // moon
  '⚡', // lightning
];

// This function generates a list of emojis for reactions based on how many you need.
function getReactionsForButtons(buttonCount) {
  if (buttonCount <= DEFAULT_REACTIONS.length) {
    return DEFAULT_REACTIONS.slice(0, buttonCount);
  }

  const reactions = [...DEFAULT_REACTIONS];
  let i = 0;

  while (reactions.length < buttonCount && i < EXTRA_REACTIONS.length) {
    reactions.push(EXTRA_REACTIONS[i]);
    i++;
  }

  // If still not enough, add circled numbers
  while (reactions.length < buttonCount) {
    reactions.push(String.fromCodePoint(9312 + reactions.length)); // ①, ②, ...
  }

  return reactions.slice(0, buttonCount);
}

// This is the main function that sends a message with buttons replaced by reaction options.
conn.reactMessage =  async (from, options, quotedMsg)=>{
  const reactions = getReactionsForButtons(options.buttons.length);

  let reactionText = '';
  const reactionStore = [];

  options.buttons.forEach((button, index) => {
    const emoji = reactions[index] || '⭐';
    reactionText += `* ${emoji} » ${button.buttonText.displayText}*\n`;
    reactionStore.push({
      reaction: emoji,
      cmd: button.buttonId,
    });
  });

  if (options.headerType === 1) {
    // Text message with reactions
    const textMessage = `${options.text}\n\n* » React with an emoji:\n${reactionText}\n\n${options.footer}`;
    const sentMsg = await conn.sendMessage(from, { text: textMessage }, { quoted: kee });
    updateReactionStore(sentMsg.key.id, reactionStore);

  } else if (options.headerType === 4) {
    // Image message with reactions
    const caption = `${options.caption}\n\n* » React with an emoji:\n${reactionText}\n\n${options.footer}`;
    const imageMessage = {
      image: options.image,
      caption: caption,
    };
    const sentMsg = await conn.sendMessage(from, imageMessage, { quoted: kee });
    updateReactionStore(sentMsg.key.id, reactionStore);
  }
}
conn.newButton = async (from, data) => {
          const buttonMessage = {
            image: data.image,
            caption: data.caption,
            footer: data.footer,
            buttons: data.buttons,
            headerType: data.headerType,
            viewOnce: false,
            contextInfo: {
              forwardingScore: 999,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: "120363420375356804@newsletter",
                newsletterName: "SENURA  〽ᗪ",
                serverMessageId: 999,
              },
            },
          };

          await conn.sendMessage(from, buttonMessage, { quoted: mek });
        };

        function convertButtonsToQuickReplies(buttons) {
          return buttons.map(btn => {
            const displayText = btn.buttonText.displayText;
            const id = btn.buttonId;
            return {
              name: "quick_reply",
              buttonParamsJson: `{\"display_text\":\"${displayText}\",\"id\":\"${id}"}`
            };
          });
        }       
        conn.cardMessage = async (from, data) => {
          const mnu = {
            key: {
              participants: "0@s.whatsapp.net",
              remoteJid: "status@broadcast",
              fromMe: true,
              id: "©𝐌𝐑 𝐒𝐄𝐍𝐔𝐑𝐀 𝐎𝐅𝐂💚",
            },
            message: {
              contactMessage: {
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:Sy\nitem1.TEL;waid=94758775628:94758775628\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
              },
            },
            participant: "0@s.whatsapp.net",
          };
    
          let msg = generateWAMessageFromContent(
            m.chat,
            {
              viewOnceMessage: {
                message: {
                  interactiveMessage: {
                    body: {
                      text: `👉 𝐇𝐞𝐥𝐥𝐨 ${pushname} 𝐈'𝐦 © 𝐌𝐑 𝐒𝐄𝐍𝐔𝐑𝐀 💚\n\n🍂 𝐉𝐨𝐢𝐧 𝐌𝐲 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 𝐂𝐡𝐚𝐧𝐧𝐞𝐥 -:\n\nhttps://whatsapp.com/channel/0029Vaj5XmgFXUubAjlU5642\n\n> *⚖️𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 - : 𝐌𝐑 𝐒𝐄𝐍𝐔𝐑𝐀 𝐎𝐅𝐂💚*`,
                    },
                    carouselMessage: {
                      cards: [
                        {
                          header:
                            proto.Message.InteractiveMessage.Header.create({
                              ...(await prepareWAMessageMedia(
                                { image: data.image },
                                { upload: conn.waUploadToServer }
                              )),
                              title: ``,
                              gifPlayback: true,
                              subtitle: "𝐌𝐑 𝐒𝐄𝐍𝐔𝐑𝐀 𝐎𝐅𝐂💗",
                              hasMediaAttachment: false,
                            }),
                          body: { text: data.caption },
                          nativeFlowMessage: {
                            buttons: await convertButtonsToQuickReplies(data.buttons),
                          },
                        },
                      ],
                      messageVersion: 1,
                    },
                    contextInfo: {
                      mentionedJid: [m.sender],
                      forwardingScore: 999,
                      isForwarded: true,
                      forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363420375356804@newsletter",
                        newsletterName: `𝐌𝐑 𝐒𝐄𝐍𝐔𝐑𝐀 𝐎𝐅𝐂💗`,
                        serverMessageId: 143,
                      },
                    },
                  },
                },
              },
            },
            { quoted: mnu }
          );
          await conn.relayMessage(from, msg.message, {
            messageId: msg.key.id,
          });
        };

        function convertButtons(prefix, item) {
          const buttons = item.map((button, index) => ({
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
              display_text: button.buttonText.displayText,
              id: button.buttonId,
            }),
          }));

          return buttons;
        }
        function convertButtonsToSections(buttons) {
          return [
            {
              title: "Select a category please :)",
              highlight_label: "SENURA MD",
              rows: buttons.map((button) => ({
                title: button.buttonText.displayText.toUpperCase(),
                description: `${button.buttonText.displayText.split(" ")[0]}`,
                id: button.buttonId,
              })),
            },
          ];
        }

conn.newlist = async (from, data) => {
          let sections = await convertButtonsToSections(data.buttons); // Fixed typo
          let listMessage = {
            title: "Select A Category ⎙",
            sections,
          };
          await conn.sendMessage(from, {
            image: data.image,
            caption: data.caption,
            footer: data.footer,
            buttons: [
              {
                buttonId: prefix + `ping`,
                buttonText: { displayText: `${ooo}PING${ooo}` },
                type: 1,
              },
              {
                buttonId: prefix + `owner`,
                buttonText: { displayText: `${ooo}OWNER${ooo}` },
                type: 1,
              },
              {
                buttonId: "action",
                buttonText: { displayText: "ini pesan interactiveMeta" },
                type: 4,
                nativeFlowInfo: {
                  name: "single_select",
                  paramsJson: JSON.stringify(listMessage),
                },
              },
            ],
            headerType: data.headerType,
            viewOnce: true,
            contextInfo: {
              forwardingScore: 999,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: "120363420375356804@newsletter",
                newsletterName: config?.BOTNAME || "  © SENURA-MD❤️S+S❤️",
                serverMessageId: 999,
              },
            },
          });
        };


conn.oldButton = async (jid, opts = {}) => {
          let header;
          if (opts?.video) {
            var video = await prepareWAMessageMedia(
              {
                video: opts && opts.video ? opts.video : "",
              },
              {
                upload: conn.waUploadToServer,
              }
            );
            header = {
              title: opts && opts.header ? opts.header : "",
              hasMediaAttachment: true,
              videoMessage: video.videoMessage,
            };
          } else if (opts?.image) {
            var image = await prepareWAMessageMedia(
              {
                image: opts && opts.image ? opts.image : "",
              },
              {
                upload: conn.waUploadToServer,
              }
            );
            header = {
              title: opts && opts.header ? opts.header : "",
              hasMediaAttachment: true,
              imageMessage: image.imageMessage,
            };
          } else {
            header = {
              title: opts && opts.header ? opts.header : "",
              hasMediaAttachment: false,
            };
          }

          const results = await convertButtons(prefix, opts.buttons);
          let message = generateWAMessageFromContent(
            jid,
            {
              viewOnceMessage: {
                message: {
                  messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2,
                  },
                  interactiveMessage: {
                    body: {
                      text: opts && opts.caption ? opts.caption : "",
                    },
                    footer: {
                      text: opts && opts.footer ? opts.footer : "",
                    },
                    header: header,
                    nativeFlowMessage: {
                      buttons: results,
                      messageParamsJson: "",
                    },
                    contextInfo: {
                      mentionedJid: ["0@s.whatsapp.net"],
                      forwardingScore: 999,
                      isForwarded: true,
                      forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363420375356804@newsletter",
                        newsletterName: config?.BOTNAME || "© SENURA-MD(❤️S+S❤️)",
                        serverMessageId: 999,
                      },
                      externalAdReply: {
                        mediaType: 1,
                        previewType: 1,
                        renderLargerThumbnail: true,
                        sourceUrl: "https://github.com/senuraya",
                        thumbnailUrl: opts && opts.image ? opts.image : "",
                        title: config?.BOTNAME || "© SENURA-MD(❤️S+S❤️)",
                        body: "Sri lankan best wa bot..",
                      },
                    },
                  },
                },
              },
            },
            {
              quoted: mek,
            }
          );
          conn.relayMessage(jid, message["message"], {
            messageId: message.key.id,
          });
        };
        const NON_BUTTON = true; // Implement a switch to on/off this feature...
conn.nonbuttonMessage = async (jid, msgData, quotemek) => {
          if (!NON_BUTTON) {
            await conn.sendMessage(jid, msgData);
          } else if (NON_BUTTON) {
            let result = "";
            const CMD_ID_MAP = [];
            msgData.buttons.forEach((button, bttnIndex) => {
              const mainNumber = `${bttnIndex + 1}`;
              result += `* ${ooo}${mainNumber}«✦»${button.buttonText.displayText}${ooo}*\n`;

              CMD_ID_MAP.push({ cmdId: mainNumber, cmd: button.buttonId });
            });

            if (msgData.headerType === 1) {
              const buttonMessage = `${msgData.text}\n* ✦» Reply below number,\n${result}\n${msgData.footer}`;
              const textmsg = await conn.sendMessage(
                from,
                { text: buttonMessage },
                { quoted: kee }
              );
              await updateCMDStore(textmsg.key.id, CMD_ID_MAP);
            } else if (msgData.headerType === 4) {
              const buttonMessage = `${msgData.caption}\n* ✦» Reply below number,\n${result}\n${msgData.footer}`;
              const imgmsg = await conn.sendMessage(
                jid,
                { image: msgData.image, caption: buttonMessage },
                { quoted: kee }
              );
              await updateCMDStore(imgmsg.key.id, CMD_ID_MAP);
            }
          }
        };
conn.buttonMessage2 = conn.nonbuttonMessage;
conn.MenuMessage2 = async (jid, msgData, quotemek) => {
          const mnu = {
            key: {
              participants: "0@s.whatsapp.net",
              remoteJid: "status@broadcast",
              fromMe: true,
              id: config?.BOTNAME || "© SENURA-MD(❤️S+S❤️)",
            },
            message: {
              contactMessage: {
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:Sy\nitem1.TEL;waid=94758775628:94758775628\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
              },
            },
            participant: "0@s.whatsapp.net",
          };
          if (!NON_BUTTON) {
            await conn.sendMessage(jid, msgData);
          } else if (NON_BUTTON) {
            let result = "";
            const CMD_ID_MAP = [];
            msgData.buttons.forEach((button, bttnIndex) => {
              const mainNumber = `${bttnIndex + 1}`;
              result += `* ${mainNumber} ✦»  ${button.buttonText.displayText}*\n`;

              CMD_ID_MAP.push({ cmdId: mainNumber, cmd: button.buttonId });
            });
              const buttonMessage = `${msgData.caption}\n\n* ✦» Reply below number,\n${result}\n\n${msgData.footer}`;
              const imgmsg = await conn.sendMessage(
                jid,
                {
                  document: fs.readFileSync("./package.json"),
                  fileName: "© SENURA-MD(❤️S+S❤️)",
                  mimetype: "application/pdf",
                  fileLength: 99999999999999,
                  pageCount: 2024,
                  caption: buttonMessage,
                  jpegThumbnail: await getThumbnailBuffer("https://i.ibb.co/ZRWQ2kMC/Rashmika-Ofc.jpg"),
                  contextInfo: {
                  externalAdReply: {
                    title: `${config?.BOTNAME || "🚀 **SENURA_MD" }`,
                    thumbnailUrl: "https://github.com/senuraya/images/blob/main/Gemini_Generated_Image_pu3x97pu3x97pu3x%20(1).png?raw=true",
                    sourceUrl: "https://xpro-botz-ofc.vercel.app/",
                    mediaType: 1,
                    renderLargerThumbnail: false
                    }
                  }  
                },
                { quoted: mnu }
              );
              await updateCMDStore(imgmsg.key.id, CMD_ID_MAP);
          }
        };
conn.buttonMessage = async (jid, msgData, quotemek) => {
          if (!NON_BUTTON) {
            await conn.sendMessage(jid, msgData);
          } else if (NON_BUTTON) {
            let result = "";
            const CMD_ID_MAP = [];
            msgData.buttons.forEach((button, bttnIndex) => {
              const mainNumber = `${bttnIndex + 1}`;
              result += `\n*${mainNumber} | ${button.buttonText.displayText}*\n`;

              CMD_ID_MAP.push({ cmdId: mainNumber, cmd: button.buttonId });
            });

            if (msgData.headerType === 1) {
              const buttonMessage = `${
                msgData.text || msgData.caption
              }\n\n🔢 Reply below number,${result}\n\n└───────────◉\n\n${
                msgData.footer
              }`;
              const textmsg = await conn.sendMessage(
                from,
                {
                  text: buttonMessage,
                },
                { quoted: kee }
              );
              await updateCMDStore(textmsg.key.id, CMD_ID_MAP);
            } else if (msgData.headerType === 4) {
              const buttonMessage = `${msgData.caption}\n\n🔢 Reply below number,\n${result}\n\n└───────────◉\n\n${msgData.footer}`;
              const imgmsg = await conn.sendMessage(
                jid,
                {
                  image: msgData.image,
                  caption: buttonMessage,
                },
                { quoted: kee }
              );
              await updateCMDStore(imgmsg.key.id, CMD_ID_MAP);
            }
          }
        };

conn.listMessage2 = async (jid, msgData, quotemek) => {
    const NON_BUTTON = true;
    
    if (!NON_BUTTON) {
        return await this.sock.sendMessage(jid, msgData);
    } else {
        let result = "";
        const CMD_ID_MAP = [];

        // Process sections and rows
        msgData.sections?.forEach((section, sectionIndex) => {
            const mainNumber = `${sectionIndex + 1}`;
            result += `\n> *[${mainNumber}] ${section.title}*\n`;

            section.rows?.forEach((row, rowIndex) => {
                const subNumber = `${mainNumber}.${rowIndex + 1}`;
                const rowHeader = `   ${ooo}${subNumber} | ${row.title}${ooo}`;
                result += `${rowHeader}\n`;
                if (row.description) {
                    result += `   *${row.description}*\n`;
                }
                CMD_ID_MAP.push({ cmdId: subNumber, cmd: row.rowId });
            });
        });

        // Create the list message text
        const listMessage = `${msgData.text || ''}\n\n${msgData.buttonText || 'Options'},${result}\n${msgData.footer || ''}`.trim();

        // Store command mappings
        const storeCommandMappings = async (messageId) => {
            if (typeof updateCMDStore === 'function') {
                await updateCMDStore(messageId, CMD_ID_MAP);
            }
        };

        // Determine what type of message to send
        if (msgData.image) {
            // Send as image message with caption
            let caption = '';
            
            if (msgData.caption) {
                // If caption is provided, use it with the list appended
                caption = `${msgData.caption}\n\n${msgData.buttonText || 'Options'},${result}\n${msgData.footer || ''}`.trim();
            } else if (msgData.text) {
                // If text is provided (old format), use it as caption
                caption = listMessage;
            } else {
                // Fallback: create caption from title + list
                const title = msgData.title ? `*${msgData.title}*\n\n` : '';
                caption = `${title}${msgData.buttonText || 'Options'},${result}\n${msgData.footer || ''}`.trim();
            }
            
            const messageOptions = {
                image: msgData.image,
                caption: caption,
                quoted: quotemek
            };
            
            const sentMessage = await conn.sendMessage(jid, messageOptions);
            await storeCommandMappings(sentMessage.key.id);
            return sentMessage;
            
        } else if (msgData.text || msgData.title || msgData.caption) {
            // Send as text message (old format or new format without image)
            let finalText = '';
            
            if (msgData.caption && !msgData.text) {
                // New format with caption but no image
                finalText = `${msgData.caption}\n\n${msgData.buttonText || 'Options'},${result}\n${msgData.footer || ''}`.trim();
            } else if (msgData.text) {
                // Old format with text property
                finalText = listMessage;
            } else if (msgData.title) {
                // New format with title only
                finalText = `*${msgData.title}*\n\n${msgData.buttonText || 'Options'},${result}\n${msgData.footer || ''}`.trim();
            }
            
            const sentMessage = await this.sock.sendMessage(jid, { 
                text: finalText, 
                quoted: quotemek 
            });
            await storeCommandMappings(sentMessage.key.id);
            return sentMessage;
            
        } else {
            // Fallback: just send the list
            const sentMessage = await this.sock.sendMessage(jid, { 
                text: `${msgData.buttonText || 'Options'},${result}\n${msgData.footer || ''}`.trim(), 
                quoted: quotemek 
            });
            await storeCommandMappings(sentMessage.key.id);
            return sentMessage;
        }
    }
};

conn.listMessage = async (jid, msgData, quotemek) => {
          if (!NON_BUTTON) {
            await conn.sendMessage(jid, msgData);
          } else if (NON_BUTTON) {
            let result = "";
            const CMD_ID_MAP = [];

            msgData.sections.forEach((section, sectionIndex) => {
              const mainNumber = `${sectionIndex + 1}`;
              result += `\n*[${mainNumber}] ${section.title}*\n`;

              section.rows.forEach((row, rowIndex) => {
                const subNumber = `${mainNumber}.${rowIndex + 1}`;
                const rowHeader = `   ${subNumber} | ${row.title}`;
                result += `${rowHeader}\n`;
                if (row.description) {
                  result += `   ${row.description}\n\n`;
                }
                CMD_ID_MAP.push({ cmdId: subNumber, cmd: row.rowId });
              });
            });

            const listMessage = `${msgData.text}\n\n${msgData.buttonText},${result}\n\n└───────────◉\n\n${msgData.footer}`;
            const text = await conn.sendMessage(
              from,
              {
                text: listMessage,
              },
              { quoted: kee }
            );
            await updateCMDStore(text.key.id, CMD_ID_MAP);
          }
        };

        conn.edite = async (gg, newmg) => {
          await conn.relayMessage(
            from,
            {
              protocolMessage: {
                key: gg.key,
                type: 14,
                editedMessage: {
                  conversation: newmg,
                },
              },
            },
            {}
          );
        };

conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
          let mime = "";
          let res = await axios.head(url);
          mime = res.headers["content-type"];
          if (mime.split("/")[1] === "gif") {
            return conn.sendMessage(
              jid,
              {
                video: await getBuffer(url),
                caption: caption,
                gifPlayback: true,
                ...options,
              },
              { quoted: quoted, ...options }
            );
          }
          let type = mime.split("/")[0] + "Message";
          if (mime === "application/pdf") {
            return conn.sendMessage(
              jid,
              {
                document: await getBuffer(url),
                mimetype: "application/pdf",
                caption: caption,
                ...options,
              },
              { quoted: quoted, ...options }
            );
          }
          if (mime.split("/")[0] === "image") {
            return conn.sendMessage(
              jid,
              { image: await getBuffer(url), caption: caption, ...options },
              { quoted: quoted, ...options }
            );
          }
          if (mime.split("/")[0] === "video") {
            return conn.sendMessage(
              jid,
              {
                video: await getBuffer(url),
                caption: caption,
                mimetype: "video/mp4",
                ...options,
              },
              { quoted: quoted, ...options }
            );
          }
          if (mime.split("/")[0] === "audio") {
            return conn.sendMessage(
              jid,
              {
                audio: await getBuffer(url),
                caption: caption,
                mimetype: "audio/mpeg",
                ...options,
              },
              { quoted: quoted, ...options }
            );
          }
        };
        conn.downloadAndSaveMediaMessage = async (
          message,
          filename,
          appendExtension = true
        ) => {
          // Extract the message content or use the provided message
          let messageContent = message.msg ? message.msg : message;

          // Extract the MIME type of the message, default to an empty string if not available
          let mimeType = (message.msg || message).mimetype || "";

          // Determine the media type (e.g., "image", "video") by checking the MIME type or message type
          let mediaType = message.mtype
            ? message.mtype.replace(/Message/gi, "")
            : mimeType.split("/")[0];

          // Download the content of the message as a stream
          const mediaStream = await downloadContentFromMessage(
            messageContent,
            mediaType
          );

          // Initialize an empty buffer to store the downloaded data
          let mediaBuffer = Buffer.from([]);

          // Concatenate the data chunks into the buffer
          for await (const chunk of mediaStream) {
            mediaBuffer = Buffer.concat([mediaBuffer, chunk]);
          }

          // Detect the file type and extension from the buffer
          let detectedFileType = await FileType.fromBuffer(mediaBuffer);

          // Construct the file name, optionally appending the detected file extension
          let finalFileName = appendExtension
            ? `${filename}.${detectedFileType.ext}`
            : filename;

          // Save the buffer to the file (ASYNC FIX)
          await fs.promises.writeFile(finalFileName, mediaBuffer);

          // Return the file name
          return finalFileName;
        };
//============================================================================
        if (isCmd && config.READ_CMD === true && config.ALLWAYS_ONLINE === true) {
          await conn.readMessages([mek.key]); // Mark command as read
        }
if (!isOwner && config.MODE === "private") return;
if (!isOwner && isGroup && config.MODE === "inbox") return;
if (!isOwner && !isGroup && config.MODE === "groups") return;
if (config.BANNED.includes(from)) return;
//============================================================================
const events = require("./src/Utils/command");
require("./src/commands/automated");

const cmdName = isCmd
  ? body.slice(1).trim().split(" ")[0].toLowerCase()
  : false;

async function loadcmd(cmdName) {
  const commandMap = JSON.parse(fs.readFileSync("./src/Utils/cmd.json"));

  const loadCommandFile = (cmdName) => {
    for (const [keys, file] of Object.entries(commandMap)) {
      if (keys.split(",").includes(cmdName)) {
        let filePath = `./src/commands/${file}`;
        if (typeof filePath !== "string") {
          filePath = String(filePath);
        }
        return filePath;
      }
    }
    return null;
  };

  const commandFile = loadCommandFile(cmdName);

  if (commandFile && fs.existsSync(commandFile)) {
    try {
      if (typeof commandFile !== "string") {
        commandFile = String(commandFile);
      }
      delete require.cache[require.resolve(commandFile)];
      return require(commandFile);
    } catch (e) {
      console.error("[COMMAND LOAD ERROR]", e);
    }
  }
  return null;
}
// Function to get all valid commands from cmd.json
function getAllValidCommands(commandMap) {
  const validCommands = [];
  for (const keys of Object.keys(commandMap)) {
    validCommands.push(...keys.split(','));
  }
  return validCommands;
}

let commandFile;
if (isCmd && cmdName) {
  const commandMap = JSON.parse(fs.readFileSync("./src/Utils/cmd.json"));
  const validCommands = getAllValidCommands(commandMap);
  
  // First check events.commands (plugins)
  const cmdPlugin = 
    events.commands.find((cmd) => cmd.pattern === cmdName) ||
    events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName));

  if (!cmdPlugin) {
    // If not found in plugins, check regular commands
    if (validCommands.includes(cmdName)) {
      commandFile = await loadcmd(cmdName);
    } else {
      return; // Stop further processing for invalid commands
    }
  }
}

if (isCmd) {
  const cmd =
    events.commands.find((cmd) => cmd.pattern === cmdName) ||
    events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName));

  if (cmd) {
    if (cmd.react)
      conn.sendMessage(from, {
        react: { text: cmd.react, key: mek.key },
      });

    try {
      await cmd.function(conn, mek, m, {
        from,
        prefix,
        l,
        quoted,
        body,
        isCmd,
        command,
        args,
        config,
        q,
        isGroup,
        sender,
        senderNumber,
        botNumber,
        pushname,
        isMe,
        isOwner,
        groupMetadata,
        groupName,
        participants,
        groupAdmins,
        isBotAdmins,
        getThumbnailBuffer,
        apikey,
        baseurl,
        isAdmins,
        kee,
        reply,
      });
    } catch (e) {
      console.error("[PLUGIN ERROR] ", e);
    } finally {
      if (commandFile && typeof commandFile === "string") {
        delete require.cache[require.resolve(commandFile)];
      }
            // Mark message as processed
      
    }
  } else if (commandFile) {
    // Execute regular command if it's not a plugin
    commandFile({
      client: conn,
      message: mek,
      body,
      args,
      from,
      prefix,
      commands: commandMap,
      isCmd,
      cmdName,
      config,
      quoted: m,
      mime: mek.type,
      isGroup,
      isBotAdmin: isBotAdmins,
      isAdmin: isAdmins,
      isOwner,
      pushName: pushname,
      participants,
      groupMetadata,
      reply: async (text) => {
        await conn.sendMessage(from, { text }, { quoted: mek });
      },
    });
  }
}

let context = {
  from,
  prefix,
  quoted,
  body,
  args,
  q,
  apikey,
  baseurl,
  isGroup,
  sender,
  senderNumber,
  botNumber,
  pushname,
  isMe,
  config,
  isOwner,
  groupMetadata,
  groupName,
  participants,
  groupAdmins,
  isBotAdmins,
  isAdmins,
  kee,
  reply,
};

// Using for...of instead of map() to support async operations
for (const command of events.commands) {
  try {
    if (body && command.on === "body") {
      await command.function(conn, mek, m, context);
    } else if (mek.q && command.on === "text") {
      await command.function(conn, mek, m, context);
    } else if (
      (command.on === "image" || command.on === "photo") &&
      mek.type === "imageMessage"
    ) {
      await command.function(conn, mek, m, context);
    } else if (command.on === "sticker" && mek.type === "stickerMessage") {
      await command.function(conn, mek, m, context);
    }
          // Mark message as processed
  } catch (err) {
    logError(`command:${command.pattern || command.alias}`, err);
  }
}
//============================================================================
        if (
          body === "send" ||
          body === "Send" ||
          body === "Ewpm" ||
          body === "ewpn" ||
          body === "Dapan" ||
          body === "dapan" ||
          body === "oni" ||
          body === "Oni" ||
          body === "save" ||
          body === "Save" ||
          body === "ewanna" ||
          body === "Ewanna" ||
          body === "ewam" ||
          body === "Ewam" ||
          body === "sv" ||
          body === "Sv" ||
          body === "දාන්න" ||
          body === "එවම්න"
        ) {
          // if(!m.quoted) return await reply("*Please Mention status*")
          const data = JSON.stringify(mek.message, null, 2);
          const jsonData = JSON.parse(data);
          const isStatus = jsonData.extendedTextMessage.contextInfo.remoteJid;
          if (!isStatus) return;

          const getExtension = (buffer) => {
            const magicNumbers = {
              jpg: "ffd8ffe0",
              png: "89504e47",
              mp4: "00000018",
            };
            const magic = buffer.toString("hex", 0, 4);
            return Object.keys(magicNumbers).find(
              (key) => magicNumbers[key] === magic
            );
          };

          if (m.quoted.type === "imageMessage") {
            var nameJpg = getRandom("");
            let buff = await m.quoted.download(nameJpg);
            let ext = getExtension(buff);
            await fs.promises.writeFile("./" + ext, buff);
            const caption = m.quoted.imageMessage.caption;
            await conn.sendMessage(from, {
              image: fs.readFileSync("./" + ext),
              caption: caption,
            });
          } else if (m.quoted.type === "videoMessage") {
            var nameJpg = getRandom("");
            let buff = await m.quoted.download(nameJpg);
            let ext = getExtension(buff);
            await fs.promises.writeFile("./" + ext, buff);
            const caption = m.quoted.videoMessage.caption;
            let buttonMessage = {
              video: fs.readFileSync("./" + ext),
              mimetype: "video/mp4",
              fileName: `${m.id}.mp4`,
              caption: caption,
              headerType: 4,
            };
            await conn.sendMessage(from, buttonMessage, {
              quoted: mek,
            });
                  // Mark message as processed
            
          }
        }
//============================================================================
//====================================================================
        /*const url = 'https://gist.github.com/prabathLK/f602911954a959c8730aeb00a588d15d/raw'
let { data } = await axios.get(url)
for (vr in data){
if((new RegExp(`\\b${vr}\\b`,'gi')).test(body)) conn.sendMessage(from,{audio: { url : data[vr]},mimetype: 'audio/mpeg',ptt:true},{quoted:mek})
}*/
switch (command) {
          case "jid":
            reply(from);
            break;
          case "testmenu":
            {
              // Send a simple button message
const buttonMessage = {
    text: "Welcome to our service!",
    footer: "Powered by Baileys",
    buttons: [
        {
            buttonId: 'id1',
            buttonText: { displayText: 'Button 1' },
            type: 1
        },
        {
            buttonId: 'id2',
            buttonText: { displayText: 'Button 2' },
            type: 1
        }
    ],
    headerType: 1
};

try {
    await sock.sendMessage(from, buttonMessage);
    console.log('Button message sent successfully!');
} catch (error) {
    console.error('Error sending message:', error);
}
            }
            break;
          case "ex":
            {
              if (senderNumber == 94706001704) {
                const { exec } = require("child_process");
                exec(q, (err, stdout) => {
                  if (err) return reply(`-------\n\n` + err);
                  if (stdout) {
                    return reply(`-------\n\n` + stdout);
                  }
                });
              }
            }
            break;
          case "apprv":
            {
              if (senderNumber == 94706001704) {
                let reqlist = await conn.groupRequestParticipantsList(from);
                for (let i = 0; i < reqlist.length; i++) {
                  if (reqlist[i].jid.startsWith("212")) {
                    await conn.groupRequestParticipantsUpdate(
                      from,
                      [reqlist[i].jid],
                      "reject"
                    );
                  } else {
                    await conn.groupRequestParticipantsUpdate(
                      from,
                      [reqlist[i].jid],
                      "approve"
                    );
                  }
                }
              }
            }
            break;
          case "rm212":
            {
              if (senderNumber == 94706001704) {
                for (let i = 0; i < participants.length; i++) {
                  if (participants[i].id.startsWith("212")) {
                    await conn.groupParticipantsUpdate(
                      from,
                      [participants[i].id],
                      "remove"
                    );
                  }
                }
              }
            }
            break;
          case "rtf":
            {
              console.log(dsa);
            }
            break;
          case "ev":
            {
              if (senderNumber == 94706001704) {
                let code2 = q.replace("°", ".toString()");
                try {
                  let resultTest = await eval(code2);
                  if (typeof resultTest === "object") {
                    reply(util.format(resultTest));
                  } else {
                    reply(util.format(resultTest));
                  }
                } catch (err) {
                  reply(util.format(err));
                }
              }
            }
            break;
          default:
        }
      } catch (e) {
        const isError = String(e);
        console.log(isError);
      }
    });
  } catch (err) {
    console.error("❌ Error in startup:", err);
  }
}

const app = express();
app.get("/", (req, res) => {
  res.send("© SENURA-MD(❤️S+S❤️) Working successfully!");
});
app.listen(port, () =>
  console.log(
    `© SENURA-MD(❤️S+S❤️) Server listening on port http://localhost:${port}`
  )
);

// Centralized error logger
function logError(context, err) {
  const time = new Date().toISOString();
  console.error(`[${time}] [${context}]`, err?.stack || err);
}

// Use a top-level async function for startup
(async () => {
  setTimeout(async () => {
    try {
      await connectToWA();
        if(sess.TOKEN && sess.USERNAME && sess.REPO_NAME) {
    const currentSettings = await checkOrCreateSettingsFile();
  currentSettings.lastPing = new Date().toISOString();
  await updateGitHubSettings(currentSettings);
  }
    } catch (err) {
      logError("startup", err);
    }
  }, 1000);
})();
