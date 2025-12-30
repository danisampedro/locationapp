import sequelize from '../config/database.js'
import { User } from '../models/index.js'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

dotenv.config()

const fixUser = async () => {
  try {
    await sequelize.authenticate()
    console.log('✅ Conectado a la base de datos')

    const username = 'danisampedro'
    const password = '76499486'

    console.log(`🔧 Verificando/creando usuario: ${username}`)
    
    const existing = await User.findOne({ where: { username } })
    
    const passwordHash = await bcrypt.hash(password, 10)

    if (existing) {
      console.log(`🔄 Usuario ${username} existe, actualizando contraseña y rol...`)
      await existing.update({
        passwordHash,
        role: 'admin'
      })
      console.log(`✅ Usuario ${username} actualizado correctamente`)
      console.log(`   - Contraseña: ${password}`)
      console.log(`   - Rol: admin`)
    } else {
      console.log(`🆕 Usuario ${username} no existe, creándolo...`)
      await User.create({
        username,
        passwordHash,
        role: 'admin'
      })
      console.log(`✅ Usuario ${username} creado correctamente`)
      console.log(`   - Contraseña: ${password}`)
      console.log(`   - Rol: admin`)
    }

    // Verificar que el usuario funciona
    const testUser = await User.findOne({ where: { username } })
    const isValid = await bcrypt.compare(password, testUser.passwordHash)
    
    if (isValid) {
      console.log('✅ Verificación: La contraseña funciona correctamente')
    } else {
      console.log('❌ ERROR: La contraseña no funciona después de actualizar')
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

fixUser()

