import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'
import Proyecto from './Proyecto.js'
import Permit from './Permit.js'
import Location from './Location.js'

const ProyectoPermit = sequelize.define('ProyectoPermit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  proyectoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'proyectos',
      key: 'id'
    }
  },
  permitId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'permits',
      key: 'id'
    }
  },
  locationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'locations',
      key: 'id'
    }
  },
  solicitado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  pendienteRespuesta: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  recibido: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  pagado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  resuelto: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'ProyectoPermits',
  timestamps: true
})

// Relaciones para poder hacer includes cómodos
ProyectoPermit.belongsTo(Proyecto, { foreignKey: 'proyectoId', as: 'Proyecto' })
ProyectoPermit.belongsTo(Permit, { foreignKey: 'permitId', as: 'Permit' })
ProyectoPermit.belongsTo(Location, { foreignKey: 'locationId', as: 'Location' })

export default ProyectoPermit

