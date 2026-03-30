//══════════════════════════════════════════════════════════════════════════════════════════════════════//
//                                                                                                      //
//                                      𝗦𝗘𝗡𝗨𝗥𝗔-𝗠𝗗 𝗪𝗛𝗔𝗧𝗦𝗔𝗣𝗣 𝗕𝗢𝗧                                         //
//                                                                                                      //
//                                           Ｖ：1.0.0                                                   //
//
//   ███████╗███████╗███╗   ██╗██╗   ██╗██████╗  █████╗         ███╗   ███╗██████╗ 
//   ██╔════╝██╔════╝████╗  ██║██║   ██║██╔══██╗██╔══██╗        ████╗ ████║██╔══██╗
//   ███████╗█████╗  ██╔██╗ ██║██║   ██║██████╔╝███████║  █████╗██╔████╔██║██║  ██║
//   ╚════██║██╔══╝  ██║╚██╗██║██║   ██║██╔══██╗██╔══██║  ╚════╝██║╚██╔╝██║██║  ██║
//   ███████║███████╗██║ ╚████║╚██████╔╝██║  ██║██║  ██║        ██║ ╚═╝ ██║██████╔╝
//   ╚══════╝╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝        ╚═╝     ╚═╝╚═════╝ 
//
//
//══════════════════════════════════════════════════════════════════════════════════════════════════════//
//*
//  * @project_name : © SENURA-MD(❤️S+S❤️)
//  * @version      : 4.0
//  * @author       : Mr Senura Herath
//  * @youtube      : https://www.youtube.com/@mrsenuraherath
//  * @description  : © SENURA-MD(❤️S+S❤️), A Multi-functional WhatsApp bot created by Senura herath.
//*
//*
//Base by 
//GitHub: 
//WhatsApp: +94787751901
//Want more free bot scripts? Subscribe to my YouTube channel: https://www.youtube.com/@mrsenuraherath
//   * Created By GitHub: Mrsenura
//   * Credit To senura herath
//   * © 2026 SENURA-MD(❤️S+S❤️)
// ⛥┌┤
// */

const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "XPRO-MD~1769924254041_obyopp5q1",
PORT: process.env.PORT || "8000"
};