const router = require('express').Router();
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
dotenv.config();
const passport = require('passport');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.API_KEY);

const verify = require('../middleware/auth');
const Client = require('../schema/clients');
const Address = require('../schema/address');


//route to regiester new user
router.post('/register', async (req, res) => {
  try {
    const name = await Client.find({ username: req.body.username , email : req.body.email });
    if (name.length != 0) {
      return res.send('username or email already exits');
    }

    if (req.body.password != req.body.confirm_password) {
      return res.send('Password do not match');
    }

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(req.body.password, salt);

    const client = new Client({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      username: req.body.username,
      email: req.body.email,
      password: password,
    });

    const msg = {
      to: req.body.email, // Change to your recipient
      from: process.env.SENDER_EMAIL,
      subject: 'User Registered',
      text: `Your email have been registerd with username ${req.body.user}`,
      html: `<strong>Your email have been registerd with username ${req.body.user}</strong>`,
    }

    await sgMail.send(msg).then(()=> {
      console.log('msg sent')
    });

    const savedClient = await client.save();
    res.send(
      `You have regiseterd with username :  ${client.username} and email : ${client.email} !!!!`
    );
  } catch (err) {
    res.send(err);
  }
});


router.post('/login', async (req, res , next) => {
  try{
  passport.authenticate('local',{
    successRedirect : 'user/login',
    failureRedirect :'user/errlogin'
  })(req,res,next);
}catch(err){
  res.send(err)
}
})

router.get('/user/login', (req,res) => {

  res.header('id',req.user._id).send(`user logged in ` )
})

router.get('/user/errlogin', (req,res) => {
  res.send('could not log-in')
})
// route to get user details
router.get('/get', async (req, res) => {
  try{
  if (req.isAuthenticated) {
    const user = await Client.findOne({_id : req.headers.id})
    res.send(user)
  }else(res.send('please log in'))
}catch(err){
  res.send(err)
}
});

//route to update user
router.patch('/update', async (req, res) => {
  try{
    if(req.isAuthenticated){
      const user = await Client.updateOne(
        {_id : req.headers.id},
        {first_name : req.body.first_name,
        last_name : req.body.last_name});

        const msg = {
          to: await Client.findOne({_id : req.headers.id}).email, // Change to your recipient
          from: process.env.SENDER_EMAIL,
          subject: 'User updated',
          text: `Your details in the database have beem updated`,
          html: `<strong>Your details in the database have beem updated</strong>`,
        }
    
        await sgMail.send(msg).then(()=> {
          console.log('msg sent')
        });

        res.send('user details updated')
    }else(res.send('please log in'));
  }catch(err){
    res.send(err)
  }
})

// route to delete request
router.put('/delete',  async (req, res) => {
  try{
    if (req.isAuthenticated) {
      const user = await Client.deleteOne({_id : req.headers.id})
      res.send('user deleted')
    }else(res.send('please log in'))
  }catch(err){
    res.send(err)
  }
});

// route to get all users
router.get('/list/:page', async (req, res) => {
  try {
    if(req.isAuthenticated){
      const page = parseInt(req.params.page);
    if (page < 0) {
      return res.send('Invalid request');
    }

    const startIndex = (page - 1) * 10;

    const data = await Client.find({}).limit(10).skip(startIndex)

    res.send(data);
    }else{
      res.send('please log in')
    }
  } catch (err) {
    res.status(400).send(err);
  }
});

router.post('/address',  async (req, res) => {
  try {
    if(req.isAuthenticated){
      const user = await Client.findOne({ _id: req.headers.id });

    const address = new Address({
      user_id: user._id,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      pin_code: req.body.pin_code,
      phone_no: req.body.phone_no,
    });

    const data = await address.save();

    const saved = await Client.updateOne(
      { _id: user._id },
      { $push: { address: data._id } }
    );
    res.send('address added');
    }else{
      res.send('please log in')
    }
  } catch (err) {
    res.status(400).send(err);
  }
});

router.get('/get/:id', verify, async (req, res) => {
  try {
    if(req.isAuthenticated){
      const user_id = req.params.id;

    const user = await Client.findOne({ _id: user_id }).populate('address');
    res.send(user);
    }else {
      res.send('please log in')
    }
  } catch (err) {
    res.send(err);
  }
});

router.post('/forgotpassword', async (req, res) => {
  try {
    const user = await Client.findOne({
      username: req.body.username,
      email: req.body.email,
    });
    if (!user) {
      return res.send(`credentials entered are wrong`);
    }
    const msg = {
      to: user.email, // Change to your recipient
      from: process.env.SENDER_EMAIL,
      subject: 'User Requested forgot password',
      text: `Your have requested for forgot password`,
      html: `<strong>Your have requested for forgot password</strong>`,
    }

    await sgMail.send(msg).then(()=> {
      console.log('msg sent')
    });
    const token = jwt.sign({ email: req.body.email }, process.env.SECRET, {
      expiresIn: 60 * 10,
    });
    res
      .header('forgot_token', token)
      .send(`use reset password link and forgot_token to reset password`);
  } catch (err) {
    res.send(err);
  }
});

router.post('/resetpassword', verify, async (req, res) => {
  try {
    if (req.body.password != req.body.confirm_password) {
      return res.send('passwords do not match');
    }

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(req.body.password, salt);

    const user = await Client.updateOne(
      { username: req.client.email },
      { password: password }
    );


    const msg = {
      to: req.client.email, // Change to your recipient
      from: process.env.SENDER_EMAIL,
      subject: 'User password updated',
      text: `Your password has been updated in the database  as entered `,
      html: `<strong>Your password has been updated in the database  as entered </strong>`,
    }

    await sgMail.send(msg).then(()=> {
      console.log('msg sent')
    });


    res.send(`password has been successfully updated`);
  } catch (err) {
    res.send(err);
  }
});

module.exports = router;
