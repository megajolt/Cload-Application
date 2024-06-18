const { Router } = require('express')
const { ValidationError } = require('sequelize')

const Photos = require('../models/photos')

const router = Router()

/*
 * Route to create a new photo.
 */
router.post('/', async function (req, res, next) {
  try{
    const photo = await Photos.create(req.body,[
      "userid",
      "caption",
      "businessId"
    ])
    console.log("  -- photo:", photo.toJSON())
    res.status(201).send({
        id: photo.id
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
 * Route to fetch info about a specific photo.
 */
router.get('/:photoID', async function (req, res, next) {
  const photoID = parseInt(req.params.photoID)
  const photo = await Photos.findByPk(photoID)
  if(photo){
    res.status.send(photo)
  }
  else{
    next()
  }
})

/*
 * Route to update a photo.
 */
router.patch('/:photoID', async function (req, res, next) {
  const photoID = parseInt(req.params.photoID)
  console.log(photoID)
  const result = await Photos.update(req.body,{
    where: {id: photoID}
  })
  if(result[0]>0){
    res.status(205).send()
  }
  else{
    next()
  }
})

/*
 * Route to delete a photo.
 */
router.delete('/:photoID', async function (req, res, next) {
  const photoID = parseInt(req.params.photoID)
  const result = await Photos.destroy({
    where:{id: photoID}
  })
  if(result>0){
    res.status(204).send()
  }
  else{
    next()
  }
})

module.exports = router
