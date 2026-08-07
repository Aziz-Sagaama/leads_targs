const express = require('express');
const router = express.Router();
const db=require('../config/db');

router.get('/',async(req,res)=>{
    try{
        const[rows]=await db.query(
            `select p.id,p.nomComplet,p.numTelephone,p.Email,p.statut,
            p.societe_id,p.created_at,p.updated_at,
            c.id        as conv_id,
            c.dateDebut  as conv_dateDebut,
            c.statut     as conv_statut,
            count(m.idMessage) as message_count
            from prospects p
            Left join conversations c on p.id=c.prospect_id
            Left join messages m on c.id=m.conversation_id
            group by p.id,p.nomComplet,p.numTelephone,p.Email,p.statut,
            p.societe_id,p.created_at,p.updated_at,
            c.id,c.dateDebut,c.statut
            order by p.created_at desc
            `
        );
        res.json(rows);
    }catch(err){
        console.error(err);
        res.status(500).json({error:err.message});
    }
});
router.get('/dashboard/kpis',async(req,res)=>{
    try {
        const[[totals]]= await db.query(
            `SELECT COUNT(*) as total,
            sum(statut =1) as qualified
            from prospects`
        );
        res.json({
            
            total: Number(totals.total),
            qualified: Number(totals.qualified)|| 0,
            taux: totals.total > 0 ? (Number(totals.qualified) / Number(totals.total)) * 100 : 0,
        });

    }catch(err)
    {
        res.status(500).json({error:err.message});    }
})
router.patch('/:id',async(req,res)=>{
    try{
        const status=req.body?.statut;
        if (status===undefined ){
            return res.status(400).json({error:'Invalid status value'});
        }
        await db.query('UPDATE prospects SET statut=? WHERE id=?',[status,req.params.id]);
        res.json({message:'Prospect status updated successfully'});
    }catch(err){
        res.status(500).json({error:err.message});
    }
})
module.exports=router; 