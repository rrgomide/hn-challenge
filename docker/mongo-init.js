// MongoDB initialization script
// This script runs when the container starts for the first time

db = db.getSiblingDB('hn_challenge');

// Create snippets collection
db.createCollection('snippets');

// Create an index on the id field for better performance
db.snippets.createIndex({ "id": 1 }, { unique: true });

// Create an index on createdAt for sorting
db.snippets.createIndex({ "createdAt": 1 });

print('Database and snippets collection initialized successfully');