const { Router } = require('express')

const businessesRouter = require('./businesses')
const reviewsRouter = require('./reviews')
const photosRouter = require('./photos')
const usersRouter = require('./users')

const router = Router()

router.use('/businesses', businessesRouter)
router.use('/reviews', reviewsRouter)
router.use('/photos', photosRouter)
router.use('/users', usersRouter)

module.exports = router
