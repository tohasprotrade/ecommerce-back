import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
    leftBanners: [{
        image: {
            type: String,
            default: ""
        },
        url: {
            type: String,
            default: ""
        }
    }],
    rightBanner: {
        image: {
            type: String,
            default: null
        },
        url: {
            type: String,
            default: null
        }
    }
}, {
    timestamps: true
});

const BannerModel = mongoose.model("banner", bannerSchema);
export default BannerModel;
