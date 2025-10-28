const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10); // Password default: 'admin123'

  console.log('Start seeding ...');

  // Buat User Admin
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' }, // Cari user dengan username 'admin'
    update: {}, // Jika sudah ada, tidak perlu di-update
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN', // Pastikan rolenya ADMIN
    },
  });

  console.log('Seeding finished.');
  console.log(`Created admin user: ${adminUser.username}`);

  // Buat data master Penyimak untuk admin
  // Ini penting agar akun admin terhubung ke data Penyimak
  await prisma.penyimak.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      nama: 'Admin Utama',
      user: {
        connect: {
          id: adminUser.id,
        },
      },
    },
  });
  console.log('Created admin penyimak data.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });