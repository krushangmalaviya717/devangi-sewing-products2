const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS contact_queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    order_status TEXT,
    delivery_related TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS store_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL
  )`);

  // Insert default settings
  const defaultSettings = [
    ['store_location', '419 State 414 Rte, Beaver Dams, New York(NY), 14812, USA'],
    ['store_phone', '(607) 936-8058'],
    ['store_email', 'example@gmail.com'],
    ['contact_form_options', JSON.stringify({
      order_status: ['Pending', 'Shipped', 'Delivered'],
      delivery_related: ['Delay in Delivery', 'Change Address', 'Other']
    })]
  ];

  const stmt = db.prepare('INSERT OR IGNORE INTO store_settings (setting_key, setting_value) VALUES (?, ?)');
  defaultSettings.forEach(setting => stmt.run(setting));
  stmt.finalize();

  console.log('Database updated successfully.');
});
