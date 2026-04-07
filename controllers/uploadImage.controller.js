import uploadImageClodinary from "../utils/uploadImageClodinary.js"

export const uploadImageController = async(request,response)=>{
    try {
        const file = request.file

        const uploadImage = await uploadImageClodinary(file)

        return response.json({
            message : "Upload done",
            data : uploadImage,
            success : true,
            error : false
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export const uploadMultipleImageController = async(request,response)=>{
    try {
        const files = request.files

        if (!files || files.length === 0) {
            return response.status(400).json({
                message: "No files uploaded",
                error: true,
                success: false
            })
        }

        const uploadPromises = files.map(file => uploadImageClodinary(file))
        const uploadResults = await Promise.all(uploadPromises)

        return response.json({
            message : "Upload done",
            data : uploadResults, // Array of cloudinary responses
            success : true,
            error : false
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}