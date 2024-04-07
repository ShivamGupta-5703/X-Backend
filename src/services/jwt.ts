import { User } from '@prisma/client';
import JWT from "jsonwebtoken";
import { JWTUser } from '../app/interfaces';

class JWTService{
    public static async generateTokenForUser(user : User){
        const payload :JWTUser = { id : user?.id,
                                   email : user?.email,
                                 } as JWTUser;
        const token = JWT.sign(payload, process.env.JWT_SECRET as string);
        return token;
    }

    public static async decodeToken(token : string){
        try{
            return JWT.verify(token, process.env.JWT_SECRET as string) as JWTUser; //as JWtUser is the interface that we have created for the payload
        }catch(error){
            return null;
        }
    }
}

export default JWTService;