import 'dotenv/config'
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';


// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

const uploadCloud = async (
    file
) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
            file.path,
            (error, result) => {
                fs.unlinkSync(file.path);
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );
    });
};

export default uploadCloud;
