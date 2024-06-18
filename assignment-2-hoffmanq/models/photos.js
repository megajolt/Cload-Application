const { DataTypes } = require("sequelize")

const sequelize = require("../sequelize")

const Businesses = require("./businesses")


const Photos = sequelize.define('photo', {
    userid: { type: DataTypes.INTEGER, allowNull: false },
    caption: {type: DataTypes.TEXT, allowNull: true }
})

Businesses.hasMany(Photos,{
    foreignKey:{allowNull:false},
    onDelete: "CASCADE",
    onUpdate:"CASCADE"
})
Photos.belongsTo(Businesses)

module.exports = Photos