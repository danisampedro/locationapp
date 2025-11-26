import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'
import Location from './Location.js'
import Crew from './Crew.js'
import Vendor from './Vendor.js'

const Proyecto = sequelize.define('Proyecto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  logoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  }
}, {
  tableName: 'proyectos',
  timestamps: true
})

// Relaciones - se definen después de importar todos los modelos
Proyecto.belongsToMany(Location, { 
  through: 'ProyectoLocations',
  foreignKey: 'proyectoId',
  otherKey: 'locationId',
  as: 'Locations'
})

Proyecto.belongsToMany(Crew, { 
  through: 'ProyectoCrew',
  foreignKey: 'proyectoId',
  otherKey: 'crewId',
  as: 'Crews'
})

Proyecto.belongsToMany(Vendor, { 
  through: 'ProyectoVendors',
  foreignKey: 'proyectoId',
  otherKey: 'vendorId',
  as: 'Vendors'
})

Location.belongsToMany(Proyecto, {
  through: 'ProyectoLocations',
  foreignKey: 'locationId',
  otherKey: 'proyectoId',
  as: 'Proyectos'
})

Crew.belongsToMany(Proyecto, {
  through: 'ProyectoCrew',
  foreignKey: 'crewId',
  otherKey: 'proyectoId',
  as: 'Proyectos'
})

Vendor.belongsToMany(Proyecto, {
  through: 'ProyectoVendors',
  foreignKey: 'vendorId',
  otherKey: 'proyectoId',
  as: 'Proyectos'
})

export default Proyecto
