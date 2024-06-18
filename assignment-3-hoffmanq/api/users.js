const { Router } = require('express')

const { Business } = require('../models/business')
const { Photo } = require('../models/photo')
const { Review } = require('../models/review')
const {User} = require('../models/user')
const { ValidationError } = require('sequelize')


const router = Router()

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

function authToken(req,res,next){
  const authHeader=req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if(token == null){
    res.sendStatus(401)
  }
  jwt.verify(token, 'bingbong', (err, user) => {
    if (err) return res.sendStatus(403); // Invalid token

    req.user = user;
    next();
  });
}

function authID(req,res,next){
  const userId = parseInt(req.params.userId);

  if (req.user.userID !== parseInt(userId)&&!req.user.admin) {
    return res.sendStatus(403); // Forbidden
  }

  next();
}

function authAdminCreation(req, res, next) {
  const isAdminCreatingAdmin = req.body.admin;

  if (isAdminCreatingAdmin && (!req.user || !req.user.admin)) {
    return res.sendStatus(403); // Forbidden
  }

  next();
}

router.get('/:userId', authToken, authID,async function(req,res,next){
  const userId = req.params.userId
  try{
    const user = await User.findAll({
      where: {id: userId},
      attributes: { exclude: ['password'] }
    })
    res.status(200).send({
      user: user 
    })
  }
  catch(e){
    next(e)
  }
})

/*
 * Route to list all of a user's businesses.
 */
router.get('/:userId/businesses', authToken, authID, async function (req, res,next) {
  const userId = req.params.userId
  try {
    const userBusinesses = await Business.findAll({ where: { ownerId: userId }})
    res.status(200).send({
      businesses: userBusinesses
    })
  } catch (e) {
    next(e)
  }
})

/*
 * Route to list all of a user's reviews.
 */
router.get('/:userId/reviews', authToken, authID, async function (req, res,next) {
  const userId = req.params.userId
  try {
    const userReviews = await Review.findAll({ where: { userId: userId }})
    res.status(200).send({
      reviews: userReviews
    })
  } catch (e) {
    next(e)
  }
})

/*
 * Route to list all of a user's photos.
 */
router.get('/:userId/photos', authToken, authID, async function (req, res,next) {
  const userId = req.params.userId
  try {
    const userPhotos = await Photo.findAll({ where: { userId: userId }})
    res.status(200).send({
      photos: userPhotos
    })
  } catch (e) {
    next(e)
  }
})

router.post('/',async function(req,res,next){
  if (req.body.admin) {
    // If the request is to create an admin user, authenticate and authorize
    authToken(req, res, function() {
      authAdminCreation(req, res, async function() {
        try {
          const user = await User.create(req.body);
          res.status(201).send({ id: user.id });
        } catch (e) {
          if (e instanceof ValidationError) {
            res.status(400).send({ error: e.message });
          } else {
            next(e);
          }
        }
      });
    });
  } else {
    // Allow creation of non-admin users without authentication
    try {
      const user = await User.create(req.body);
      res.status(201).send({ id: user.id });
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).send({ error: e.message });
      } else {
        next(e);
      }
    }
  }
})

router.post('/login',async function(req,res,next){
  const {email, password} = req.body
  try{
    const user = await User.findOne({where: {email:email}})

    if(!user|| !(await bcrypt.compare(password,user.password))){
      console.log("comparing passwords")
      res.status(401).send({error:'Invalid email or password'})
    }
    console.log("password correct")
    const token = jwt.sign({userID: user.id, admin: user.admin},'bingbong',{expiresIn:'24h'})

    res.status(200).json({token})
  }
  catch(e){
    console.log("Login Error")
    res.status(500).send({ error: 'Internal Server Error' })
  }
})

module.exports = router
