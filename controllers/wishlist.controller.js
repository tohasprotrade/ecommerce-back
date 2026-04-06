import WishlistModel from "../models/wishlist.model.js";

export async function addToWishlistController(request, response) {
    try {
        const userId = request.userId;

        if (!userId) {
            return response.json({
                message: "Please login to add to wishlist",
                error: true,
                success: false
            });
        }

        const { productId } = request.body;

        if (!productId) {
            return response.json({
                message: "Product ID is required",
                error: true,
                success: false
            });
        }

        const existingWishlist = await WishlistModel.findOne({
            userId: userId,
            productId: productId
        });

        if (existingWishlist) {
            return response.json({
                message: "Product already in wishlist",
                error: true,
                success: false
            });
        }

        const wishlistItem = new WishlistModel({
            userId: userId,
            productId: productId
        });

        await wishlistItem.save();

        const populatedWishlist = await WishlistModel.findById(wishlistItem._id).populate('productId');

        return response.json({
            message: "Product added to wishlist",
            error: false,
            success: true,
            data: populatedWishlist
        });

    } catch (error) {
        return response.json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function removeFromWishlistController(request, response) {
    try {
        const userId = request.userId;

        if (!userId) {
            return response.json({
                message: "Please login",
                error: true,
                success: false
            });
        }

        const { productId } = request.body;

        if (!productId) {
            return response.json({
                message: "Product ID is required",
                error: true,
                success: false
            });
        }

        const deleted = await WishlistModel.findOneAndDelete({
            userId: userId,
            productId: productId
        });

        if (!deleted) {
            return response.json({
                message: "Product not found in wishlist",
                error: true,
                success: false
            });
        }

        return response.json({
            message: "Product removed from wishlist",
            error: false,
            success: true
        });

    } catch (error) {
        return response.json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function getWishlistController(request, response) {
    try {
        const userId = request.userId;

        if (!userId) {
            return response.json({
                message: "Please login",
                error: true,
                success: false
            });
        }

        const wishlist = await WishlistModel.find({ userId: userId })
            .populate('productId')
            .sort({ createdAt: -1 });

        return response.json({
            message: "Wishlist items",
            data: wishlist,
            error: false,
            success: true
        });

    } catch (error) {
        return response.json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function checkWishlistController(request, response) {
    try {
        const userId = request.userId;

        if (!userId) {
            return response.json({
                message: "Please login",
                error: true,
                success: false
            });
        }

        const { productId } = request.query;

        if (!productId) {
            return response.json({
                message: "Product ID is required",
                error: true,
                success: false
            });
        }

        const existingWishlist = await WishlistModel.findOne({
            userId: userId,
            productId: productId
        });

        return response.json({
            message: "Check wishlist status",
            data: { isInWishlist: !!existingWishlist },
            error: false,
            success: true
        });

    } catch (error) {
        return response.json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}
