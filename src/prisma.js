import { Prisma } from 'prisma-binding'
import { fragmentReplacements } from './resolvers/index'


const prisma = new Prisma({
    typeDefs: 'src/generated/prisma.graphql',
    endpoint: 'http://192.168.99.100:4466',
    fragmentReplacements

})

export {prisma as default}
