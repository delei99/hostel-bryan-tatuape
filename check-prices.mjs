import mysql from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL não configurado');
  process.exit(1);
}

const pool = mysql.createPool(dbUrl);

(async () => {
  try {
    const conn = await pool.getConnection();
    const [rooms] = await conn.query('SELECT id, name, pricePerNight FROM rooms ORDER BY id');
    console.log('\n✓ Preços dos quartos:');
    rooms.forEach(room => {
      console.log(`  Quarto ${room.id}: ${room.name} - R$ ${(room.pricePerNight / 100).toFixed(2)}`);
    });
    conn.release();
    pool.end();
  } catch (err) {
    console.error('✗ Erro:', err.message);
    process.exit(1);
  }
})();
