const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');
db.run("UPDATE navigation_links SET url = '/contact.html' WHERE title = 'Contact Us'", function(err) {
    if (err) {
        console.error(err.message);
    }
    console.log(`Row(s) updated: ${this.changes}`);
});
db.close();
