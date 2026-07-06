import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'hostel_bryan_tatuape'
});

// Buscar as últimas 5 reservas com suas datas
const [rows] = await connection.execute(`
  SELECT 
    id, 
    confirmationCode,
    checkInDate, 
    checkOutDate,
    createdAt
  FROM bookings 
  ORDER BY id DESC 
  LIMIT 5
`);

console.log('\n=== Últimas 5 Reservas ===\n');
rows.forEach((row, index) => {
  console.log(`Reserva #${index + 1}:`);
  console.log(`  ID: ${row.id}`);
  console.log(`  Código: ${row.confirmationCode}`);
  console.log(`  Check-in (banco): ${row.checkInDate}`);
  console.log(`  Check-out (banco): ${row.checkOutDate}`);
  console.log(`  Criada em: ${row.createdAt}`);
  console.log('');
});

await connection.end();
