const { PrismaClient } = require('@prisma/client');

async function main() {
  // Try without channel_binding
  const p = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require'
      }
    }
  });
  
  try {
    console.log('Connecting without channel_binding...');
    const result = await p.$queryRaw`SELECT 1 as test`;
    console.log('Connected! Result:', result);
    const count = await p.internship.count();
    console.log('Internships:', count);
  } catch (e: any) {
    console.log('Error:', e.message.substring(0, 200));
    
    // Try direct (non-pooler) endpoint
    console.log('\nTrying direct endpoint...');
    const p2 = new PrismaClient({
      datasources: {
        db: {
          url: 'postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require'
        }
      }
    });
    try {
      const result2 = await p2.$queryRaw`SELECT 1 as test`;
      console.log('Direct connected! Result:', result2);
      const count2 = await p2.internship.count();
      console.log('Internships:', count2);
    } catch (e2: any) {
      console.log('Direct error:', e2.message.substring(0, 200));
    }
    await p2.$disconnect().catch(() => {});
  }
  
  await p.$disconnect().catch(() => {});
}

main();
