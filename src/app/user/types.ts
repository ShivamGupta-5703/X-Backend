export const types  = `#graphql
    type User {
        id : ID!,
        firstname : String!,
        lastname : String,
        email : String!,
        profileImageURL : String,

        tweets : [Tweet]

        followers : [User]
        following : [User]
    }
`;