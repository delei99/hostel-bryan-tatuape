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
    await conn.query('UPDATE rooms SET pricePerNight = 8000 WHERE 1=1');
    console.log('✓ Preços atualizados para R$ 80,00');
    conn.release();
    pool.end();
  } catch (err) {
    console.error('✗ Erro:', err.message);
    process.exit(1);
  }
})();
