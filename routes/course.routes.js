const express = require('express');
const router = express.Router();

// Route simple pour tester
router.get('/', (req, res) => {
    res.json({ message: "Liste des cours" });
});

module.exports = router;