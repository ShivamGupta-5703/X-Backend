import JWTService from "../../services/jwt";                                                                                                                                        import axios from "axios";
import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../interfaces";
import { User } from "@prisma/client";

interface GoogleTokenResult {
    iss?:           string;
    azp?:           string;
    aud?:           string;
    sub?:           string;
    email?:         string;
    email_verified?:string;
    nbf?:           string;
    name?:          string;
    picture?:       string;
    given_name?:    string;
    family_name?:   string;
    iat?:           string;
    exp?:           string;
    jti?:           string;
    alg?:           string;
    kid?:           string;
    typ?:           string;
}

const queries = {
    verifyGoogleToken : async (parent : any, {token} : {token : string}) =>{
        const googleToken = token;
        const googleOauthURL = new URL("https://oauth2.googleapis.com/tokeninfo");
        googleOauthURL.searchParams.set("id_token", googleToken);

        const {data} = await axios.get<GoogleTokenResult>(googleOauthURL.toString(),{
            responseType :'json',
        });
        
        // find user
        const checkForUser = await prismaClient.user.findUnique({where : {email : data.email}});

        // if no user found, create one
        if(!checkForUser){
            const user = await prismaClient.user.create({
                data : {
                    email : data.email, 
                    firstname : data.given_name!,
                    lastname : data.family_name,
                    profileImageURL : data.picture
                },
            });
        }

        // find user from db
        const userInDb = await prismaClient.user.findUnique({
            where : {email : data.email}
        });

        // if not found, throw error
        if(!userInDb){
            throw new Error("User not found");
        }

        // generate token for user
        const userToken = JWTService.generateTokenForUser(userInDb);

        //return token
        return userToken;
    },
    
    getCurrentUser : async (parent : any, args : any, context : GraphqlContext) =>{
        const id = context.user?.id;
        //console.log(id);
        if(!id){
            return null;
        }
        const user = await prismaClient.user.findUnique({
            where : {id}
        })
        //console.log(user);
        
        return user;
    },

    getUserById : async (parent : any,{id} : {id : string}, context : GraphqlContext) =>{
        const user = await prismaClient.user.findUnique({
            where : {id}
        })
        //console.log(user);
        
        return user;
    }


}

const extraResolvers = {
	User: {
		tweets: (parent: User) => prismaClient.tweet.findMany({where : {author : {id : parent.id}}}),
		
	},
};


export const resolvers = { queries, extraResolvers  };