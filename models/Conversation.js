const db=require('../config/db');
const Conversation={
    create:async({prospect_id})=>{
    const [result]= await db.query('insert into conversations (dateDebut,statut,prospect_id) values (NOW(),EN_COURS,?)',[prospect_id]);
    return {id:result.insertId};
},

    findbyprospect:async(prospect_id)=>{
        const [rows]=await db.query('select * from conversation where prospect_id=? order by dateDebut desc limit 1',[prospect_id]);
        return rows[0] || null;
    },
};
module.exports=Conversation;