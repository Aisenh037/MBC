import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.js';
import Branch from '../models/Branch.js';

dotenv.config({ path: './.env.development' }); // Explicitly load the development env

mongoose.connect(process.env.MONGO_URI);

const adminUser = {
    name: "Admin User",
    email: process.env.ADMIN_EMAIL || "admin@mbc.com",
    password: process.env.ADMIN_PASSWORD || "Admin@123",
    role: "admin",
};

const importData = async () => {
    try {
        await User.deleteMany();
        await Branch.deleteMany();

        await User.create(adminUser);
        
         
        // Added the required 'establishmentYear' field to both branches.
        await Branch.create([
            { name: 'MDS', department: 'MBC', capacity: 60, establishmentYear: 2022 },
            { name: 'Bioinformatics', department: 'MBC', capacity: 30, establishmentYear: 2021 }
        ]);
        

        console.log('✅ Data Imported Successfully');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await User.deleteMany();
        await Branch.deleteMany();
        console.log('Data Destroyed Successfully');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}