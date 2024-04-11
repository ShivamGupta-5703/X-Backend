import axios from "axios";
import { prismaClient } from "../clients/db";
import JWTService from "./jwt";

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

class UserService{
    public static async verifyGoogleAuthToken(token : string) {
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
    }

    public static getUserById(id : string) {
        return prismaClient.user.findUnique({where : {id}});
    }

    public static followUser(from: string, to: string) {
		return prismaClient.follows.create({
			data: {
				follower: { connect: { id: from } },
				following: { connect: { id: to } },
			},
		});
	}

    public static unfollowUser(from : string, to: string){
        return prismaClient.follows.delete({
            where : {followerId_followingId : {followerId: from, followingId: to}},
        });
    }

}

export default UserService;