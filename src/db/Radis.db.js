import redis from 'redis';

// Create a new redis client

const data={
    username: 'default',
    password: 'w0qm0OsbyFWXZz4mf16nEKyjpjl0eHM0',
    socket: {
        host: 'redis-11835.c295.ap-southeast-1-1.ec2.redns.redis-cloud.com',
        port: 11835
    }
}

const redisClient = redis.createClient({});




redisClient.on("error", (err) => console.error("Redis Error:", err));

redisClient.connect();

export default redisClient;