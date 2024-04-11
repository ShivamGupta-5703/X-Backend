import { resolvers } from './resolvers';
import { queries } from './queries';
import {types} from './types';
import { mutations } from './mutations';

export const User = {
    types,
    queries,
    resolvers,
    mutations,
}