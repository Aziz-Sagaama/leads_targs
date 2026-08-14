const express = require('express');
const crypto = require('crypto');
const { handleIncomingMessage } = require('../services/bot');

const router = express.Router();

// App Secret from your Meta Developer app
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;


// =====================================================
// GET /webhook
// Used by Meta to verify that we own this webhook
// =====================================================
router.get('/webhook', (req, res) => {

    // Meta sends these 3 values when verifying
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Check that the token matches our .env value
    if (
        mode === 'subscribe' &&
        token === process.env.WEBHOOK_VERIFY_TOKEN
    ) {
        console.log('Webhook verified by Meta');

        // Meta expects the challenge back
        return res.status(200).send(challenge);
    }

    // Verification failed
    res.sendStatus(403);
});


// =====================================================
// Verify that a POST request really comes from Meta
// =====================================================
function validateSignature(req) {

    // Skip verification only during tests
    if (process.env.NODE_ENV === 'test') {
        return true;
    }

    // Signature sent by Meta
    const sig = req.headers['x-hub-signature-256'] || '';

    // Calculate the signature ourselves
    const expected =
        'sha256=' +
        crypto
            .createHmac('sha256', APP_SECRET)
            .update(req.rawBody)
            .digest('hex');

    // Different lengths = definitely different signatures
    if (sig.length !== expected.length) {
        return false;
    }

    // Secure comparison of both signatures
    return crypto.timingSafeEqual(
        Buffer.from(sig),
        Buffer.from(expected)
    );
}


// =====================================================
// POST /webhook
// Receives WhatsApp messages and events from Meta
// =====================================================
router.post('/webhook', (req, res) => {

    // Reject the request if the Meta signature is invalid
    if (!validateSignature(req)) {
        return res.sendStatus(401);
    }

    // Tell Meta immediately that we received the event
    res.sendStatus(200);

    const body = req.body;

    // Make sure this is a WhatsApp Business event
    if (body.object !== 'whatsapp_business_account') {
        return;
    }

    // Meta can send multiple entries and changes
    for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {

            const value = change.value;


            // ================================
            // Incoming WhatsApp message
            // ================================
            if (value.messages) {

                const msg = value.messages[0];
                const contact = value.contacts?.[0];

                // Send only the useful information to our bot
                handleIncomingMessage({
                    phone: msg.from,
                    name: contact?.profile?.name || 'Inconnu',
                    content: msg.text?.body || '',
                    ts: msg.timestamp,
                    msgId: msg.id,
                }).catch(console.error);
            }


            // ================================
            // Message status
            // ================================
            if (value.statuses) {

                const s = value.statuses[0];

                console.log(
                    `Status ${s.id}: ${s.status}`
                );
            }
        }
    }
});

module.exports = router;