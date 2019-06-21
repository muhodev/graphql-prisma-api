import jwt from 'jsonwebtoken'

const getUserId = (request, requireAuth = true) => {
    const header = request.request ? request.request.headers.authorization : request.connection.context.Authorization

    if (header) {
        const token = header.replace('Bearer ', '')
        const decoded = jwt.verify(token, 'thisisasecret')
        if(decoded.userStatus==="banned"){
            throw new Error('Bu hesaba girişiniz kısıtlanmıştır!')
        }

        return {userId:decoded.userId,userRole:decoded.userRole}
    }

    if (requireAuth) {
        throw new Error('Giriş yapmak gereklidir!')
    } 
    
    return null
}

const userRoles={
    user:198,
    writer:276,
    editor:390,
    admin:684
}

export { getUserId ,  userRoles}