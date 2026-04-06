import { Router } from 'express'
import auth from '../middleware/auth.js'
import { addToWishlistController, removeFromWishlistController, getWishlistController, checkWishlistController } from '../controllers/wishlist.controller.js'

const wishlistRouter = Router()

wishlistRouter.post('/add', auth, addToWishlistController)
wishlistRouter.post('/remove', auth, removeFromWishlistController)
wishlistRouter.get('/get', auth, getWishlistController)
wishlistRouter.get('/check', auth, checkWishlistController)

export default wishlistRouter
