require('dotenv').config();
const express = require('express');
const morgan  = require('morgan');
const path = require('path');

const app=express();

// Middleware
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf; // Buffer brut, capturé AVANT le parsing
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));