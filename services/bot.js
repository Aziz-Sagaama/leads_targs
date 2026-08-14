const {Prospect} = require('../models/Prospect');
const conversation = require('../models/Conversation');
const message = require('../models/Message');
const groq = require('groq-sdk');
const db = require('../config/db');

function buildProductsContext(products) {
    if(!products.length) return 'aucun produit';
    return products
        .map((p) => `- ${p.nom} — ${p.prix} €${p.description ? ` (${p.description})` : ''}`)
        .join('\n');
}
async function handleIncomingMessage({ phone, name, content, ts, msgId }) {
    console.log(`Incoming message from ${name} (${phone}): ${content}`);
    try{
        let prospect = await Prospect.findbyphone(phone);
        if(!prospect){
            prospect=await prospect.create({
                nomcomplet:name,
                numTelephone:phone,
                Email:'',
            });
            console.log(`created new prospect: ${prospect.id}`);
        }else{
            console.log(`found existing prospect: ${prospect.id}`);
        }

        let conv=await Conversation.findByProspect(prospect.id);
        if(!conv){
            conv = await Conversation.create(prospect.id);
            console.log(`created new conversation: ${conv.id}`);

        }
        await Message.create({
            conversation_id:conv.id,
            contenu:content,
        });
        console.log('message saved');
        if(process.env.WHATSAPP_TOKEN){
            const {markRead}=require('./whatsapp');
            try{
                await markRead(msgId);
                console.log('Message marked as read');
            }catch(e){
                console.warn('markRead failed:',e.message);
            }
        }
        if(process.env.GROQ_API_KEY){
            const wantsProducts=/produit|produits|offre|catalogue|prix|solution|disponible/i.test(content);    
            let productsContext='';
            if(wantsProducts){
                const [products]= await db.query(
                    `SELECT nom,prix,description
                    FROM produits
                    where quantite>0
                    order by nom asc
                    limit 10`
                )
                productsContext=buildProductsContext(products);
            }
            const [prevMessages]= await db.query(
                `SELECT contenu,idMessage
                FROM messages where conversation_id=?
                order by idMessage desc
                limit 10`,[conv.id]
            );
            const history=prevMessages.map((m,i)=>({
                role:i%2===0?'user':'assistant',
                content:m.contenu,
            }));
            const groq=new Groq({apiKey:process.env.GROQ_API_KEY});
             const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: `Tu es un assistant commercial chaleureux et professionnel.
Tu qualifies le prospect ${name} en posant des questions sur :
1. Son besoin principal
2. Son budget
3. Son délai de décision
Réponds toujours en 2-3 phrases maximum. Sois naturel et humain.
Si le prospect a répondu à toutes les questions, résume et dis que l'équipe va le contacter.${wantsProducts ? `

Si l'utilisateur demande des produits ou une offre, présente les produits disponibles ci-dessous sans les inventer :
${productsContext}` : ''}`,
          },
          ...history,
        ],
      });
      console.log('Groq raw choice:',JSON.stringify(completion.choice[0],null,2));
      const aiReply= completion.choice?.[0]?.message?.content?.trim();
       if(!aiReply){
        console.error('groq a renvoye un contenu vide');
        return ;
       }
       console.log(`AI reply: ${aiReply}`);
       await Message.create({

        conversation_id:conv.id,
        contenu:aiReply,
       });
       if (process.env.WHATSAPP_TOKEN){
        const {sendText}=require('./whatsapp');
        try{
            await sendText(phone,aiReply);
            console.log('reply sent via whatsapp');
        }catch(e){
            console.warn('sendText failed',e.message);
        }


        }else {
        console.log('No WHATSAPP_TOKEN — reply saved to DB only');
      }

    } else {
      console.log('No GROQ_API_KEY — skipping AI reply');
    }
  
    }catch(err){
        console.error('Error handling incoming message:', err);
    }
}
    
module.exports = {
    handleIncomingMessage,
};



