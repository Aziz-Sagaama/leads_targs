const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/:id/messages',async(req,res)=>{
  try{
    const[messages]= await db.query('select * from messages where conversation_id=? order by idMessage desc',[req.params.id]);
    res.json(messages);
  }catch(err){
    console.error(err);
    res.status(500).json({error:err.message});
}});
router.get('/:id/interactions',async(req,res)=>{
  try{
    const[rows]= await db.query('select * from interactions where conversation_id=? order by idInteraction desc',[req.params.id]);
    res.json(rows);
  }catch(err){
    console.error(err);
    res.status(500).json({error:err.message});
  }
});

module.exports=router;