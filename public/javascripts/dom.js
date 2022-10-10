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
