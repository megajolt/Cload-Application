const { Router } = require('express')
const { ValidationError } = require('sequelize')

const { Photo, PhotoClientFields } = require('../models/photo')

const router = Router()
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // No token provided

  jwt.verify(token, 'bingbong', (err, user) => {
    if (err) return res.sendStatus(403); // Invalid token

    req.user = user;
    next();
  });
}

// Middleware to authorize user based on ownerId in the request body
function authorizeUserForCreation(req, res, next) {
  const userId = parseInt(req.body.userId);
  console.log(userId)
  console.log(req.userID)
  if (req.user.userID !== userId&&req.user.admin==0) {
    return res.sendStatus(403); // Forbidden
  }

  next();
}

/*
 * Route to create a new photo.
 */
router.post('/',authenticateToken, authorizeUserForCreation, async function (req, res, next) {
  try {
    const photo = await Photo.create(req.body, PhotoClientFields)
    res.status(201).send({ id: photo.id })
  } catch (e) {
    if (e instanceof ValidationError) {
      res.status(400).send({ error: e.message })
    } else {
      next(e)
    }
  }
})

/*
 * Route to fetch info about a specific photo.
 */
router.get('/:photoId', async function (req, res, next) {
  const photoId = req.params.photoId
  try {
    const photo = await Photo.findByPk(photoId)
    if (photo) {
      res.status(200).send(photo)
    } else {
      next()
    }
  } catch (e) {
    next(e)
  }
})

/*
 * Route to update a photo.
 */
router.patch('/:photoId',authenticateToken, authorizeUserForCreation, async function (req, res, next) {
  const photoId = req.params.photoId
  try {
    /*
     * Update photo without allowing client to update businessId or userId.
     */
    const result = await Photo.update(req.body, {
      where: { id: photoId },
      fields: PhotoClientFields.filter(
        field => field !== 'businessId' && field !== 'userId'
      )
    })
    if (result[0] > 0) {
      res.status(204).send()
    } else {
      next()
    }
  } catch (e) {
    next(e)
  }
})

/*
 * Route to delete a photo.
 */
router.delete('/:photoId',authenticateToken, authorizeUserForCreation, async function (req, res, next) {
  const photoId = req.params.photoId
  try {
    const result = await Photo.destroy({ where: { id: photoId }})
    if (result > 0) {
      res.status(204).send()
    } else {
      next()
    }
  } catch (e) {
    next(e)
  }
})

module.exports = router
