import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../interfaces";
import { User } from "@prisma/client";
import UserService from "../../services/user";
import { redisClient } from "../../clients/redis";



const queries = {
    verifyGoogleToken : async (parent : any, {token} : {token : string}) =>{
        const resultToken = await UserService.verifyGoogleAuthToken(token);
        return resultToken;
    },
    
    getCurrentUser : async (parent : any, args : any, context : GraphqlContext) =>{
        const id = context.user?.id;
        //console.log(id);
        if(!id){
            return null;
        }
        const user = await UserService.getUserById(id);
        //console.log(user);
        
        return user;
    },

    getUserById : async (parent : any,{id} : {id : string}, context : GraphqlContext) =>{
        const user = await UserService.getUserById(id);
        //console.log(user);
        
        return user;
    }
}

const extraResolvers = {
	User: {
		tweets: (parent: User) => prismaClient.tweet.findMany({where : {author : {id : parent.id}}}),

        followers : async (parent : User) => {
            const result = await prismaClient.follows.findMany({
                where: { following : {id : parent.id}},
                include: { follower : true, }
            });
            return result.map((el) => el.follower);
        },

        following : async (parent : User) => {
            const result = await prismaClient.follows.findMany({
                where: { follower : {id : parent.id}},
                include: { following : true, }
            });
            return result.map((el) => el.following);
        },

        recommendedUsers : async(parent : User, _ : any ,context : GraphqlContext) => {
            // no user -> no recommended users.
            if(!context.user || !context.user.id) return [];
            
            // if recommended users are cached, return cached value.
            const cachedData = await redisClient.get(`RECOMMENDED_USERS:${context.user.id}`);
            
            if(cachedData){
                //console.log("Found cache");
                return JSON.parse(cachedData);
            }

            // find user i follow, then find their following for our recommendation
            const myFollowing = await prismaClient.follows.findMany({
                where : { follower : { id : context.user.id }},
                include : { following : { include : { followers : { include : { following : true }} }}},
            }); 

            //console.log(myFollowing);
            

            const users: User[] = []
            for (const followings of myFollowing){
                for (const followingOfFollowedUser of followings.following.followers){
                    // dont recommend me && if i dont follow then only recommend user
                    if ( followingOfFollowedUser.following.id !== context.user.id &&
                         myFollowing.findIndex(e => e?.followingId === followingOfFollowedUser.following.id) < 0){
                        console.log(followingOfFollowedUser.following);
                        users.push(followingOfFollowedUser.following);
                    }
                }
            }
            //console.log(users);

            //console.log("Cache not found");
            // store recommended users in redis cache, with unique key
            await redisClient.set(`RECOMMENDED_USERS:${context.user.id}`, JSON.stringify(users));
            
            return users;
        },
		
	},
};

const mutations = {
    followUser: async(parent : any, {to} : {to : string}, context : GraphqlContext) => {
        if(!context.user || !context.user.id) throw new Error("Unauthenticated");

        await UserService.followUser(context.user.id, to);

        //whenever i change following, delete cache to see updated data.
        await redisClient.del(`RECOMMENDED_USERS:${context.user.id}`);
        return true;
    },
    
    unfollowUser: async(parent : any, {to} : {to : string}, context : GraphqlContext) => {
        if(!context.user || !context.user.id) throw new Error("Unauthenticated");

        await UserService.unfollowUser(context.user.id, to);

        //whenever i change following, delete cache to see updated data.
        await redisClient.del(`RECOMMENDED_USERS:${context.user.id}`);
        return true;
    }  
}


export const resolvers = { queries, extraResolvers, mutations };