import BannerModel from "../models/banner.model.js"

export const createOrUpdateBanner = async (request, response) => {
    try {
        const leftBannersRaw = request.body.leftBanners
        const rightBannerData = request.body.rightBanner
        
        const hasLeftBanners = leftBannersRaw && leftBannersRaw !== 'null' && leftBannersRaw !== 'undefined'
        const hasRightBanner = rightBannerData && rightBannerData !== 'null' && rightBannerData !== 'undefined'
        
        let leftBannersArray = []
        if (hasLeftBanners) {
            try {
                leftBannersArray = JSON.parse(leftBannersRaw)
            } catch (e) {
                leftBannersArray = []
            }
        }

        if (hasLeftBanners && leftBannersArray.length > 0) {
            const existingBanner = await BannerModel.findOne()
            
            await BannerModel.deleteMany({})
            
            const newBanner = new BannerModel({
                leftBanners: leftBannersArray,
                rightBanner: existingBanner?.rightBanner || { image: null, url: null }
            })
            
            await newBanner.save()
            
            const saved = await BannerModel.findOne()
            
            return response.json({
                message: "Left banners saved successfully",
                data: saved,
                success: true,
                error: false
            })
        }
        
        if (hasRightBanner) {
            let rightBannerObj = null
            try {
                rightBannerObj = JSON.parse(rightBannerData)
            } catch (e) {
                rightBannerObj = null
            }
            
            if (rightBannerObj && rightBannerObj.image) {
                const existingBanner = await BannerModel.findOne()
                
                if (existingBanner) {
                    existingBanner.rightBanner = {
                        image: rightBannerObj.image,
                        url: rightBannerObj.url || ""
                    }
                    await existingBanner.save()
                    
                    return response.json({
                        message: "Right banner saved successfully",
                        data: existingBanner,
                        success: true,
                        error: false
                    })
                } else {
                    const newBanner = new BannerModel({
                        leftBanners: [],
                        rightBanner: {
                            image: rightBannerObj.image,
                            url: rightBannerObj.url || ""
                        }
                    })
                    await newBanner.save()
                    
                    return response.json({
                        message: "Right banner saved successfully",
                        data: newBanner,
                        success: true,
                        error: false
                    })
                }
            }
        }

        return response.json({
            message: "No data to save",
            success: false,
            error: true
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const getBanner = async (request, response) => {
    try {
        const banner = await BannerModel.findOne()
        
        return response.json({
            message: "Banner fetched successfully",
            data: banner,
            success: true,
            error: false
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const deleteLeftBanner = async (request, response) => {
    try {
        const { index } = request.params
        
        const banner = await BannerModel.findOne()
        
        if (!banner) {
            return response.status(404).json({
                message: "Banner not found",
                error: true,
                success: false
            })
        }

        banner.leftBanners.splice(parseInt(index), 1)
        await banner.save()

        return response.json({
            message: "Banner deleted successfully",
            data: banner,
            success: true,
            error: false
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const deleteRightBanner = async (request, response) => {
    try {
        const banner = await BannerModel.findOne()
        
        if (!banner) {
            return response.status(404).json({
                message: "Banner not found",
                error: true,
                success: false
            })
        }

        banner.rightBanner = { image: null, url: null }
        await banner.save()

        return response.json({
            message: "Right banner deleted successfully",
            data: banner,
            success: true,
            error: false
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}
