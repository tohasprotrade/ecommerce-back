import mongoose from 'mongoose';
import connectDB from './config/connectDB.js';

connectDB().then(async () => {
    try {
        const db = mongoose.connection.db;
        const collection = db.collection('products');
        
        // Drop the incorrect productId index
        await collection.dropIndex('productId_1');
        console.log('Dropped productId_1 index successfully');
    } catch (error) {
        console.log('Error dropping index:', error.message);
    } finally {
        process.exit(0);
    }
});
