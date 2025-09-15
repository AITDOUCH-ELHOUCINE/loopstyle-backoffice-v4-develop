{% extends './layout.server.view.swig' %}

{% block content %}
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Socket Test</title>
</head>

<body>
  <H1>Socket Test</H1>
  <input type="text" id="serverUrl" value="http://localhost:8880">  
  <input type="text" id="token" value="">  
  <button id="userConnectBtn">Connect</button>
  <button id="guestConnectBtn"> Guest Connect </button>


  <!-- CREATION SOCKET -->
  <script src="/socket.io/socket.io.js"></script>
  <script>
    //const socket = io();
  </script>
    <script>
    const userConnectBtn = document.querySelector('#userConnectBtn');
    const guestConnectBtn = document.querySelector('#guestConnectBtn');
    const tokenInput = document.querySelector('#token');
    const serverUrlInput = document.querySelector('#serverUrl');
    
    let socket = null;

    userConnectBtn.addEventListener('click', (e) => {
      const token = "Bearer " + tokenInput.value;
      socket = io.connect(serverUrlInput.value,{
          query: {token}
      });
      registerSocketEvents(socket)
      
    })
    guestConnectBtn.addEventListener('click', (e) => {
      const token = "Bearer " + tokenInput.value;
      socket = io.connect(serverUrlInput.value);
      registerSocketEvents(socket)
    })
      
      function registerSocketEvents(socket){
        // TEST
        socket.on("message-from-server", function(msg) {
            console.log("message from server")
        });
        
        socket.emit('message-to-server', 'Hello World!');
        
      }
      function sendNewLocation(){
        const lon = parseFloat(document.getElementById('lon').value);
        const lat = parseFloat(document.getElementById('lat').value);
        console.log(`Sending location [${lon}, ${lat}]`);
        socket.emit('livreur:new:location',{
          coordinates: [lon, lat]
        });

      }
    </script>
    <p>Socker.io Hello World client started!</p>
    <div>
      <input type="text" placeholder="Lon" id="lon" />
      <input type="text" placeholder="Lat" id="lat" />
      <input type="button" value="Send" id="setLocation" onclick="sendNewLocation()"/>
    </div>

  <!-- FIN CODE SOCKET -->
</body>
</html>
{% endblock %}
