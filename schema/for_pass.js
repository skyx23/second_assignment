const mongoose = require('mongoose');

const Forgot = mongoose.Schema({
    username : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true
    },
    forgot_token : {
        type : String,
        required : true
    },
    creation_date : {
        type : Date,
        required : true,
        default : Date.now
    }
})

Forgot.methods.expired = () => {
    let now = Date.now();
    return (now - Date.parse(Forgot.creation_date)) > 3600000
}

module.exports = mongoose.model('Forgot',Forgot);