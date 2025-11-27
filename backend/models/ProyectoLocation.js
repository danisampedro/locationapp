import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const ProyectoLocation = sequelize.define('ProyectoLocation', {
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
  locationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'locations',
      key: 'id'
    }
  },
  setName: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  basecampLink: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  distanceLocBase: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  }
}, {
  tableName: 'ProyectoLocations',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['proyectoId', 'locationId']
    }
  ]
})

export default ProyectoLocation

