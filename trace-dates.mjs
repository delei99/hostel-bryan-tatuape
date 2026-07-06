import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hostel_bryan',
});

// Buscar a última reserva
const [rows] = await connection.execute(
  'SELECT id, confirmationCode, checkInDate, checkOutDate FROM bookings ORDER BY id DESC LIMIT 1'
);

if (rows.length === 0) {
  console.log('Nenhuma reserva encontrada');
  process.exit(0);
}

const booking = rows[0];
console.log('\n=== ÚLTIMA RESERVA NO BANCO ===');
console.log('ID:', booking.id);
console.log('Confirmation Code:', booking.confirmationCode);
console.log('checkInDate (raw):', booking.checkInDate);
console.log('checkOutDate (raw):', booking.checkOutDate);

// Converter para string
const checkInStr = booking.checkInDate instanceof Date 
  ? booking.checkInDate.toISOString().split('T')[0]
  : String(booking.checkInDate).split(' ')[0];

const checkOutStr = booking.checkOutDate instanceof Date
  ? booking.checkOutDate.toISOString().split('T')[0]
  : String(booking.checkOutDate).split(' ')[0];

console.log('\ncheckInDate (string):', checkInStr);
console.log('checkOutDate (string):', checkOutStr);

// Simular o que o frontend faz
console.log('\n=== SIMULAÇÃO DO FRONTEND ===');
const checkInDate = new Date(checkInStr);
const checkOutDate = new Date(checkOutStr);

console.log('new Date(checkInStr):', checkInDate);
console.log('toLocaleDateString("pt-BR"):', checkInDate.toLocaleDateString('pt-BR'));
console.log('toISOString():', checkInDate.toISOString());

// Simular o helper correto
const [y, m, d] = checkInStr.split('-').map(Number);
const correctDate = new Date(y, m - 1, d);
console.log('\nnew Date(y, m-1, d):', correctDate);
console.log('toLocaleDateString("pt-BR"):', correctDate.toLocaleDateString('pt-BR'));

await connection.end();
