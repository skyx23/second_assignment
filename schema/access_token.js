// importing mongoose
const mongoose =  require('mongoose');

//designing schema for access token
const Access =  mongoose.Schema({
    user_id : {
        type : String,
        required : true,
    },
    access_token : {
        type : Number,
        required : true
    },
    creation_date : {
        type : Date,
        required : true,
        default : Date.now
    }
});

Access.methods.expired = function() {
    let now = Date.now();
    return ( now - Date.parse(Access.creation_date)) > 3600000
}

module.exports = mongoose.model('Access',Access);