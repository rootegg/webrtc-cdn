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
