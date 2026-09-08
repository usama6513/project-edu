const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    console.log('Connecting...');
    const result = await p.$queryRaw`SELECT 1 as test`;
    console.log('Query result:', result);
  } catch (e: any) {
    console.log('Full error:', JSON.stringify(e, null, 2));
    console.log('Error code:', e.code);
    console.log('Error message:', e.message);
    console.log('Client version:', e.clientVersion);
  }
  
  try {
    await p.$disconnect();
  } catch (e) {}
}

main();
