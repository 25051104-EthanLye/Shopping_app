const express = require('express'); 
const mysql = require('mysql2'); 
const multer = require('multer');
const app = express(); 
 
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images'); // Specify the destination folder for uploaded images
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });


// Create MySQL connection 
const connection = mysql.createConnection({ 
    host: 'localhost', 
    user: 'root', 
    password: 'root',
    database: 'c237_supermarketapp' 
}); 
 
connection.connect((err) => { 
    if (err) { 
        console.error('Error connecting to MySQL:', err); 
        return; 
    } 
    console.log('Connected to MySQL database'); 
}); 
 
// Set up view engine 
app.set('view engine', 'ejs'); 
//  enable static files 
app.use(express.static('public')); 
//enable form processing
app.use(express.urlencoded({ extended: true})); 

// Define routes 
// Example: 
app.get('/', (req, res) => { 
    connection.query('SELECT * FROM products', (error, results) => { 
      if (error) throw error; 
      res.render('index', { products: results }); // Render HTML page with data 
    }); 
}); 

app.get('/product/:id', (req, res) => {
  // Extract the product ID from the request parameters
  const productId = req.params.id;
  const sql = 'SELECT * FROM products WHERE productId = ?';
  // Fetch data from MySQL based on the product ID
  connection.query( sql , [productId], (error, results) => {
    if (error) {
      console.error('Database query error:', error.message); 
      return res.send('Error Retrieving product by ID'); 
    }
    // Check if any product with the given ID was found
    if (results.length > 0) {
      // Render HTML page with the product data
      res.render('product', { product: results[0] });
    } else {
      // If no product with the given ID was found
      res.send('Product not found');
    }
  });
});

app.get('/addProduct', (req, res) => {
  res.render('addProduct'); 
});
app.post('/addProduct', upload.single('image'), (req, res) => {
  // Extract product data from the request body
  const { name, quantity, price } = req.body;
  let image = req.file ? req.file.filename : null; // Get the filename of the uploaded image
  if (req.file) {
    image = req.file.filename; // Get the filename of the uploaded image
  } else {
    image = null; // No image uploaded
  }
  const sql = 'INSERT INTO products (productName, quantity, price, image) VALUES (?, ?, ?, ?)';
  // Insert the new product into the database
  connection.query( sql , [name, quantity, price, image], (error, results) => {
    if (error) {
      // Handle any error that occurs during the database operation
      console.error("Error adding product:", error);
      res.send('Error adding product');
    } else {
      // Send a success response
      res.redirect('/');
    }
  });
});

app.get('/editProduct/:id', (req, res) => {
  const productId = req.params.id;
  const sql = 'SELECT * FROM products WHERE productId = ?';
  
  // Fetch the existing product details first so the form can prepopulate them
  connection.query(sql, [productId], (error, results) => {
    if (error) {
      console.error('Database query error:', error.message);
      return res.send('Error retrieving product for editing');
    }
    if (results.length > 0) {
      // Pass the found product to the EJS template
      res.render('editProduct', { product: results[0] });
    } else {
      res.send('Product not found');
    }
  });
});

app.post('/editProduct/:id', (req, res) => {
  const productId = req.params.id;
  const { name, quantity, price} = req.body;
  let image = req.body.image; // Get the image URL from the form input
    if (req.file) {
        image = req.file.filename; // Get the filename of the uploaded image
    }
  const sql = 'UPDATE products SET productName = ? , quantity = ?, price = ?, image = ? WHERE productId = ?';
  connection.query(sql, [name, quantity, price, image, productId], (error, results) => {
    if (error) {
      console.error('Database query error:', error.message);
      return res.send('Error updating product');
    }
    res.redirect('/');
  });
});

/* ==========================================
   ADDED: GET /deleteProduct/:id 
   ========================================== */
app.get('/deleteProduct/:id', (req, res) => {
  // Extract the product ID from the route parameters
  const productId = req.params.id;
  const sql = 'DELETE FROM products WHERE productId = ?';

  // Execute the delete query on the database
  connection.query(sql, [productId], (error, results) => {
    if (error) {
      console.error('Database query error during deletion:', error.message);
      return res.send('Error deleting product');
    }
    // Redirect the user back to the main homepage dashboard after successful deletion
    res.redirect('/');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));