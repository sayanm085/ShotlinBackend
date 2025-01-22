import redis from 'redis';
import dotenv from 'dotenv';
dotenv.config();
// Create a new redis client



const redisClient = redis.createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});


redisClient.on("error", (err) => console.error("Redis Error:", err));

redisClient.connect();

export default redisClient;
