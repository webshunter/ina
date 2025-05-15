require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('index', {
    title: 'Express Auto Deploy App',
    description: 'Modern Express.js application with auto-deployment capability'
  });
});

// Start server
app.listen(port, () => {
  console.log(`✅ Main application listening on port ${port}`);
}); 