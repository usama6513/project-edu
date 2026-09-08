const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require',
  });
  
  try {
    console.log('Connecting with pg...');
    await client.connect();
    console.log('Connected!');
    const res = await client.query('SELECT 1 as test');
    console.log('Query result:', res.rows);
    
    // Now check internship count
    const res2 = await client.query('SELECT count(*) FROM "Internship"');
    console.log('Internships:', res2.rows[0].count);
    
    const res3 = await client.query('SELECT count(*) FROM "Course"');
    console.log('Courses:', res3.rows[0].count);
  } catch (e: any) {
    console.log('Error:', e.message);
    console.log('Code:', e.code);
  }
  
  await client.end();
}

main();
