const db = require('../config/db');
const Message={
    create:async({conversation_id,contenu})=>{
    const [result]=await db.query('INSERT INTO messages (conversation_id,contenu) VALUES (?, ?)', [conversation_id, contenu]);
    return {id:result.insertId};
}
};
module.exports=Message;