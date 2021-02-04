const router = require('express').Router();
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
dotenv.config();
const passport = require('passport');
const sgMail = require('@sendgrid/mail');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

sgMail.setApiKey(process.env.API_KEY);

const verify = require('../middleware/auth');
const Client = require('../schema/clients');
const Address = require('../schema/address');

//route to regiester new user
router.post('/register', async (req, res) => {
  try {
    const name = await Client.find({
      username: req.body.username,
      email: req.body.email,
    });
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
    };

    await sgMail.send(msg).then(() => {
      console.log('msg sent');
    });

    const savedClient = await client.save();
    res.send(
      `You have regiseterd with username :  ${client.username} and email : ${client.email} !!!!`
    );
  } catch (err) {
    res.send(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    passport.authenticate('local', {
      successRedirect: 'user/login',
      failureRedirect: 'user/errlogin',
    })(req, res, next);
  } catch (err) {
    res.send(err);
  }
});

router.get('/user/login', (req, res) => {
  const token = jwt.sign({ _id: req.user._id }, process.env.SECRET, {
    expiresIn: 60 * 60,
  });
  res.header('token', token).send(`user logged in `);
});

router.get('/user/errlogin', (req, res) => {
  res.send('could not log-in');
});
// route to get user details
router.get('/get',verify ,  async (req, res) => {
  try {
    const user = await Client.findOne({ _id: req.client._id });
    res.send(user);
  } catch (err) {
    res.send(err);
  }
});

//route to update user
router.patch('/update',verify, async (req, res) => {
  try {
    const user = await Client.updateOne(
      { _id: req.client._id },
      { first_name: req.body.first_name, last_name: req.body.last_name }
    );

    const msg = {
      to: await Client.findOne({ _id: req.headers.id }).email, // Change to your recipient
      from: process.env.SENDER_EMAIL,
      subject: 'User updated',
      text: `Your details in the database have beem updated`,
      html: `<strong>Your details in the database have beem updated</strong>`,
    };

    await sgMail.send(msg).then(() => {
      console.log('msg sent');
    });

    res.send('user details updated');
  } catch (err) {
    res.send(err);
  }
});

// route to delete request
router.put('/delete', verify,async (req, res) => {
  try {
    const user = await Client.deleteOne({ _id: req.client._id });
      res.send('user deleted');
  } catch (err) {
    res.send(err);
  }
});

// route to get all users
router.get('/list/:page',verify, async (req, res) => {
  try {
    const page = parseInt(req.params.page);
      if (page < 0) {
        return res.send('Invalid request');
      }

      const startIndex = (page - 1) * 10;

      const data = await Client.find({}).limit(10).skip(startIndex);

      res.send(data);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.post('/address',verify, async (req, res) => {
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

    const user = await Client.findOne({ _id: user_id }).populate('address');
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
    const msg = {
      to: user.email, // Change to your recipient
      from: process.env.SENDER_EMAIL,
      subject: 'User Requested forgot password',
      text: `Your have requested for forgot password`,
      html: `<strong>Your have requested for forgot password</strong>`,
    };

    await sgMail.send(msg).then(() => {
      console.log('msg sent');
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

router.post('/resetpassword', async (req, res) => {
  try {
    const token = req.header('forgot-token');
    if(!token){return res.send("forgot token required")}
    if (req.body.password != req.body.confirm_password) {
      return res.send('passwords do not match');
    }
    const verify = jwt.verify(token,process.env.SECRET);
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(req.body.password, salt);

    const user = await Client.updateOne(
      { _id : verify._id},
      { password: password }
    );

    const msg = {
      to: await Client.findById({_id : verify._id}.email), // Change to your recipient
      from: process.env.SENDER_EMAIL,
      subject: 'User password updated',
      text: `Your password has been updated in the database  as entered `,
      html: `<strong>Your password has been updated in the database  as entered </strong>`,
    };

    await sgMail.send(msg).then(() => {
      console.log('msg sent');
    });

    res.send(`password has been successfully updated`);
  } catch (err) {
    res.send(err);
  }
});

router.get('/mobiles', async (req, res) => {
  try {
    const url = process.env.MOBILE_URL;
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    let mobiles = [];
    const data = $('._2kHMtA');
    data.each((i,element)=> {
      let title = $(element).find($('._4rR01T')).text()
      let price = $(element).find($('._30jeq3')).text()
      let specs = [];
      $(element).find($('.rgWa7D')).each((i,element)=>{
        let spec = $(element).text()
        specs.push(spec);
      })
      mobiles.push({
        title : title,
        price : price,
        specs : specs
      })
    })
    res.send(mobiles)
  } catch (error) {
    res.send(err);
  }
});

router.get('/mobiles/info' , async (req, res) =>{
  try {
    const url = process.env.MOBILE_URL;
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1024, height: 1600 },
  });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'load' });
  console.log('page opening');
  await page.waitForSelector('._2kHMtA');

  let data = [];
  const divs = await page.$$('._2kHMtA');
  for (let div of divs) {
    const name = await div.$eval('._4rR01T', (div) => {
      return div.innerHTML;
    });
    const price = await div.$eval('._30jeq3', (div) => {
      return div.innerHTML;
    });
    const lin = await div.$eval('a', (div) => {
      return div.getAttribute('href')
    }) 
    const link = `https://www.flipkart.com${lin}` 
    const newPage = await browser.newPage();
    await newPage.goto(link,{waitUntil : 'load'});

    const description = await newPage.$eval('._1mXcCf ', (div)=> {
      return div.innerHTML;
    })
    await newPage.close();

    data.push({
      name : name,
      price : price,
      link : link,
      description : description
    });
  }
  res.send(data);
  } catch (error) {
    res.send(error)
  }
})

router.get('/tshirts', async (req, res ) => {
  try {
    const url = process.env.TSHIRT_URL
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    let tshirts = [];
    const data = $('._1xHGtK');
    data.each((i,element)=> {
      let company = $(element).find($('._2WkVRV')).text();
      let title = $(element).find($('.IRpwTa')).text()
      let price = $(element).find($('._30jeq3')).text()
      tshirts.push({
        title : title,
        company : company,
        price : price
      })
    })
    res.send(tshirts)
  } catch (error) {
    console.log(error)
    res.send(error);
  }
})

module.exports = router;
