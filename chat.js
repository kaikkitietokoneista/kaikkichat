var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var xss = require('xss');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var kayttajienmaara = 0;

io.on('connection', function(socket){

  console.log('Käyttäjä liittyi.');
  kayttajienmaara = kayttajienmaara + 1;
  io.emit('palvelinviesti', '<center>Uusi käyttäjä liittyi joukkoomme. <br> Paikalla on tällä hetkellä: ' + kayttajienmaara + ' käyttäjää</center>');

  socket.on('huoneviesti', (viesti, huone) => {
    if (viesti != "") { //Viesti sisältää nimen joten poista se
      io.emit('huoneviesti', viesti)
      io.to(huone).emit(viesti);
    }
    //console.log(viesti);
    //console.log(huone);
  });

  socket.on('disconnect', function() {
    console.log('Käyttäjä poistui.');

    //iposoitteet.splice(iposoitteet.indexOf(socket.handshake.address), 1);

    kayttajienmaara = kayttajienmaara - 1;
    io.emit('palvelinviesti', '<center>Käyttäjä poistui palvelimelta. <br> Paikalla on tällä hetkellä: ' + kayttajienmaara + ' käyttäjää</center>');
  })

  socket.join('yleinen', () => {
    io.to('yleinen').emit('<center>Uusi käyttäjä liittyi!</center>');
  })

  socket.on('kirjoittaa', function(kuka) {
    io.emit('kirjoittaa', xss(kuka))
  })

  socket.on('lopetti', function(kuka) {
    io.emit('lopetti', xss(kuka))
  })
});

http.listen(3000, function(){
  console.log('Kuunnellaan *:3000');
});
