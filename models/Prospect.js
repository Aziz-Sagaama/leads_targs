const db = require('../config/db');
const Prospect = {
    findbyphone: async (phone) => {
        const[rows]=await db.query('SELECT * FROM prospects WHERE numTelephone = ?', [phone]);
        return rows[0];
    },
    create:async({nomComplet,numTelephone,Email,societe_id})=>{
        const [result] = await db.query('INSERT INTO prospects (nomComplet, numTelephone, Email, societe_id) VALUES (?, ?, ?, ?)', [nomComplet, numTelephone, Email,false, societe_id ||1]);
        return {id: result.insertId,nomComplet,numTelephone,Email,societe_id};
    },
    setQualified: async (id) => {
        await db.query('UPDATE prospects set status = ? WHERE id = ?', [true, id]);
    }
};

module.exports={Prospect};