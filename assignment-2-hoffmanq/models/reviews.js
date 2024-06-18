const { DataTypes } = require("sequelize")

const sequelize = require("../sequelize")
const Businesses = require("./businesses")

const Reviews = sequelize.define('review', {
    userid: { type: DataTypes.INTEGER, allowNull: false  },
    dollars: { type: DataTypes.FLOAT, allowNull: false  },
    stars: { type: DataTypes.INTEGER, allowNull: false  },
    review: { type: DataTypes.TEXT, allowNull: true  }
})

Businesses.hasMany(Reviews,{
    foreignKey: {allowNull:false},
    onDelete:"CASCADE",
    onUpdate:"CASCADE"
})
Reviews.belongsTo(Businesses)

module.exports = Reviews