import Stripe from "../config/stripe.js";
import CartProductModel from "../models/cartproduct.model.js";
import OrderModel from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import AddressModel from "../models/address.model.js";
import ProductModel from "../models/product.model.js";
import bcryptjs from 'bcryptjs';
import mongoose from "mongoose";

 export async function CashOnDeliveryOrderController(request,response){
    try {
        const userId = request.userId // auth middleware 
        const { list_items, totalAmt, addressId,subTotalAmt } = request.body 

        // Decrease stock for each product
        for (const item of list_items) {
            const product = await ProductModel.findById(item.productId._id)
            if (product && product.stock) {
                const newStock = product.stock - (item.quantity || 1)
                await ProductModel.findByIdAndUpdate(item.productId._id, { 
                    stock: newStock > 0 ? newStock : 0 
                })
            }
        }

        const payload = list_items.map(el => {
            return({
                userId : userId,
                orderId : `ORD-${new mongoose.Types.ObjectId()}`,
                productId : el.productId._id, 
                product_details : {
                    name : el.productId.name,
                    image : el.productId.image
                } ,
                paymentId : "",
                payment_status : "CASH ON DELIVERY",
                delivery_address : addressId ,
                subTotalAmt  : subTotalAmt,
                totalAmt  :  totalAmt,
            })
        })

        const generatedOrder = await OrderModel.insertMany(payload)

        ///remove from the cart
        const removeCartItems = await CartProductModel.deleteMany({ userId : userId })
        const updateInUser = await UserModel.updateOne({ _id : userId }, { shopping_cart : []})

        return response.json({
            message : "Order successfully",
            error : false,
            success : true,
            data : generatedOrder
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error ,
            error : true,
            success : false
        })
    }
}

export const pricewithDiscount = (price,dis = 1)=>{
    const discountAmout = Math.ceil((Number(price) * Number(dis)) / 100)
    const actualPrice = Number(price) - Number(discountAmout)
    return actualPrice
}

export async function paymentController(request,response){
    try {
        const userId = request.userId // auth middleware 
        const { list_items, totalAmt, addressId,subTotalAmt } = request.body 

        const user = await UserModel.findById(userId)

        const line_items  = list_items.map(item =>{
            return{
               price_data : {
                    currency : 'inr',
                    product_data : {
                        name : item.productId.name,
                        images : item.productId.image,
                        metadata : {
                            productId : item.productId._id
                        }
                    },
                    unit_amount : pricewithDiscount(item.productId.price,item.productId.discount) * 100   
               },
               adjustable_quantity : {
                    enabled : true,
                    minimum : 1
               },
               quantity : item.quantity 
            }
        })

        const params = {
            submit_type : 'pay',
            mode : 'payment',
            payment_method_types : ['card'],
            customer_email : user.email,
            metadata : {
                userId : userId,
                addressId : addressId
            },
            line_items : line_items,
            success_url : `${process.env.FRONTEND_URL}/success`,
            cancel_url : `${process.env.FRONTEND_URL}/cancel`
        }

        const session = await Stripe.checkout.sessions.create(params)

        return response.status(200).json(session)

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}


const getOrderProductItems = async({
    lineItems,
    userId,
    addressId,
    paymentId,
    payment_status,
 })=>{
    const productList = []

    if(lineItems?.data?.length){
        for(const item of lineItems.data){
            const product = await Stripe.products.retrieve(item.price.product)

            const paylod = {
                userId : userId,
                orderId : `ORD-${new mongoose.Types.ObjectId()}`,
                productId : product.metadata.productId, 
                product_details : {
                    name : product.name,
                    image : product.images
                } ,
                paymentId : paymentId,
                payment_status : payment_status,
                delivery_address : addressId,
                subTotalAmt  : Number(item.amount_total / 100),
                totalAmt  :  Number(item.amount_total / 100),
            }

            productList.push(paylod)
        }
    }

    return productList
}

//http://localhost:8080/api/order/webhook
export async function webhookStripe(request,response){
    const event = request.body;
    const endPointSecret = process.env.STRIPE_ENPOINT_WEBHOOK_SECRET_KEY

    console.log("event",event)

    // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const lineItems = await Stripe.checkout.sessions.listLineItems(session.id)
      const userId = session.metadata.userId
      const orderProduct = await getOrderProductItems(
        {
            lineItems : lineItems,
            userId : userId,
            addressId : session.metadata.addressId,
            paymentId  : session.payment_intent,
            payment_status : session.payment_status,
        })
    
      const order = await OrderModel.insertMany(orderProduct)

        //Decrease stock for each product
        for (const item of orderProduct) {
            const product = await ProductModel.findById(item.productId)
            if (product && product.stock) {
                const newStock = product.stock - 1
                await ProductModel.findByIdAndUpdate(item.productId, { 
                    stock: newStock > 0 ? newStock : 0 
                })
            }
        }

        console.log(order)
        if(Boolean(order[0])){
            const removeCartItems = await  UserModel.findByIdAndUpdate(userId,{
                shopping_cart : []
            })
            const removeCartProductDB = await CartProductModel.deleteMany({ userId : userId})
        }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  response.json({received: true});
}


export async function getOrderDetailsController(request,response){
    try {
        const userId = request.userId // order id

        const orderlist = await OrderModel.find({ userId : userId }).sort({ createdAt : -1 }).populate('delivery_address')

        return response.json({
            message : "order list",
            data : orderlist,
            error : false,
            success : true
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//Guest checkout - no auth required
export async function guestCheckoutController(request,response){
    try {
        const { 
            guestName, 
            mobile, 
            address_line, 
            city, 
            state, 
            country, 
            pincode,
            list_items, 
            totalAmt, 
            subTotalAmt,
            paymentMethod
        } = request.body 

        if(!guestName || !mobile || !address_line || !city || !state || !country || !pincode){
            return response.status(400).json({
                message : "Please provide all required fields",
                error : true,
                success : false
            })
        }

        if(!list_items || list_items.length === 0){
            return response.status(400).json({
                message : "Cart is empty",
                error : true,
                success : false
            })
        }

        let userId

        //Check if user exists with this mobile number
        let user = await UserModel.findOne({ mobile: String(mobile) })

        if(user){
            //User exists, use existing user
            userId = user._id
        } else {
            //Create new user automatically
            const salt = await bcryptjs.genSalt(10)
            const randomPassword = Math.random().toString(36).slice(-8)
            const hashPassword = await bcryptjs.hash(randomPassword, salt)

            const newUser = new UserModel({
                name: guestName,
                email: `guest_${mobile}@gram2ghor.com`,
                mobile: String(mobile),
                password: hashPassword,
                role: 'USER',
                verify_email: false,
                status: 'Active'
            })

            user = await newUser.save()
            userId = user._id
        }

        //Create address for the order
        const address = new AddressModel({
            userId: userId,
            address_line: address_line,
            city: city,
            state: state,
            country: country,
            pincode: pincode,
            mobile: String(mobile),
            status: true
        })

        const savedAddress = await address.save()

        //Decrease stock for each product
        for (const item of list_items) {
            const productId = item.productId?._id || item.productId
            const product = await ProductModel.findById(productId)
            if (product && product.stock) {
                const newStock = product.stock - (item.quantity || 1)
                await ProductModel.findByIdAndUpdate(productId, { 
                    stock: newStock > 0 ? newStock : 0 
                })
            }
        }

        //Create order
        const orderPayload = list_items.map(el => ({
            userId : userId,
            orderId : `ORD-${new mongoose.Types.ObjectId()}`,
            productId : el.productId?._id || el.productId, 
            product_details : {
                name : el.productId?.name || el.name,
                image : el.productId?.image?.[0] || el.image?.[0] || ''
            },
            paymentId : paymentMethod === 'online' ? "STRIPE_PAYMENT" : "",
            payment_status : paymentMethod === 'online' ? "PAID" : "CASH ON DELIVERY",
            delivery_address : savedAddress._id,
            subTotalAmt  : subTotalAmt,
            totalAmt  : totalAmt,
            guestInfo: {
                name: guestName,
                mobile: String(mobile)
            }
        }))

        const generatedOrder = await OrderModel.insertMany(orderPayload)

        return response.json({
            message : "Order placed successfully",
            error : false,
            success : true,
            data: {
                orderId: generatedOrder[0]?.orderId,
                userId: userId,
                guestName: guestName,
                mobile: mobile
            }
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//Get all orders for admin report
export async function getAllOrdersController(request, response) {
    try {
        const { page = 1, limit = 50, search, paymentStatus } = request.query

        const query = {}

        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { 'guestInfo.name': { $regex: search, $options: 'i' } },
                { 'guestInfo.mobile': { $regex: search, $options: 'i' } }
            ]
        }

        if (paymentStatus) {
            query.payment_status = paymentStatus
        }

        const skip = (page - 1) * limit

        const [orders, totalCount] = await Promise.all([
            OrderModel.find(query)
                .populate('userId', 'name email mobile')
                .populate('productId', 'name stock')
                .populate('delivery_address')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            OrderModel.countDocuments(query)
        ])

        const totalAmount = orders.reduce((sum, order) => sum + (order.totalAmt || 0), 0)

        return response.json({
            message: 'Orders list',
            data: orders,
            totalAmount,
            totalOrders: totalCount,
            totalCount,
            totalPage: Math.ceil(totalCount / limit),
            page: Number(page),
            error: false,
            success: true
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

//Get all products with stock for admin report
export async function getAllProductsStockController(request, response) {
    try {
        const { page = 1, limit = 50, search } = request.query

        const query = { publish: true }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ]
        }

        const skip = (page - 1) * limit

        const [products, totalCount] = await Promise.all([
            ProductModel.find(query)
                .populate('category', 'name')
                .populate('subCategory', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            ProductModel.countDocuments(query)
        ])

        const totalStock = products.reduce((sum, product) => sum + (product.stock || 0), 0)
        const outOfStock = products.filter(p => !p.stock || p.stock <= 0).length
        const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length

        return response.json({
            message: 'Products stock list',
            data: products,
            summary: {
                totalProducts: totalCount,
                totalStock,
                outOfStock,
                lowStock
            },
            totalCount,
            totalPage: Math.ceil(totalCount / limit),
            page: Number(page),
            error: false,
            success: true
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

//Update order (delivery date, status) - Admin/Super Admin
export async function updateOrderController(request, response) {
    try {
        const { orderId, delivery_date, order_status } = request.body

        if (!orderId) {
            return response.status(400).json({
                message: "Order ID is required",
                error: true,
                success: false
            })
        }

        const updateData = {}

        if (delivery_date) {
            updateData.delivery_date = new Date(delivery_date)
        }

        if (order_status) {
            updateData.order_status = order_status
        }

        const updatedOrder = await OrderModel.findByIdAndUpdate(orderId, updateData, { new: true })

        if (!updatedOrder) {
            return response.status(404).json({
                message: "Order not found",
                error: true,
                success: false
            })
        }

        return response.json({
            message: "Order updated successfully",
            data: updatedOrder,
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

//Track order by order ID (no auth required)
export async function trackOrderController(request, response) {
    try {
        const { orderId } = request.query;

        if (!orderId) {
            return response.status(400).json({
                message: "Order ID is required",
                error: true,
                success: false
            });
        }

        const order = await OrderModel.findOne({ orderId: orderId })
            .populate('delivery_address')
            .populate('productId', 'name image');

        if (!order) {
            return response.status(404).json({
                message: "Order not found",
                error: true,
                success: false
            });
        }

        return response.json({
            message: "Order details",
            data: order,
            error: false,
            success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}
