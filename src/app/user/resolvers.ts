import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../interfaces";
import { User } from "@prisma/client";
import UserService from "../../services/user";



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
        }
		
	},
};

const mutations = {
    followUser: async(parent : any, {to} : {to : string}, context : GraphqlContext) => {
        if(!context.user || !context.user.id) throw new Error("Unauthenticated");

        await UserService.followUser(context.user.id, to);
        return true;
    },
    
    unfollowUser: async(parent : any, {to} : {to : string}, context : GraphqlContext) => {
        if(!context.user || !context.user.id) throw new Error("Unauthenticated");

        await UserService.unfollowUser(context.user.id, to);
        return true;
    }  
}


export const resolvers = { queries, extraResolvers, mutations };