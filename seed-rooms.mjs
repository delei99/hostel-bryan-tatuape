import mysql from 'mysql2/promise';

const rooms = [
  {
    name: "Quarto Privado Deluxe",
    type: "private",
    capacity: 2,
    pricePerNight: 25000, // R$ 250.00
    description: "Quarto privado com cama de casal, banheiro privativo e ar-condicionado. Ideal para casais.",
    amenities: JSON.stringify(["WiFi", "Ar-condicionado", "Banheiro privativo", "TV", "Frigobar"])
  },
  {
    name: "Quarto Privado Standard",
    type: "private",
    capacity: 1,
    pricePerNight: 15000, // R$ 150.00
    description: "Quarto privado com cama de solteiro, banheiro compartilhado e ar-condicionado.",
    amenities: JSON.stringify(["WiFi", "Ar-condicionado", "Banheiro compartilhado"])
  },
  {
    name: "Dormitório Feminino",
    type: "dorm",
    capacity: 4,
    pricePerNight: 6000, // R$ 60.00
    description: "Dormitório com 4 camas individuais, banheiro compartilhado. Perfeito para viajantes em grupo.",
    amenities: JSON.stringify(["WiFi", "Ar-condicionado", "Armários", "Banheiro compartilhado"])
  },
  {
    name: "Dormitório Misto",
    type: "dorm",
    capacity: 6,
    pricePerNight: 5000, // R$ 50.00
    description: "Dormitório com 6 camas individuais, banheiro compartilhado. Ambiente social e acolhedor.",
    amenities: JSON.stringify(["WiFi", "Ar-condicionado", "Armários", "Banheiro compartilhado"])
  },
  {
    name: "Quarto Compartilhado Duplo",
    type: "shared",
    capacity: 2,
    pricePerNight: 8000, // R$ 80.00
    description: "Quarto compartilhado com 2 camas, banheiro compartilhado. Ótima relação custo-benefício.",
    amenities: JSON.stringify(["WiFi", "Ar-condicionado", "Banheiro compartilhado"])
  },
  {
    name: "Quarto Compartilhado Triplo",
    type: "shared",
    capacity: 3,
    pricePerNight: 7000, // R$ 70.00
    description: "Quarto compartilhado com 3 camas, banheiro compartilhado. Ideal para grupos pequenos.",
    amenities: JSON.stringify(["WiFi", "Ar-condicionado", "Banheiro compartilhado"])
  },
  {
    name: "Quarto Privado com Varanda",
    type: "private",
    capacity: 2,
    pricePerNight: 30000, // R$ 300.00
    description: "Quarto privado premium com varanda, cama de casal, banheiro privativo e vista para a rua.",
    amenities: JSON.stringify(["WiFi", "Ar-condicionado", "Banheiro privativo", "Varanda", "TV", "Frigobar", "Cofre"])
  }
];

async function seedRooms() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    for (const room of rooms) {
      await connection.execute(
        'INSERT INTO rooms (name, type, capacity, pricePerNight, description, amenities, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [room.name, room.type, room.capacity, room.pricePerNight, room.description, room.amenities, 'available']
      );
      console.log(`✓ Quarto criado: ${room.name}`);
    }

    console.log('\n✅ Todos os 7 quartos foram criados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar quartos:', error);
  } finally {
    await connection.end();
  }
}

seedRooms();
