const { readFileSync, existsSync } = require('fs');
const { createClient } = require('@libsql/client');

async function setupDatabase() {
  console.log('Setting up database...');

  // Check if schema.sql exists
  if (!existsSync('./schema.sql')) {
    console.log('schema.sql not found. Run "npm run db:generate" first.');
    process.exit(1);
  }

  // Read the schema
  const schema = readFileSync('./schema.sql', 'utf-8');

  // Create client
  const client = createClient({
    url: process.env.NODE_ENV === 'development' 
      ? 'file:./dev.db' 
      : process.env.TURSO_DATABASE_URL,
    ...(process.env.NODE_ENV !== 'development' && {
      authToken: process.env.TURSO_AUTH_TOKEN,
    }),
  });

  // Execute schema
  try {
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await client.execute(statement);
    }

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    client.close();
  }
}

setupDatabase();