(()=>{var e={298:e=>{"use strict";e.exports=require("electron")}},o={};function n(r){var s=o[r];if(void 0!==s)return s.exports;var t=o[r]={exports:{}};return e[r](t,t.exports,n),t.exports}(()=>{const{contextBridge:e,ipcRenderer:o}=n(298);e.exposeInMainWorld("api",{sendMessage:o.send,onListFiles:e=>{o.on("listFiles",((o,...n)=>e(...n)))},onLoadPreviousText:e=>{o.on("loadPreviousText",((o,...n)=>e(...n)))},onShowText:e=>{o.on("showText",((o,...n)=>e(...n)))},onShowImage:e=>{o.on("showImage",((o,...n)=>e(...n)))},onPlayVideo:e=>{o.on("playVideo",((o,...n)=>e(...n)))},onClear:e=>{o.on("clear",((o,...n)=>e(...n)))}})})()})();
//# sourceMappingURL=preload.js.map