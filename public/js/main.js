const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');



const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

const socket = io();

// Pridruzivnaje chat-u
socket.emit('joinRoom', { username, room });

// Prikazivanje sobe i username-a
socket.on('roomUsers', ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

// Poruka sa servera
socket.on('message', message => {
  console.log(message);
  outputMessage(message);

  // Scroll
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Unos poruke
chatForm.addEventListener('submit', e => {
  e.preventDefault();

  // Preuzimanje teksta poruke
  let msg = e.target.elements.msg.value;
  
  msg = msg.trim();
  
  if (!msg){
    return false;
  }

  // Prikazivanje poruke
  socket.emit('chatMessage', msg);

  
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
});

// Izlazna poruka za dom
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  const p = document.createElement('p');
  p.classList.add('meta');
  p.innerText = message.username;
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement('p');
  para.classList.add('text');
  para.innerText = message.text;
  div.appendChild(para);
  document.querySelector('.chat-messages').appendChild(div);
}

// Dodavanje sobe u dom
function outputRoomName(room) {
  roomName.innerText = room;
}

// Dodavanje imena u dom
function outputUsers(users) {
  userList.innerHTML = '';
  users.forEach(user=>{
    const li = document.createElement('li');
    li.innerText = user.username;
    userList.appendChild(li);
  });

}


