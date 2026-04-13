import mysql from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL não configurado');
  process.exit(1);
}

(async () => {
  const pool = mysql.createPool(dbUrl);
  try {
    const conn = await pool.getConnection();
    
    // Listar todos os quartos
    const [rooms] = await conn.query('SELECT id, name, description FROM rooms ORDER BY id');
    
    console.log('\n✓ Quartos no banco de dados:');
    rooms.forEach(room => {
      console.log(`  ID ${room.id}: ${room.name}`);
      console.log(`    ${room.description}\n`);
    });
    
    conn.release();
  } catch (err) {
    console.error('✗ Erro:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
