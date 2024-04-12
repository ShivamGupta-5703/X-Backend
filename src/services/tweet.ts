import { prismaClient } from "../clients/db";
import { redisClient } from "../clients/redis";

export interface CreateTweetPayLoad {
    content : string,
    imageURL? : string,
    userId : string,
}

class TweetService{
    public static async createTweet(data : CreateTweetPayLoad) {
        
        //check if user has reached the limit
        const rateLimitFlag = await redisClient.get(
            `RATE_LIMIT:TWEET:${data.userId}`
        );
        // if limit reached throw new error.
        if (rateLimitFlag) throw new Error("Please wait....");


        // whenever new tweet created, delete tweets cache
        const tweet = await prismaClient.tweet.create({
            data : {
                content : data.content,
                imageURL : data.imageURL,
                author : {connect : { id : data.userId}},
            },
          });

          // applying rate limiter on creating tweets, [Create 1 tweet in 10 seconds]
          await redisClient.setex(`RATE_LIMIT:TWEET:${data.userId}`, 10, 1);
          await redisClient.del("ALL_TWEETS");
          return tweet;
    }


    public static async getAllTweets(){

        //caching tweets
        const cachedTweets = await redisClient.get("ALL_TWEETS");
        if (cachedTweets) return JSON.parse(cachedTweets);
        
        const tweets = await prismaClient.tweet.findMany({
          orderBy: { createdAt: "desc" },
        });
        await redisClient.set("ALL_TWEETS", JSON.stringify(tweets));
        return tweets;
    }
}

export default TweetService;