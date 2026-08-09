const express = require('express');
const router = express.Router();
const db=require('../config/db');

async function ensureDescriptionColumn() {
    const [rows] = await db.query("SHOW COLUMNS FROM produits LIKE 'description'");
    if (!rows.length) {
        await db.query("ALTER TABLE produits ADD COLUMN description TEXT NULL");
    }
}
function tonumber(value) {
    if (value === null || value === undefined || value === '') {
        return NaN;
    }
    const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : NaN;
}
function validateOroduitPayload(body,partial=false){
    const errors = [];
    const payload = {};
    if (!partial || body.nom !==undefined) {
        if(!body.nom || String(body.nom).trim() === '') {
            errors.push('nom is required');
        } else {
            payload.nom=String(body.nom).trim();
        }
    }
    if (!partial || body.quantite !==undefined) {
        const quantite = tonumber(body.quantite);
        if(!Number.isInteger(quantite) || quantite < 0) {
            errors.push('quantite must be positive ')
        } else {
            payload.quantite=quantite;
        }   
    }
    if(!partial || body.prix !==undefined) {
        const prix = tonumber(body.prix);
        if(prix==null ||Number.isNaN(prix) || prix<0) {
            errors.push('prix must be positive ')
        } else {
            payload.prix=prix;
        }
    }
    if(!partial || body.description !==undefined) {
    payload.description=body.description ===undefined
     ? null
     : String(body.description).trim()||null;
    }
    if(!partial || body.societe_id!==undefined) {
        const societe_id = tonumber(body.societe_id);
        if(!Number.isInteger(societe_id) || societe_id <= 0) {
            error.push('societe_id must be a positive integer');
        } else {
            payload.societe_id=societe_id;
        }
    }
        return { errors, payload };
}
router.get('/', async (req, res) => {
    try {
        await ensureDescriptionColumn();
        const {societe_id}=req.query;
        const params=[];
        let where='';
        if(societe_id!==undefined){
            const parseSocieteId=tonumber(societe_id);
            if(!Number.isInteger(parseSocieteId) || parseSocieteId<=0){
                return res.status(400).json({error:'societe_id must be a positive integer'});
            } where='WHERE p.societe_id=?';
            params.push(parseSocieteId);
        }
       const [rows] = await db.query(
			`SELECT p.id, p.nom, p.quantite, p.prix, p.description, p.societe_id, p.created_at, p.updated_at, s.nom AS societe_nom
			 FROM produits p
			 LEFT JOIN societes s ON s.id = p.societe_id
			 ${where}
			 ORDER BY p.created_at DESC`,
			params
		);

		res.json(rows);
	} catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
}
router.get('/:id',async(req,res)=>{
    try{
        await ensureDescriptionColumn();
        const id=tonumber(req.params.id);
        if(!Number.isInteger(id) || id<=0){
            return res.status(400).json({error:'id must be a positive integer'});
        }
        const [rows]=await db.query(
            `SELECT p.id, p.nom, p.quantite, p.prix, p.description, p.societe_id, p.created_at, p.updated_at, s.nom AS societe_nom
            from produits p
            left join societes s on s.id=p.societe_id
            where p.id=?`,[id]
        );
        if(![rows[0]]) {
            return res.status(404).json({error:'produit not found'});
        }
        res.json(rows[0]);

        }catch(e){
            res.status(500).json({error:e.message});
        }
})
});
router.post('/',async(req,res)=>{
    try{
        await ensureDescriptionColumn();
        const {errors,payload}=validateOroduitPayload(req.body,false);
        if(errors.length>0){
            return res.status(400).json({errors});
        }
        const [result]=await db.query(
            'insert into produits(nom,quantite,prix,description,societe_id) values(?,?,?,?,?)',
            [payload.nom,payload.quantite,payload.prix,payload.description,payload.societe_id]
        );
        res.status(201).json({
            message:'produit creer avec succes',
            produit:{ id:result.insertId,...payload}
        });
    }catch(e){
        res.status(500).json({error:e.message});
    }
});
router.put('/:id',async(req,res)=>{
    try{
        await ensureDescriptionColumn();
        const id=tonumber(req.params.id);
        if(!number.isInteger(id) || id<=0){
            return res.status(400).json({error:'id must be a positive integer'});
        }
        const {errors,payload}=validateOroduitPayload(req.body,false);
        if(errors.length>0){
            return res.status(400).json({errors});
        }
        const [result]=await db.query(
            'update produits set nom=?,quantite=?,prix=?,description=?,societe_id=? where id=?',
            [payload.nom,payload.quantite,payload.prix,payload.description,payload.societe_id,id]
        );
        if (result.affectedRows===0){
            return res.status(404).json({error:'produit not found'});
        }
        const [rows]=await db.query(
            `SELECT p.id, p.nom, p.quantite, p.prix, p.description, p.societe_id, p.created_at, p.updated_at, s.nom AS societe_nom
            from produits p
            left join societes s on s.id=p.societe_id
            where p.id=?`,[id]
        );
        res.json({
            message:'produit mis a jour avec succes',
            produit:rows[0]
        });
    }catch(e){
        res.status(500).json({error:e.message});
    }
});
router.patch('/:id',async(req,res)=>{
    try{
        await ensureDescriptionColumn();
        const id=tonumber(req.params.id);
        if(!Number.isInteger(id) || id<=0){
            return res.status(400).json({error:'id must be a positive integer'});
        }
        const {errors,payload}=validateOroduitPayload(req.body,true);
        if(errors.length>0){
            return res.status(400).json({errors});
        }
        const fields=[];
        const values=[];
        for(const key of ['nom','quantite','prix','description','societe_id']){
            if(payload[key]!==undefined){
                fields.push(`${key}=?`);
                values.push(payload[key]);
            }
        }
        if(fields.length===0){
            return res.status(400).json({error:'no fields to update'});
        }
        values.push(id);
        const [result]=await db.query(
            `update produits set ${fields.join(',')} where id=?`,
            values
        );
        const[rows]=await db.query(
            `SELECT p.id, p.nom, p.quantite, p.prix, p.description, p.societe_id, p.created_at, p.updated_at, s.nom AS societe_nom
            from produits p
            left join societes s on s.id=p.societe_id
            where p.id=?`,[id]
        );
        res.json({
            message:'produit mis a jour avec succes',
            produit:rows[0]
        });
    }catch(e){
        res.status(500).json({error:e.message});
    }
});
router.delete('/:id',async(req,res)=>{
    try{
        await ensureDescriptionColumn();
        const id=tonumber(req.params.id);
        if(!Number.isInteger(id) || id<=0){
            return res.status(400).json({error:'id must be a positive integer'});
        }
        const [result]=await db.query('delete from produits where id=?',[id]);
        if(result.affectedRows===0){
            return res.status(404).json({error:'produit not found'});
        }
        res.json({message:'produit deleted with succes'});
    }catch(e){
        res.status(500).json({error:e.message});
    }
});
module.exports=router;