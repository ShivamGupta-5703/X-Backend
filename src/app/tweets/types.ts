export const types = `#graphql

    input CreateTweetData{
        content: String!
        imageURL: String
    }

    input LikeUnlikeTweetData{
        tweetId: String!
    }

    type Tweet{
        id: ID!
        content: String!
        imageURL: String
        author: User
        likes: [Likes]
    }

    type Likes{
        tweet: Tweet!
        tweetId: String!
        liker:  User
        likerId: String!
}`;