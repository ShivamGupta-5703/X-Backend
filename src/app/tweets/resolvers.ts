import { GraphqlContext} from "../interfaces";
import { prismaClient } from "../../clients/db";
import { Tweet } from "@prisma/client";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import UserService from "../../services/user";
import TweetService, { CreateTweetPayLoad } from "../../services/tweet";



const s3Client = new S3Client({
	region : process.env.AWS_DEFAULT_REGION,
});

const queries = {
	getAllTweets: async () => TweetService.getAllTweets(),

	getSignedURLForTweet: async (parent :any , {imageType, imageName} : {imageType : string, imageName : string},context : GraphqlContext) => {
		//if user is not login/authorised
		//console.log(context);
		
		if( !context.user || !context.user.id) throw new Error("Unauthenticated");
		const allowedImageTypes = [
			"image/jpg",
			"image/jpeg",
			"image/png",
			"image/webp",
		];
		if( !allowedImageTypes.includes(imageType) ) throw new Error("Unsupported Image Type");
		const putObjectCommand = new PutObjectCommand({
		    Bucket : process.env.AWS_S3_BUCKET,
			ContentType : imageType,
			Key : `uploads/${context.user.id}/tweets/${Date.now()}-${imageName}.${imageType}`,
		});

		// by default expiry is 12 hours or you can set it. 
		//const signedURL = await getSignedUrl(s3Client, putObjectCommand, {expiresIn: 60 * 60 * 12})
		const signedURL = await getSignedUrl(s3Client, putObjectCommand);
		//console.log(signedURL);
		
		return signedURL;
	}
};

const mutations = {
	createTweet: async (
		parent: any,
		{ payload }: { payload: CreateTweetPayLoad },
		context: GraphqlContext
	) => {
		if (!context.user) throw new Error("Unauthorized action");
		const tweet = await TweetService.createTweet({
			...payload,
			userId : context.user.id,
		});
		return tweet;
	},
};

const extraResolvers = {
	Tweet: {
		author: async (parent: Tweet) => await UserService.getUserById(parent.authorId),
	},
};

export const resolvers = { queries, mutations, extraResolvers};