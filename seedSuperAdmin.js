import dotenv from 'dotenv'
dotenv.config()
import connectDB from './config/connectDB.js'
import UserModel from './models/user.model.js'
import bcryptjs from 'bcryptjs'

connectDB()

const createSuperAdmin = async () => {
    try {
        const salt = await bcryptjs.genSalt(10)
        const hashedPassword = await bcryptjs.hash('Admin@123', salt)

        const superAdmin = await UserModel.findOne({ email: 'abdullahalfuad.dev@gmail.com' })

        if (superAdmin) {
            console.log('Super Admin already exists')
            console.log('Updating role to SUPER_ADMIN...')
            superAdmin.role = 'SUPER_ADMIN'
            superAdmin.name = 'Abdullah AL Muttasim Fuad'
            superAdmin.mobile = 1618566586
            superAdmin.verify_email = true
            superAdmin.status = 'Active'
            await superAdmin.save()
            console.log('Super Admin updated successfully!')
        } else {
            const newSuperAdmin = new UserModel({
                name: 'Abdullah AL Muttasim Fuad',
                email: 'abdullahalfuad.dev@gmail.com',
                password: hashedPassword,
                mobile: 1618566586,
                role: 'SUPER_ADMIN',
                verify_email: true,
                status: 'Active'
            })
            await newSuperAdmin.save()
            console.log('Super Admin created successfully!')
        }
        
        console.log('\n=== SUPER ADMIN CREDENTIALS ===')
        console.log('Email: abdullahalfuad.dev@gmail.com')
        console.log('Password: Admin@123')
        console.log('Role: SUPER_ADMIN')
        console.log('================================\n')
        
        process.exit(0)
    } catch (error) {
        console.error('Error:', error.message)
        process.exit(1)
    }
}

createSuperAdmin()
