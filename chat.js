var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var xss = require('xss');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var rajoitustaulukko = new Object();
var rajoitustaulukkoip = new Object();
//Ei tarvita var kylmennäip = new Object();

function pyyhirajoitettavaipyksi(ip) {
  rajoitustaulukkoip[ip] -= 1;
}

function luouusirajoitettavaip(ip) {
  if (rajoitustaulukkoip[ip] == null) {
    rajoitustaulukkoip[ip] = 0;
  } else {
    rajoitustaulukkoip[ip] += 1;
  }
  setTimeout(function() {pyyhirajoitettavaipyksi(ip)}, 60000);
}


function pyyhirajoitettava(id) {
  rajoitustaulukko[id] = -1;
}

function luouusirajoitettava(id) {
  rajoitustaulukko[id] = 0;
  setTimeout(function() {pyyhirajoitettava(id)}, 2000);
}

var kayttajienmaara = 0;

io.on('connection', function(socket){
  var ip = socket.handshake.address;
  if (rajoitustaulukkoip[ip] == 3) {
    socket.emit("Olet rajoitettu.");
    socket.disconnect()
  } else {
    luouusirajoitettava(socket.id)
    console.log('Käyttäjä liittyi.');
    kayttajienmaara = kayttajienmaara + 1;
    io.emit('palvelinviesti', '<center>Uusi käyttäjä liittyi joukkoomme. <br> Paikalla on tällä hetkellä: ' + kayttajienmaara + ' käyttäjää</center>');

    socket.on('huoneviesti', (viesti, huone) => {
      console.log(rajoitustaulukko);
      var id = socket.id;
      if (rajoitustaulukko[id] == -1) {
        if (viesti != "") {
          io.emit('huoneviesti', viesti)
          //EI TOIMI TÄLLÄ HETKELLÄ: io.to(huone).emit(viesti);
          luouusirajoitettava(socket.id)
        }
      } else {
        socket.emit('Hillitse viestiesi määrää!')
      }
    });

    socket.on('disconnect', function() {
      console.log('Käyttäjä poistui.');
      luouusirajoitettavaip(socket.handshake.address)
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
  }
});

http.listen(3000, function(){
  console.log('Kuunnellaan *:3000');
});
