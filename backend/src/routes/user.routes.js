const express = require('express');
const router = express.Router();

// Example route to return a message
router.get('/users', (req, res) => {
  res.send('User routes are working!');
});

module.exports = router;
