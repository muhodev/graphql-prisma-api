import {getUserId, userRoles} from '../utils/getUserId'

const User = {
    posts: {
        fragment: 'fragment userId on User { id }',
        resolve(parent, args, { prisma }, info) {
            return prisma.query.posts({
                where: {
                    published: true,
                    author: {
                        id: parent.id
                    }
                }
            })
        }
    },
    email: {
        fragment: 'fragment userId on User { id }',
        resolve(parent, args, { request }, info) {
            const user = getUserId(request, false)

            if (user && (user.userId === parent.id || user.userRole==userRoles.admin)) {
                return parent.email
            } else {
                return null
            }
        }
    },
    password: {
        fragment: 'fragment userId on User { id }',
        resolve(parent, args, { request }, info) {
            const user = getUserId(request, false)

            if (user && user.userId === parent.id) {
                return parent.password
            } else {
                return null
            }
        }
    }
}

export { User as default }