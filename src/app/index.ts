import { queries } from './user/queries';
import { resolvers } from './user/resolvers';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import bodyParser from 'body-parser';
import { User } from './user';
import { Tweet } from './tweets';
import cors from 'cors';
import { GraphqlContext } from './interfaces';
import JWTService from '../services/jwt';
import cookieParser from 'cookie-parser';

var app = express()

export async function initServer(){
    const app = express();

    app.use(bodyParser.json()); 
    app.use(cors());
    app.use(cookieParser());

    const graphqlServer = new ApolloServer<GraphqlContext>({
      typeDefs:`
        ${User.types}
        ${Tweet.types}

        type Query {
            ${User.queries}
            ${Tweet.queries}
        }

        type Mutation {
          ${User.mutations}
          ${Tweet.mutations}
        }
      `,
      resolvers:{
        Query : { 
          ...User.resolvers.queries,
          ...Tweet.resolvers.queries, 
        },
        Mutation : { 
          ...User.resolvers.mutations, 
          ...Tweet.resolvers.mutations, 
        },
        ...User.resolvers.extraResolvers,
        ...Tweet.resolvers.extraResolvers,
      },
    });
    // Note you must call `start()` on the `ApolloServer`
    // instance before passing the instance to `expressMiddleware`
    await graphqlServer.start();
    
    // Specify the path where we'd like to mount our server
    app.use(
      "/graphql",
      expressMiddleware(graphqlServer, {
        context: async ({ req, res }) => ({
          user: req.headers.authorization
            ? await JWTService.decodeToken(
                req.headers.authorization.split("Bearer ")[1]
              )
            : undefined,
        }),
      })
    );
    
    return app;
}