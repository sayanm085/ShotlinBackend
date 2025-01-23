const mongoose = require("mongoose");
const { DB_NAME } = require("../constants.js");

let connectDB = async () => {
    try {
        let databaseResponse = await mongoose.connect(`${process.env.DATABASE_URL}/${DB_NAME}`);
        console.log(`\n MongoDB connected successfully to the database ${DB_NAME} 😎😎 :-> ${databaseResponse.connection.host}`);
    } catch (error) {
        console.log("error in db connection", error);
        process.exit(1);
    }
}

module.exports = connectDB;
