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
    
    // Atualizar preços
    const [result] = await conn.query('UPDATE rooms SET pricePerNight = 8000 WHERE 1=1');
    console.log(`✓ ${result.affectedRows} quartos atualizados para R$ 80,00`);
    
    // Verificar
    const [rooms] = await conn.query('SELECT id, name, pricePerNight FROM rooms ORDER BY id');
    console.log('\nPreços atualizados:');
    rooms.forEach(room => {
      console.log(`  ${room.name}: R$ ${(room.pricePerNight / 100).toFixed(2)}`);
    });
    
    conn.release();
  } catch (err) {
    console.error('✗ Erro:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
