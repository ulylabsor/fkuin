const mysql = require('mysql2/promise');

async function createDatabase() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
  });

  await connection.query('CREATE DATABASE IF NOT EXISTS sdm_fk_uin');
  console.log('Database sdm_fk_uin created successfully');

  const [rows] = await connection.query('SHOW DATABASES LIKE "sdm_fk_uin"');
  console.log('Verification:', rows);

  await connection.end();
}

createDatabase().catch(console.error);
