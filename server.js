const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Postavljanje direktorijuma
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'NiChat Bot';

// Niz za čuvanje svih userName korisnika
const allUsers = [];



io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {

    // Lokalni indeks za identifikaciju username-a
    var localIndex = 0;

    // Prolaz kroz niz sa sačuvanim korisnicima
    for(u of allUsers)
    {

        // U slučaju kad se pogodi isti username u isti room
        if(username == u.ime && room == u.soba)
        {
            
            console.log('Došlo je do podudaranja imena u istoj sobi!')
            

            // Promena idexa za identifikaciju username-a (za jedan više od prethodnog)
            localIndex = u.index + 1 ; 
        }
    }

    // Unos korisnika u nizu sa sačuvanim korisnicima
    newUser = {
      index : localIndex,
      ime : username,
      soba : room
      
    }
    allUsers.push(newUser);
    

    // Pridruzi korisnika
    var user;

    // Ako je indentifikacioni index 0 - unosimo username bez indexa
    if(localIndex == 0)
    {
      user = userJoin(socket.id, username, room);
    }

    // U suprotnom pored imena dodajemo idenfikicaion
    else
    {
      user = userJoin(socket.id, username + localIndex, room);

      // Obavestenje korisniku da je dobio novo ime
      socket.emit('message', formatMessage(botName, `Uneto korisničko ime "${username}" je zauzeto, dodeljeno Vam je sledeće ime: "${username + localIndex}" `));

    }
    
    


    socket.join(user.room);

    // Poruka korisniku koji se prvi put prijavio
    socket.emit('message', formatMessage(botName, 'Dobrodosli u NiChat!'));


    // Emituje se kada se korisnik poveze
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} se pridruzio cetu`)
      );

    
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Diskonektovanje korisnika
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} je napustio cet`)
      );

      
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});




const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
