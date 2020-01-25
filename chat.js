var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var xss = require('xss');
var crypto = require('crypto');

/*SIIRRÄ HASHIEN TARKASTUS JA KAKKI MUUKIN FUNCTIONEIKSI */

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var kayttajienmaara = 0;
var suojaushashit = []

io.on('connection', function(socket){
  const crypto = require('crypto')

  let generoitustringi = Math.random().toString(36).substring(7);
  let hash = crypto.createHash('md5').update(generoitustringi).digest("hex")
  suojaushashit.push({id: socket.id, hash: hash})
  console.log(suojaushashit);

  socket.emit('hashi', hash);

  console.log('Käyttäjä liittyi.');
  kayttajienmaara = kayttajienmaara + 1;
  io.emit('palvelinviesti', '<center>Uusi käyttäjä liittyi joukkoomme. <br> Paikalla on tällä hetkellä: ' + kayttajienmaara + ' käyttäjää</center>');

  socket.on('huoneviesti', (viesti, huone, hash) => {
    suojaushashit.forEach(function(json) {
      if (json.hash == hash && json.id == socket.id) { //Tarkastetaan, että hash löytyy
        if (viesti != "") { //Viesti sisältää nimen joten poista se
          io.emit('huoneviesti', viesti)
          //EI TOIMI TÄLLÄ HETKELLÄ: io.to(huone).emit(viesti);
        }
        //console.log(viesti);
        //console.log(huone);
      }
    })
  });

  socket.on('disconnect', function() {
    console.log('Käyttäjä poistui.');

    //Ei välttämättä tarvita edes, koska socket.id vaihtuu aina
    suojaushashit.forEach(function(json) {
      if (json.id == socket.id) {
        suojaushashit.splice(suojaushashit.indexOf(json.id), 1);
        console.log(suojaushashit);
      }
    })

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
