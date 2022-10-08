const uuid = require("uuid");
const lodash = require("lodash");
const socket = require("socket.io");

const CLIENT_RTC_EVENT = "CLIENT_RTC_EVENT";
const SERVER_RTC_EVENT = "SERVER_RTC_EVENT";

const CLIENT_USER_EVENT = "CLIENT_USER_EVENT";
const SERVER_USER_EVENT = "SERVER_USER_EVENT";

const CLIENT_USER_EVENT_LOGIN = "CLIENT_USER_EVENT_LOGIN";
const CLIENT_USER_EVENT_LOGOUT = "CLIENT_USER_EVENT_LOGOUT";

const SERVER_USER_EVENT_UPDATE_USERS = "SERVER_USER_EVENT_UPDATE_USERS";

const SERVER_USER_EVENT_SET_USERNAME = "SERVER_USER_EVENT_SET_USERNAME";

class ImServer {
  // ws服务
  io = null;
  // connection
  connectionList = [];

  run(server) {
    // 添加ws服务
    this.io = socket(server, { cors: true });
    // 注册
    this.io.on("connection", (connection) => {
      // 新用户加入
      this.register(connection);
      // 客户端 -> 服务端
      connection.on(CLIENT_USER_EVENT, (msg) =>
        this.CLIENT_USER_EVENT.bind(this)(connection, msg)
      );
      // 客户端A -> 客户端B
      connection.on(CLIENT_RTC_EVENT, (msg) =>
        this.CLIENT_RTC_EVENT.bind(this)(connection, msg)
      );
      // 离开房间
      connection.on("disconnect", () => {
        console.log(11);
        this.CLIENT_USER_EVENT_LOGOUT.bind(this)(connection);
      });
    });
  }
  // 新用户加入
  register(connection) {
    connection.user = {
      uuid: uuid.v4(),
    };
    console.log("新用户:" + connection.user.uuid);
    this.connectionList.push(connection);
    connection.emit(SERVER_USER_EVENT, {
      type: SERVER_USER_EVENT_SET_USERNAME,
      payload: connection.user,
    });
  }
  // 客户端 -> 服务端
  CLIENT_USER_EVENT(connection, msg) {
    const { type, payload } = msg;
    switch (type) {
      // 获取在线列表
      case SERVER_USER_EVENT_UPDATE_USERS: {
        // 广播新在线列表，附属具体进入人员
        this.BROADCAST_UPDATE_USERS({
          category: CLIENT_USER_EVENT_LOGIN,
          uuid: connection.user.uuid,
        });
        break;
      }
    }
  }
  // RTC连接时交换offer和answer：客户端A -> 客户端B
  CLIENT_RTC_EVENT(connection, msg) {
    const { payload, type } = msg;
    const { from, target } = payload;

    // if (
    //   type == SIGNALING_CANDIDATE &&
    //   payload.candidate.candidate.indexOf("typ relay") > -1
    // ) {
    //   return console.log(`中断 candidate：${from} -> ${target} typ relay`);
    // }

    const targetConn = this.connectionList.find((item) => {
      return item.user.uuid === target;
    });
    if (targetConn) {
      targetConn.emit(SERVER_RTC_EVENT, msg);
    }
  }
  // 离开房间
  CLIENT_USER_EVENT_LOGOUT(connection) {
    console.log(`用户离开${connection.user.uuid}`);
    this.connectionList = this.connectionList.filter((item) => {
      return item.user.uuid !== connection.user.uuid;
    });
    // 广播新在线列表，附属具体离开人员
    this.BROADCAST_UPDATE_USERS({
      category: CLIENT_USER_EVENT_LOGOUT,
      uuid: connection.user.uuid,
    });
  }
  // 广播在线列表
  BROADCAST_UPDATE_USERS(extraData) {
    const payload = this.connectionList.map((c) => c.user.uuid);
    this.connectionList.forEach((connection) => {
      connection.emit(SERVER_USER_EVENT, {
        type: SERVER_USER_EVENT_UPDATE_USERS,
        payload: payload,
        extraData,
      });
    });
  }
}
const imServer = new ImServer();
module.exports = imServer;
