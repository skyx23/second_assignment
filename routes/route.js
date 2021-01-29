const router = require('express').Router();
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
dotenv.config();

const verify = require('../middleware/auth');
const Client = require('../schema/clients');
const Address = require('../schema/address');

//route to regiester new user
router.post('/register', async (req, res) => {
  try {
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
  try {
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

    const token = jwt.sign({ _id: user._id }, process.env.SECRET, {
      expiresIn: 60 * 60,
    });

    res.status(500).header('Token', token).send(`logged-in`);
  } catch (err) {
    res.send(err);
  }
});

// route to get user details
router.get('/get', verify, async (req, res) => {
  try {
    const user = await Client.findOne({ _id: req.client._id });
    res.send(user);
  } catch (err) {
    res.status(400).send(err);
  }
});

// route to delete request
router.put('/delete', verify, async (req, res) => {
  try {
    await Client.deleteOne({ _id: req.client._id });
    res.send('User Deleted');
  } catch (err) {
    res.send(err);
  }
});

// route to get all users
router.get('/list/:page', async (req, res) => {
  try {
    const page = parseInt(req.params.page);
    if (page < 0) {
      return res.send('Invalid request');
    }

    const startIndex = (page - 1) * 10;
    const endIndex = page * 10;

    const data = await Client.find({});

    const result = data.slice(startIndex, endIndex);
    res.send(result);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.post('/address', verify, async (req, res) => {
  try {
    const user = await Client.findOne({ _id: req.client._id });

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
  } catch (err) {
    res.status(400).send(err);
  }
});

router.get('/get/:id', verify, async (req, res) => {
  try {
    const user_id = req.params.id;

    const user = await Client.findOne({ _id: req.client._id }).populate('address');
    res.send(user);
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
    res.send(`password has been successfully updated`);
  } catch (err) {
    res.send(err);
  }
});

module.exports = router;
