var nodemailer=require('nodemailer');
var mg = require('nodemailer-mailgun-transport');

var auth = {
  auth: {
      apiKey: 'key-12a81ba9abcc22e4cb128951a58e2911',//your mailgun secret api key
      domain : 'freddy.com'//you mailgun domain name
  }
};

var transporter =nodemailer.createTransport(mg(auth));
var mailOptions ={
  to     : 'susanadelokiki@gmail.com',//---let it empty
  from   : 'sender@server.com', //---fill with email
  subject: 'Password Reset',
  text   : '<p>Welcome to freddy</p>'//---let it empty
};

module.exports={
  mailOptions:mailOptions,
  transporter:transporter
};