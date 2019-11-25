//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan');
    
Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';


app.get('/', function (req, res) {
  res.render('index.html', { pageCountMessage : null});
});

app.use(function(err, req, res, next){
  res.status(500).send('Something bad happened!');
});

app.listen(port, ip);

app.use("/api/hugo", function(req, res){

  res.send(JSON.stringify({alarm:"ok"}));

});








module.exports = app ;