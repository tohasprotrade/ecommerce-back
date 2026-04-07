import { Router } from 'express'
import auth from '../middleware/auth.js'
import { uploadImageController, uploadMultipleImageController } from '../controllers/uploadImage.controller.js'
import upload from '../middleware/multer.js'

const uploadRouter = Router()

uploadRouter.post("/upload",auth,upload.single("image"),uploadImageController)
uploadRouter.post("/upload-multiple",auth,upload.array("images", 10),uploadMultipleImageController)

export default uploadRouter