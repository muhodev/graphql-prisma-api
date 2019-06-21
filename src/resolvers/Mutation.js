import bcrypt from 'bcryptjs'
import {getUserId, userRoles} from '../utils/getUserId'
import generateToken from '../utils/generateToken'
import hashPassword from '../utils/hashPassword'

const Mutation = {
    async createUser(parent, args, { prisma }, info) {
        args.data.userRole=198 //user (198), writer(276), editor(390), admin(684)
        args.data.status="online" //banned , online, offline
        args.data.isActive=false 
        const password = await hashPassword(args.data.password)
        const user = await prisma.mutation.createUser({
            data: {
                ...args.data,
                password
            }
        })

        return {
            user,
            token: generateToken(user.id,user.userRole,user.status)
        }
    },
    async login(parent, args, { prisma }, info) {

        const user = await prisma.query.user({
            where: {
                username:args.data.username
            }
        })
        const err={}
        if (!user) {
            throw new Error("Kullanıcı bulunamadı!")
        }

        const isMatch = await bcrypt.compare(args.data.password, user.password)

        if (!isMatch) {
            throw new Error("şifre hatalı")
        }

        return {
            user,
            token: generateToken(user.id,user.userRole,user.status)
        }
    },
    deleteUser(parent, args, { prisma, request }, info) {
        const user = getUserId(request)

        let id;
        
        if(args.id && user.userRole!=userRoles.admin){
            throw new Error("Bu işlem için gerekli izniniz yok!")
        }else if(args.id && user.userRole==userRoles.admin){
            id=args.id
        }else{
            id=user.userId
        }

        //admin asla kendini silemez id'sini girmedikçe
        if(user.userRole==userRoles.admin){
            id=null
        }
        return prisma.mutation.deleteUser({
            where: {
                id: id
            }
        }, info)
    },
    async updateUser(parent, args, { prisma, request }, info) {
        const user = getUserId(request)

        if( (user.userRole != userRoles.admin) && (args.data.status || args.data.isActive || args.data.userRole)){
            throw new Error("Güncel durumunuzu ve hesabınızın aktiflik bilgisini değiştirmeye izniniz yok!")
        }
        let id;

        if( args.id && user.userRole != userRoles.admin ){
            throw new Error("Bu işlem için yetkiniz yok!")
        }else if( args.id && user.userRole == userRoles.admin ){
            id=args.id            
        }else {
            id= user.userId
        }

        if (typeof args.data.password === 'string') {
            args.data.password = await hashPassword(args.data.password)
        }
        
        return prisma.mutation.updateUser({
            where: {
                id
            },
            data: args.data
        }, info)
    },
    createPost(parent, args, { prisma, request }, info) {
        const user = getUserId(request)

        return prisma.mutation.createPost({
            data: {
                url: args.data.url,
                title: args.data.title,
                imageUrl:args.data.imageUrl || null,
                description:args.data.description,
                body: args.data.body, 
                creator: {
                    connect: {
                        id: user.userId
                    }
                },
                type: args.data.type,
                category: {
                    connect: {
                        id:args.data.category
                    }
                },
                status:"online",
                isActive:args.data.isActive || false,
                isAccess: false
            }
        }, info)
    },
    async deletePost(parent, args, { prisma, request }, info) {
        const user = getUserId(request)

        const queryPost={
            id:args.id
        }

        if(user && user.userRole!=userRoles.admin){
            queryPost.creator={id:user.userId}
        }
        
        const postExists = await prisma.exists.Post(queryPost)

        if (!postExists) {
            throw new Error('Unable to delete post')
        }
        
        return prisma.mutation.deletePost({
            where: {
                id: args.id
            }
        }, info)
    },
    async updatePost(parent, args, { prisma, request }, info) {
        const user = getUserId(request)

        if(user.userRole!=userRoles.admin && (args.data.status || args.data.isAccess )){
            throw new Error("Bu değişikliği yapmaya yetkiniz yok")
        }

        const queryPost={
            id:args.id
        }

        if(user.userRole!=userRoles.admin){
            queryPost.author={id:user.userId}
            const postExists = await prisma.exists.Post(queryPost)

            if (!postExists) {
                throw new Error('Gönderi bulunamadı')
            }
        }
        
        return prisma.mutation.updatePost({
            where: queryPost,
            data: args.data
        }, info)
    },
    createCategory(parent, args, { prisma,request }, info) {
        const user=getUserId(request)
        if(user && user.userRole==userRoles.admin){
            return prisma.mutation.createCategory({
                data:args.data
            })
        }
        throw new Error("Bu işlem için gerekli izniniz yok!")
    },
    deleteCategory(parent, args, { prisma, request }, info) {
        const user = getUserId(request)

        if(user && user.userRole!=userRoles.admin){
            throw new Error('Bu işlemi yapmak için yetkiniz yok!')
        }
        
        return prisma.mutation.deletePost({
            where: {
                id: args.id
            }
        }, info)
    },
    updateCategory(parent, args, { prisma, request }, info) {
        const user = getUserId(request)

        if(user.userRole != userRoles.admin){
            throw new Error("Bu değişikliği yapmaya yetkiniz yok")
        }

        return prisma.mutation.updatePost({
            where: {
                id: args.id
            },
            data: args.data
        }, info)
    },
    async createComment(parent, args, { prisma, request }, info) {
        const user = getUserId(request)

        const postExists = await prisma.exists.Post({
            id: args.data.post,
            status:"online",
            isActive: true //Post isActive kontrolü
        })

        if (!postExists) {
            throw new Error('Bu gönderi bulunamadı')
        }

        return prisma.mutation.createComment({
            data: {
                text: args.data.text,
                user: {
                    connect: {
                        id: user.userId
                    }
                },
                post: {
                    connect: {
                        id: args.data.post
                    }
                },
                status: "online"
            }
        }, info)
    },
    async deleteComment(parent, args, { prisma, request }, info) {
        const user = getUserId(request)

        const queryComment={
            id:args.id
        }

        if (user.userRole!=userRoles.admin) {
            queryComment.user= {
                id: user.userId
            }
            const commentExists = await prisma.exists.Comment(queryComment)

            if (!commentExists) {
                throw new Error('Bu işlem için yetkiniz yok')
            }
        }
        
        return prisma.mutation.deleteComment({
            where: queryComment
        }, info)
    },
    async updateComment(parent, args, { prisma, request }, info) {
        const user = getUserId(request)

        const queryComment={
            id:args.id
        }

        if (user.userRole!=userRoles.admin) {
            if(args.data.status){
                throw new Error('Bu işlem için yetkiniz yok')
            }
            queryComment.user= {
                id: user.userId
            }
            const commentExists = await prisma.exists.Comment(queryComment)

            if (!commentExists) {
                throw new Error('Bu işlem için yetkiniz yok')
            }
        }

        return prisma.mutation.updateComment({
            where: queryComment,
            data: args.data
        }, info)
    },
    async createCommentReplyMessage(parent, args, { prisma, request }, info) {
        const user = getUserId(request)

        const commentExists = await prisma.exists.Comment({
            id: args.data.comment,
            status:"online",
        })

        if (!commentExists) {
            throw new Error('Bu yorum bulunamadı')
        }

        return prisma.mutation.createCommentReplyMessage({
            data: {
                text: args.data.text,
                user: {
                    connect: {
                        id: user.userId
                    }
                },
                comment: {
                    connect: {
                        id: args.data.comment
                    }
                },
                status: "online"
            }
        }, info)
    },
    async updateCommentReplyMessage(parent, args, { prisma, request }, info) {
        const user = getUserId(request)

        const queryComment={
            id:args.id
        }

        if (user.userRole!=userRoles.admin) {
            if(args.data.status){
                throw new Error('Bu işlem için yetkiniz yok')
            }
            queryComment.user= {
                id: user.userId
            }
            const commentReplyExists = await prisma.exists.CommentReplyMessage(queryComment)

            if (!commentReplyExists) {
                throw new Error('Bu işlem için yetkiniz yok')
            }
        }

        return prisma.mutation.updateCommentReplyMessage({
            where: queryComment,
            data: args.data
        }, info)
    },
    async deleteCommentReplyMessage(parent, args, { prisma, request }, info) {
        const user = getUserId(request)

        const queryComment={
            id:args.id
        }

        if (user.userRole!=userRoles.admin) {
            queryComment.user= {
                id: user.userId
            }
            const commentReplyExists = await prisma.exists.CommentReplyMessage(queryComment)

            if (!commentReplyExists) {
                throw new Error('Bu işlem için yetkiniz yok')
            }
        }
        
        return prisma.mutation.deleteCommentReplyMessage({
            where: queryComment
        }, info)
    },
    
    
}

export { Mutation as default }