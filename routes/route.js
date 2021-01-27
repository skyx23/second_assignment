const router = require('express').Router();

const bcrypt = require('bcrypt');

const Client = require('../schema/clients');
const Access = require('../schema/access_token');

//route to regiester new user
router.post('/register', async (req, res) => {
  const name = await Client.find({ username: req.body.username });
  if (name.length != 0) {
    return res.send('username already exits');
  }

  const email = await Client.find({ email: req.body.email });
  if (email.length != 0) {
    return res.send('email already exits');
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

  try {
    const savedClient = await client.save();
    res.send(
      `You have regiseterd with username :  ${client.username} and email : ${client.email} !!!!`
    );
  } catch (err) {
    res.send(err);
  }
});

// route to login user
router.post('/login', async (req, res) => {
  // to check whether username exists
  const user = await Client.findOne({ username: req.body.username });
  if (!user) {
    return res.send('Username entered is invalid');
  }

  // to check for correct password
  const password = await bcrypt.compare(req.body.password, user.password);
  if (!password) {
    return res.send('password entered for the username is incorrect');
  }

  await Access.deleteMany();
  const token = Math.floor(Math.random() * 10 ** 16);

  const access = new Access({
    access_token: token,
    user_id: user._id,
  });

  try {
    const savedAccess = await access.save();
    console.log(savedAccess);
    res.status(500).header('Token', token).send(`logged-in`);
  } catch (err) {
    res.send(err);
  }
});

// route to get user details
router.get('/get', async (req, res) => {
  const token = req.headers.token;
  if (!token) {
    return res.send(
      'Login required : Please login before accessing protected routes'
    );
  }

  try {
    const valid = await Access.findOne({ access_token: token }, function(err,user){
        if(user.expired()){
            return res.send("login expired")
        }
    })
    if (!valid) {
      return res.send('Login error : please login again');
    }
    const user = await Client.findOne({ _id: valid.user_id });
    res.send(user);
  } catch (err) {
      console.log(err)
    return res.status(400).send('Invalid login');
  }
});

// route to delete request
router.put('/delete', async (req, res) => {
  try {
    const token = req.headers.token;
    if (!token) {
      return res.send(
        'Login required : Please login before accessing protected routes'
      );
    }

    const valid = await await Access.findOne({ access_token: token }, function(err,user){
        if(user.expired()){
            return res.send("login expired")
        }
    })
    const user = await Client.findOne({ _id: valid.user_id });
    const deleted = await Client.deleteOne({ username: user.username });

    if (deleted.deleteCount == 1) {
      return res.send('User Deleted Successfully.');
    }
  } catch (err) {
    res.send('deletion Error');
  }
});

// route to get all users
router.get('/list/:page', async (req, res) => {
  const page = parseInt(req.params.page);
  if (page < 0) {
    return res.send('Invalid request');
  }

  const entries = (page + 1) * 10;

  const data = await Client.find({});

  if (data.length < entries - 10) {
    return res.send(data);
  } else if (entries - 10 < data.length < entries) {
    return res.send(data.slice(entries - 10, data.length));
  } else {
    return res.send(data.slice((entries - 10, entries)));
  }
});

router.post('/address' , async (req,res) =>{
    res.send('address added')
})

module.exports = router;
