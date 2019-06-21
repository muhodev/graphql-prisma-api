import {getUserId, userRoles} from '../utils/getUserId'


const Query = {
    users(parent, args, {prisma,request}, info) {
        const opArgs = {
            first: args.first,
            skip: args.skip,
            after: args.after,
            orderBy: args.orderBy
        }

        const user=getUserId(request,false);

        if(!user || user.userRole!=userRoles.admin){
            opArgs.where={
                AND:[
                    {isActive: true},
                    {status:'online'}
                ]
            }
        }
        if (args.query) {
            opArgs.where.AND.push({name_contains: args.query})
        }

        return prisma.query.users(opArgs, info)
    },
    posts(parent, args, { prisma,request }, info) {
        const opArgs = {
            first: args.first,
            skip: args.skip,
            after: args.after,
            orderBy: args.orderBy,
        }

        const user=getUserId(request,false);

        if(!user || user.userRole!=userRoles.admin){
            opArgs.where={
                AND:[
                    {isActive: true},
                    {status:"online"}
                ]
            }
        }

        if (args.query) {
            opArgs.where.OR = [{
                title_contains: args.query
            }, {
                body_contains: args.query
            }]
        }

        return prisma.query.posts(opArgs, info)
    },
    categories(parent, args, { prisma }, info) {
        const opArgs = {
            first: args.first,
            skip: args.skip,
            after: args.after,
            orderBy: args.orderBy
        }
        if (args.query) {
            opArgs.where.OR = [{
                title_contains: args.query
            }, {
                body_contains: args.query
            }]
        }

        return prisma.query.categories(opArgs, info)
    }
}

export { Query as default }