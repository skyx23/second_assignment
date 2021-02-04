const jwt = require('jsonwebtoken');
const dotenv = require('dotenv')

dotenv.config();

function auth (req, res, next) {
    const token = req.header('token') 
    if (!token) return res.send('access denied - need to login');

    try{
        if(req.isAuthenticated){
        const verify = jwt.verify(token,process.env.SECRET);
        req.client = verify 
        next();
        }else(
            res.send('please log in again.')
        )
    }catch(err){
        res.status(400).send('Invalid token')
    }
}

module.exports = auth ;