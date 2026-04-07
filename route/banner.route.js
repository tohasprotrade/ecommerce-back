import { Router } from 'express'
import authAdmin from '../middleware/authAdmin.js'
import { createOrUpdateBanner, getBanner, deleteLeftBanner, deleteRightBanner } from '../controllers/banner.controller.js'
import upload from '../middleware/multer.js'

const bannerRouter = Router()

bannerRouter.get("/get", getBanner)
bannerRouter.post("/create", authAdmin, upload.none(), createOrUpdateBanner)
bannerRouter.delete("/left/:index", authAdmin, deleteLeftBanner)
bannerRouter.delete("/right", authAdmin, deleteRightBanner)

export default bannerRouter