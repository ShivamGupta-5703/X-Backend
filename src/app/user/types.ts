export const types  = `#graphql
    type User {
        id : ID!,
        firstname : String!,
        lastname : String,
        email : String!,
        profileImageURL : String,

        tweets : [Tweet]

        recommendedUsers: [User]

        followers : [User]
        following : [User]
    }
`;