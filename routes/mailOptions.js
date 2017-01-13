var nodemailer=require('nodemailer');
var mg = require('nodemailer-mailgun-transport');

var auth = {
  auth: {
      api_key: '',//your mailgun secret api key
      domain : ''//you mailgun domain name
  }
};

var transporter =nodemailer.createTransport(mg(auth));
var mailOptions ={
  to     : '',//---let it empty
  from   : '', //---fill with email
  subject: 'Password Reset',
  text   : ''//---let it empty
};

module.exports={
  mailOptions:mailOptions,
  transporter:transporter
};