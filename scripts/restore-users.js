import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const sql = neon(process.env.NEON_DATABASE_URL);

async function restoreUsers() {
  console.log('🔄 Restaurando cuentas de usuario...\n');

  // Hash de contraseña por defecto: "password123"
  const defaultPassword = await bcrypt.hash('password123', 10);

  const users = [
    {
      cedula: '000000000',
      name: 'Admin',
      lastname: 'Sistema',
      email: 'admin@comet.com',
      password: defaultPassword,
      role: 'admin',
      verified: true
    },
    {
      cedula: '123456789',
      name: 'María',
      lastname: 'González',
      email: 'maria@email.com',
      password: defaultPassword,
      role: 'user',
      verified: true
    },
    {
      cedula: '987654321',
      name: 'Carlos',
      lastname: 'Rodríguez',
      email: 'carlos@email.com',
      password: defaultPassword,
      role: 'user',
      verified: true
    },
    {
      cedula: '111222333',
      name: 'Ana',
      lastname: 'Jiménez',
      email: 'ana@email.com',
      password: defaultPassword,
      role: 'user',
      verified: true
    },
    {
      cedula: '444555666',
      name: 'Security',
      lastname: 'Manager',
      email: 'security@comet.com',
      password: defaultPassword,
      role: 'security',
      verified: true
    },
    {
      cedula: '777888999',
      name: 'News',
      lastname: 'Editor',
      email: 'news@comet.com',
      password: defaultPassword,
      role: 'news',
      verified: true
    },
    {
      cedula: '222333444',
      name: 'Bus',
      lastname: 'Manager',
      email: 'buses@comet.com',
      password: defaultPassword,
      role: 'buses',
      verified: true
    },
    {
      cedula: '555666777',
      name: 'Driver',
      lastname: 'Test',
      email: 'driver@comet.com',
      password: defaultPassword,
      role: 'driver',
      verified: true
    },
    {
      cedula: '888999000',
      name: 'Community',
      lastname: 'Manager',
      email: 'community@comet.com',
      password: defaultPassword,
      role: 'community',
      verified: true
    },
    {
      cedula: '333444555',
      name: 'Reports',
      lastname: 'Manager',
      email: 'reports@comet.com',
      password: defaultPassword,
      role: 'reports',
      verified: true
    }
  ];

  let restored = 0;
  let skipped = 0;

  for (const user of users) {
    try {
      // Check if user already exists
      const existing = await sql`
        SELECT cedula FROM users WHERE cedula = ${user.cedula}
      `;

      if (existing.length > 0) {
        console.log(`⏭️  Usuario ya existe: ${user.name} ${user.lastname} (${user.email})`);
        skipped++;
      } else {
        await sql`
          INSERT INTO users (cedula, name, lastname, email, password, role, verified)
          VALUES (${user.cedula}, ${user.name}, ${user.lastname}, ${user.email}, ${user.password}, ${user.role}, ${user.verified})
        `;
        console.log(`✅ Restaurado: ${user.name} ${user.lastname} (${user.email}) - Rol: ${user.role}`);
        restored++;
      }
    } catch (error) {
      console.error(`❌ Error restaurando ${user.email}:`, error.message);
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Usuarios restaurados: ${restored}`);
  console.log(`   ⏭️  Usuarios ya existentes: ${skipped}`);
  console.log(`\n🔑 Contraseña por defecto para todos: password123`);
  console.log('\n✨ ¡Restauración completada!');
}

restoreUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error en la restauración:', error);
    process.exit(1);
  });
