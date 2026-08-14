const fetch =require('node-fetch');
const BASE_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
const TOKEN=process.env.WHATSAPP_TOKEN;

async function sendText(to,text){
    const res = await fetch(BASE_URL,{
        method:'POST',
        headers:{
            'Authorization':`Bearer ${TOKEN}`,
            'Content-Type':'application/json',
        },
        body:JSON.stringify({
            messaging_product:'whatsapp',
            to,
            type:'text',
            text:{body:text},
        }),
    });
    if(!res.ok){
        const err = await res.json();
        throw new Error(`whatsApp send failed: ${JSON.stringify(err)}`);
    }
    return await res.json();

}
async function markRead(messageId){
    await fetch(BASE_URL,{
        method:'POST',
        headers:{
            'Authorization':`Bearer ${TOKEN}`
        },
        body:JSON.stringify({
            messaging_product:'whatsapp',
            status:'read',
            message_id:messageId
        })
    });

}
module.exports = {
    sendText,
    markRead,
};