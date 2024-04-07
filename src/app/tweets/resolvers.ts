import { GraphqlContext} from "../interfaces";
import { prismaClient } from "../../clients/db";
import { Tweet } from "@prisma/client";

interface CreateTweetPayLoad {
    content : string,
    imgURL? : string,
}

const queries = {
	getAllTweets: async () => {
		const tweets = prismaClient.tweet.findMany({
		    orderBy : {createdAt : 'desc'}
		})
		return tweets;
	},
};

const mutations = {
	createTweet: async (
		parent: any,
		{ payload }: { payload: CreateTweetPayLoad },
		context: GraphqlContext
	) => {
		if (!context.user) throw new Error("Unauthorized action");
		const tweet = await prismaClient.tweet.create({
            data: {
                content: payload.content,
                imageURL : payload.imgURL,  
                author : {connect : {id : context.user.id}}
            }
		})
		return tweet;
	},
};

const extraResolvers = {
	Tweet: {
		author: async (parent: Tweet) => prismaClient.user.findUnique({
		    where : {id : parent.authorId}
		})
	},
};

export const resolvers = { queries, mutations, extraResolvers};