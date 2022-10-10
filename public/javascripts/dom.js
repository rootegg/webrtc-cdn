EventBus.on(IO_EVENT, (msg) => {
  const { type, payload } = msg;
  switch (type) {
    case SERVER_USER_EVENT_UPDATE_USERS:
      console.log("用户列表:", allUuidList);
      break;
    case CLIENT_USER_EVENT_LOGIN:
      break;
    case SERVER_RTC_EVENT:
      break;
  }
});

EventBus.on(PC_EVENT, (msg) => {
  const { type, payload } = msg;
  switch (type) {
    case PC_EVENT_RECEIVE_DATA:
      console.log(payload);
      document.getElementById("console").innerHTML =
        document.getElementById("console").innerHTML + payload + "<br/>";
      break;
    case PC_EVENT_ADD_VIDEOTRACK:
      let remoteVideoDom = document.getElementById(payload.from);
      if (remoteVideoDom) return;
      // 新建远程video标签
      remoteVideoDom = document.createElement("video");
      remoteVideoDom.setAttribute("id", payload.from);
      remoteVideoDom.setAttribute("autoplay", true);
      remoteVideoDom.setAttribute("controls", "controls");
      // remoteVideoDom.setAttribute("muted", "muted");
      // remoteVideoDom.setAttribute("playsinline", "playsinline");
      document.getElementById("remote-videos").appendChild(remoteVideoDom);
      remoteVideoDom.srcObject = payload.stream;
      break;
    case PC_EVENT_REMOVE_VIDEOTRACK:
      const videoDom = document.getElementById(payload);
      videoDom && videoDom.parentNode.removeChild(videoDom);
      break;
  }
});

document.getElementById("send").addEventListener("click", function () {
  EventBus.emit(PC_EVENT, {
    type: PC_EVENT_SEND_DATA,
    payload: document.getElementById("input").value,
  });
});

document.getElementById("request").addEventListener("click", function () {
  document.getElementById("img").setAttribute("src", "");
  document
    .getElementById("img")
    .setAttribute("src", document.getElementById("input-img").value);
});

document
  .getElementById("playvideo")
  .addEventListener("click", async function () {
    const localVideo = document.getElementById("local-video");
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localVideo.srcObject = mediaStream;
    mediaStream.getTracks().forEach((track) => {
      // pc.addTrack(track, mediaStream);
      EventBus.emit(PC_EVENT, {
        type: PC_EVENT_ADDTRACK,
        payload: { track, mediaStream },
      });
    });
  });

function onSendP2PRequestSource(data) {
  EventBus.emit(PC_EVENT, {
    type: PC_EVENT_REQUEST_SOURCE,
    payload: { ...data, from: localUuid },
  });
  console.log(`发起远端请求：${JSON.stringify(data)}`);
}

function onSendP2PResponseSource(data) {
  EventBus.emit(PC_EVENT, {
    type: PC_EVENT_RESPONSE_SOURCE,
    payload: data,
  });
  console.log(`发送给远端的回复：${JSON.stringify(data)}`);
}
