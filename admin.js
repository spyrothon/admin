const OBS = new OBSWebSocket();
let connection = null;

function create_audio_control(name, value) {
  var source_element = document.createElement("div");
  source_element.classList.add("source");
  var label = document.createElement("label");
  label.setAttribute("for", name);
  label.innerText = name;

  var input = document.createElement("input");
  input.type = "range";
  input.dataset.name = name;
  input.name = name;
  input.setAttribute("list", "tickmarks");
  input.setAttribute("min", "0");
  input.setAttribute("max", "1");
  input.setAttribute("step", "0.01");
  input.value = value;

  source_element.appendChild(label);
  source_element.appendChild(input);
  return source_element;
}

function update_audio_sources(name, sources) {
  let container = document.querySelector(".audio-control .sources");
  while(container.hasChildNodes()) container.removeChild(container.lastChild);

  sources.forEach(function(source) {
    if(source.type != "vlc_source") return;

    var source_element = create_audio_control(source.name, source.volume);
    container.appendChild(source_element);
  });
};

document.addEventListener('change', function(event) {
  var target = event.target;
  console.log("changed")
  if(target.tagName != "input" && target.type != "range") return;
  console.log("right tag")

  OBS.setVolume({ "source": target.dataset.name, "volume": parseFloat(target.value) });
}, false);


document.querySelector(".obs-connect").addEventListener('click', function(event) {
  let address = document.querySelector(".obs-address").value;
  let password = document.querySelector(".obs-password").value;
  connection = OBS.connect({ address: address, password: password });

  connection.then(function() {
    var scene_container = document.querySelector(".available-scenes");
    while(scene_container.hasChildNodes()) {
      scene_container.removeChild(scene_container.lastChild);
    }

    OBS.getSceneList({}).then(function(response) {
      response.scenes.forEach(function(scene) {
        var element = document.createElement("div");
        element.classList.add("scene");
        element.innerText = scene.name;
        document.querySelector(".available-scenes").appendChild(element);
        if(scene.name == response.currentScene) {
          element.classList.add("current-scene");
        }
      });

    });

    OBS.getCurrentScene({}).then(function(response) {
      update_audio_sources(response.name, response.sources);
    });
  });
});

OBS.onSwitchScenes(function(data) {
  document.querySelector('.current-scene').innerText = data.sceneName;
  document.querySelector('.available-scenes .current-scene').classList.remove('current-scene');
  [].forEach.call(document.querySelectorAll('.available-scenes .scene'), function(element) {
    if(element.innerText == data.sceneName) {
      element.classList.add("current-scene");
    }
  });

  OBS.getCurrentScene({}).then(function(response) {
    update_audio_sources(response.name, response.sources);
  });
});



document.addEventListener('click', function(event) {
  var target = event.target;
  if(!target.classList.contains("scene")) return;

  OBS.setCurrentScene({ "scene-name": target.innerText });
}, false);

let base_uri = ((window.location.protocol === "https:") ? "wss://" : "ws://") + window.location.host;
let timer_socket = new WebSocket(base_uri + "/timer-control");

timer_socket.onmessage = function(event) {
  var msg = JSON.parse(event.data);

  switch(msg.type) {
    case "timer_start":

      break;
  }
};

function start_timer() {
  timer_socket.send('{"action": "start" }');
  document.querySelector(".timer-time").classList.add("updated-timer");
}

document.querySelector("#start_timer").addEventListener('click', this.start_timer.bind(this));

function stop_timer() {
  timer_socket.send('{"action": "stop" }');
  document.querySelector(".timer-time").classList.remove("updated-timer");
}

document.querySelector("#stop_timer").addEventListener('click', this.stop_timer.bind(this));

function reset_timer() {
  timer_socket.send('{"action": "reset" }');
  document.querySelector(".timer-time").classList.remove("updated-timer");
  document.querySelector(".timer-time").innerText = '00:00:00';
}

document.querySelector("#reset_timer").addEventListener('click', this.reset_timer.bind(this));

function increment_timers() {
  [].forEach.call(document.querySelectorAll(".updated-timer"), function(timer) {
    if(timer.dataset.started_at) {
      let now = moment().unix();
      let start_time = parseInt(timer.dataset.started_at);
      timer.innerText = moment.duration(now - start_time, 's').format("hh:mm:ss", { trim: false });
    } else {
      let previous_time = moment.duration(timer.innerText);
      timer.innerText = previous_time.add(1, 's').format("hh:mm:ss", { trim: false });
    }
  });
}

setInterval(increment_timers, 1000);
