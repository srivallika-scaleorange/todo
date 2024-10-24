const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

console.log('Starting Todo application server...');

const app = express();
app.use(cors());
app.use(express.json());

console.log('Middleware initialized: CORS and JSON parsing enabled');

// Connect to SQLite database
const db = new sqlite3.Database('./todo.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Successfully connected to SQLite database');
  }
});

// Create todos table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT 0
  )
`, (err) => {
  if (err) {
    console.error('Error creating todos table:', err);
  } else {
    console.log('Todos table checked/created successfully');
  }
});

// Get all todos
app.get('/api/todos', (req, res) => {
  console.log('GET /api/todos - Fetching all todos');
  
  db.all('SELECT * FROM todos', [], (err, rows) => {
    if (err) {
      console.error('Error fetching todos:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log(`Successfully retrieved ${rows.length} todos`);
    res.json(rows);
  });
});

// Add new todo
app.post('/api/todos', (req, res) => {
  const { title } = req.body;
  console.log('POST /api/todos - Adding new todo:', { title });

  db.run('INSERT INTO todos (title) VALUES (?)', [title], function(err) {
    if (err) {
      console.error('Error adding todo:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    const newTodo = { id: this.lastID, title, completed: false };
    console.log('Successfully added todo:', newTodo);
    res.json(newTodo);
  });
});

// Toggle todo completion
app.put('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  console.log(`PUT /api/todos/${id} - Updating todo:`, { id, completed });
  
  db.run(
    'UPDATE todos SET completed = ? WHERE id = ?',
    [completed ? 1 : 0, id],
    (err) => {
      if (err) {
        console.error('Error updating todo:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      console.log(`Successfully updated todo ${id} completion to ${completed}`);
      res.json({ id, completed });
    }
  );
});

// Delete todo
app.delete('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  console.log(`DELETE /api/todos/${id} - Deleting todo`);

  db.run('DELETE FROM todos WHERE id = ?', id, (err) => {
    if (err) {
      console.error('Error deleting todo:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log(`Successfully deleted todo ${id}`);
    res.json({ message: 'Todo deleted' });
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/todos`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nClosing database connection...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});