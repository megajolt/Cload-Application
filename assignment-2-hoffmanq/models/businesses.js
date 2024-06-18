const { DataTypes } = require("sequelize")

const sequelize = require("../sequelize")

const Businesses = sequelize.define('business', {
    ownerid: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING,allowNull:false},
    address: { type: DataTypes.STRING,allowNull:false },
    city: {  type: DataTypes.STRING,allowNull:false  },
    state: {  type: DataTypes.STRING(2),allowNull:false  },
    zip: {  type: DataTypes.STRING(5),allowNull:false  },
    phone: {  type: DataTypes.STRING,allowNull:false },
    category: {  type: DataTypes.STRING,allowNull:false },
    subcategory: {  type: DataTypes.STRING,allowNull:false },
    website: {  type: DataTypes.STRING,allowNull:true },
    email: {  type: DataTypes.STRING,allowNull:true  }
})

module.exports = Businesses