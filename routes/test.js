const fs = require('fs')
const qr = require('qrcode')
// qr.toBuffer("LY8&bj$09PaVk0bBG2vaJwU3Z", (err, buff)=>{
//     console.log(buff)
// })
qr.toFile('45583265.png', "LY8&bj$09PaVk0bBG2vaJwU3Z")
//console.log(Buffer.from(fs.readFileSync('../qrcodes/1a2b3c/45583265.png')))