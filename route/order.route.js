import { Router } from 'express'
import auth from '../middleware/auth.js'
import { admin } from '../middleware/Admin.js'
import { CashOnDeliveryOrderController, getOrderDetailsController, paymentController, webhookStripe, guestCheckoutController, getAllOrdersController, getAllProductsStockController } from '../controllers/order.controller.js'

const orderRouter = Router()

orderRouter.post("/cash-on-delivery",auth,CashOnDeliveryOrderController)
orderRouter.post('/checkout',auth,paymentController)
orderRouter.post('/webhook',webhookStripe)
orderRouter.get("/order-list",auth,getOrderDetailsController)
orderRouter.post('/guest-checkout',guestCheckoutController)

//Admin Report APIs
orderRouter.get('/all-orders', auth, admin, getAllOrdersController)
orderRouter.get('/all-products-stock', auth, admin, getAllProductsStockController)

export default orderRouter