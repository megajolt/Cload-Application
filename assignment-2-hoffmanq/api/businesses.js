const { Router } = require('express')
const { ValidationError } = require("sequelize")

const Businesses = require('../models/businesses')
const Reviews = require('../models/reviews')
const Photos = require('../models/photos')

const router = Router()

/*
 * Schema describing required/optional fields of a business object.
 */

/*
 * Route to return a list of businesses.
 */
router.get('/', async function (req, res,next) {
  let page = parseInt(req.query.page) || 1
  page = page < 1 ? 1 : page
  const pageSize = 10
  const offset = (page - 1)*pageSize

  const result = await Businesses.findAndCountAll({
    limit:pageSize,
    offset:offset
  })
  res.status(200).send({
    businesses: result.rows,
    count: result.count
  })
})

/*
 * Route to create a new business.
 */
router.post('/', async function (req, res, next) {
  try{
    const business = await Businesses.create(req.body,[
      "ownerid",
      "name",
      "address",
      "city",
      "state",
      "zip",
      "phone",
      "category",
      "subcategory",
      "website",
      "email"
    ])
    console.log("  -- business:", business.toJSON())
    res.status(201).send({
        id: business.id
    })

  }
  catch(e){
    if(e instanceof ValidationError){
      res.status(400).send({
        err: e.message
      })
    }
    else{
      next(e)
    }
  }
})

/*
 * Route to fetch info about a specific business.
 */
router.get('/:businessid', async function (req, res, next) {
  const id = parseInt(req.params.businessid)
  const business = await Businesses.findByPk(id,{
    include: Photos,Reviews
  })
  if(business){
    res.status(200).send(business)
  }
  else{
    next()
  }
})

/*
 * Route to replace data for a business.
 */
router.patch('/:businessid', async function (req, res, next) {
  const id =parseInt(req.params.businessid)
  const result = await Businesses.update(req.body,{
    where: {id: id}
  })
  if (result[0] > 0) {
    res.status(204).send()
  } else {
    next()
  }
})

/*
 * Route to delete a business.
 */
router.delete('/:businessid', async function (req, res, next) {
  const businessid = parseInt(req.params.businessid)
  const result = await Businesses.destroy({
    where:{id: businessid}
  })
  if(result >0){
    res.status(204).send()
  }
  else{
    next()
  }
})

module.exports = router
