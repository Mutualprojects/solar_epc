const pg = require('pg');

const hosts = ['172.30.0.186', '127.0.0.1'];
const ports = [5432, 54322, 54321, 6432];
const passwords = ['postgres', 'Superadmin123', 'admin123', 'admin'];

async function tryConnect() {
  for (const host of hosts) {
    for (const port of ports) {
      for (const password of passwords) {
        console.log(`Trying ${host}:${port} with password: ${password}...`);
        const client = new pg.Client({
          host,
          port,
          user: 'postgres',
          password,
          database: 'postgres',
          connectionTimeoutMillis: 2000,
        });
        try {
          await client.connect();
          console.log(`🚀 SUCCESS! Connected to ${host}:${port}`);
          const res = await client.query('SELECT version();');
          console.log('Postgres version:', res.rows[0].version);
          await client.end();
          return;
        } catch (e) {
          console.log(`Failed: ${e.message}`);
        }
      }
    }
  }
  console.log('All connection attempts failed.');
}

tryConnect();
