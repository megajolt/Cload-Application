const { Router } = require('express')
const {ValidationError} = require('sequelize')

const Reviews = require('../models/reviews')

const router = Router()

/*
 * Route to create a new review.
 */
router.post('/', async function (req, res, next) {
  try{
    const review = await Reviews.create(req.body,[
      "userid",
      "dollars",
      "stars",
      "reviews",
      "businessid"
    ])
    console.log("  -- review:", review.toJSON())
    res.status(201).send({
        id: review.id
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
 * Route to fetch info about a specific review.
 */
router.get('/:reviewID', async function (req, res, next) {
  const reviewID = parseInt(req.params.reviewID)
  const review = await Reviews.findByPk(reviewID)
  if(review){
    res.status.send(review)
  }
  else{
    next()
  }
})

/*
 * Route to update a review.
 */
router.patch('/:reviewID', async function (req, res, next) {
  const reviewID = parseInt(req.params.reviewID)
  const result = await Reviews.update(req.body,{
    where:{id: reviewID}
  })
  if(result[0]>0){
    res.status(205).send()
  }
  else{
    next()
  }
})

/*
 * Route to delete a review.
 */
router.delete('/:reviewID', async function (req, res, next) {
  const reviewID = parseInt(req.params.reviewID)
  const result = await Reviews.destroy({
      where:{id: reviewID}
  })
  if(result>0){
    res.status(204).send()
  }
  else{
    next()
  }
})

module.exports = router