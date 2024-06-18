const { Router } = require('express')
const { ValidationError } = require("sequelize")

const Businesses = require('../models/businesses')
const Reviews = require('../models/reviews')
const Photos = require('../models/photos')

const router = Router()

/*
 * Route to list all of a user's businesses.
 */
router.get('/:userid/businesses', async function (req, res) {
  const userid = parseInt(req.params.userid)
  const result = await Businesses.findAll({where:{ownerid: userid}})

  res.status(200).send({
    uid: userid,
    businesses: result
  })
})

/*
 * Route to list all of a user's reviews.
 */
router.get('/:userid/reviews', async function (req, res) {
  const userid = parseInt(req.params.userid)
  const result = await Reviews.findAll({where:{userid: userid}})

  res.status(200).send({
    uid: userid,
    reviews: result
  })
})

/*
 * Route to list all of a user's photos.
 */
router.get('/:userid/photos',async function (req, res) {
  const userid = parseInt(req.params.userid)
  const result = await Photos.findAll({where:{userid: userid}})

  res.status(200).send({
    uid: userid,
    photos: result
  })
})

module.exports = router