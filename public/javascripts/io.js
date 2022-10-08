const socket = io.connect(location.origin);

socket.on("connect", function () {
  console.log("ws connect.");
});

socket.on("connect_error", function () {
  console.log("ws connect_error.");
});

socket.on("error", function (errorMessage) {
  console.log("ws error, " + errorMessage);
});

// 监听到房间信息变化
socket.on(SERVER_USER_EVENT, function (msg) {
  const { type, payload, extraData } = msg;

  switch (type) {
    // 获得自己唯一编号
    case SERVER_USER_EVENT_SET_USERNAME:
      localUuid = payload.uuid;
      // 申请获得在线用户列表
      socket.emit(CLIENT_USER_EVENT, {
        type: SERVER_USER_EVENT_UPDATE_USERS,
      });
      break;
    // 获取到在线用户有更新
    case SERVER_USER_EVENT_UPDATE_USERS:
      allUuidList = payload;
      // 让其他拿到用户列表
      EventBus.emit(IO_EVENT, {
        type: SERVER_USER_EVENT_UPDATE_USERS,
      });
      if (
        extraData?.category == CLIENT_USER_EVENT_LOGIN &&
        localUuid == extraData.uuid
      ) {
        // 抛出事件，让RTCPeerConnection去连别人
        EventBus.emit(IO_EVENT, {
          type: CLIENT_USER_EVENT_LOGIN,
          payload: extraData.uuid,
        });
      } else if (extraData?.category == CLIENT_USER_EVENT_LOGOUT) {
        // 抛出事件，让RTCPeerConnection判断断开pc别人
        EventBus.emit(IO_EVENT, {
          type: CLIENT_USER_EVENT_LOGOUT,
          payload: extraData.uuid,
        });
      }
      break;
  }
});

// 监听到RTC信息交换
socket.on(SERVER_RTC_EVENT, function (msg) {
  // 让其他拿到RTC交换信息
  EventBus.emit(IO_EVENT, {
    type: SERVER_RTC_EVENT,
    payload: msg,
  });
});

// 监听交换offer
EventBus.on(CLIENT_RTC_EVENT, (msg) => {
  socket.emit(CLIENT_RTC_EVENT, msg);
});
