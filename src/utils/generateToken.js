import jwt from 'jsonwebtoken'

const generateToken = (userId,userRole,userStatus) => {
    return jwt.sign({ userId,userRole,userStatus}, 'thisisasecret')
}

export { generateToken as default }