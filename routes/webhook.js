const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const APP_SECRET = process.env.WHATSAPP_APPSECRET; 
