import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Automatically picks up UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from env
const redis  =  Redis.fromEnv()


export const orderRateLimiter = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics : true,
    prefix : "ratelimit:order"
})