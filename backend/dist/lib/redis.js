import Redis from 'ioredis';
const redis = new Redis({
    maxRetriesPerRequest: null,
});
export default redis;
