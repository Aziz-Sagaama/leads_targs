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