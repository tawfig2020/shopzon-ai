const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello from ShopSync AI!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
