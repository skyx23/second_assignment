// importing mongoose
const mongoose =  require('mongoose');

//designing schema for access token
const Address =  mongoose.Schema({
    user_id : {
        type : String,
        required : true,
    },
    address : {
        type : String
    },
    city : {
        type : String
    },
    state : {
        type : String
    },
    pin_code : {
        type : String
    },
    phone_no : {
        type : String
    }
});



module.exports = mongoose.model('Address',Address);