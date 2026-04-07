import jwt from 'jsonwebtoken'
import userModel from '../models/user.model.js'

const authAdmin = async(request,response,next)=>{
    try {
        const token = request.cookies.accessToken || request?.headers?.authorization?.split(" ")[1]
       
        if(!token){
            return response.status(401).json({
                message : "Unauthorized",
                error : true,
                success : false
            })
        }

        const decode = await jwt.verify(token,process.env.SECRET_KEY_ACCESS_TOKEN)

        if(!decode){
            return response.status(401).json({
                message : "Invalid token",
                error : true,
                success : false
            })
        }

        const user = await userModel.findById(decode.id)

        if(!user){
            return response.status(401).json({
                message : "User not found",
                error : true,
                success : false
            })
        }

        if(user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN'){
            return response.status(403).json({
                message : "Access denied. Admin only.",
                error : true,
                success : false
            })
        }

        request.user = user
        next()

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export default authAdmin