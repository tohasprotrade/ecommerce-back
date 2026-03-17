import jwt from 'jsonwebtoken'

const auth = async(request,response,next)=>{
    try {
        const token = request.cookies.accessToken || request?.headers?.authorization?.split(" ")[1]
       
        if(!token){
            request.userId = null
            return next()
        }

        const decode = await jwt.verify(token,process.env.SECRET_KEY_ACCESS_TOKEN)

        if(!decode){
            request.userId = null
            return next()
        }

        request.userId = decode.id

        next()

    } catch (error) {
        request.userId = null
        next()
    }
}

export default auth