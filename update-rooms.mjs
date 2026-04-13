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
    
    // Atualizar nomes dos quartos
    for (let i = 1; i <= 7; i++) {
      const roomNumber = String(i).padStart(2, '0');
      const name = `Quarto ${roomNumber}`;
      const description = `Quarto confortável para 1 ou 2 pessoas com WiFi de alta velocidade`;
      
      await conn.query(
        'UPDATE rooms SET name = ?, description = ? WHERE id = ?',
        [name, description, i]
      );
    }
    
    console.log('✓ Nomes dos quartos atualizados para Quarto 01 até Quarto 07');
    
    // Verificar
    const [rooms] = await conn.query('SELECT id, name, description FROM rooms ORDER BY id');
    console.log('\nQuartos atualizados:');
    rooms.forEach(room => {
      console.log(`  ${room.name}: ${room.description}`);
    });
    
    conn.release();
  } catch (err) {
    console.error('✗ Erro:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
