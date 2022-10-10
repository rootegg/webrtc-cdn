var CLIENT_RTC_EVENT = "CLIENT_RTC_EVENT";
var SERVER_RTC_EVENT = "SERVER_RTC_EVENT";

var CLIENT_USER_EVENT = "CLIENT_USER_EVENT";
var SERVER_USER_EVENT = "SERVER_USER_EVENT";

var CLIENT_USER_EVENT_LOGIN = "CLIENT_USER_EVENT_LOGIN";
var CLIENT_USER_EVENT_LOGOUT = "CLIENT_USER_EVENT_LOGOUT";

var SERVER_USER_EVENT_UPDATE_USERS = "SERVER_USER_EVENT_UPDATE_USERS";

var SERVER_USER_EVENT_SET_USERNAME = "SERVER_USER_EVENT_SET_USERNAME";

var SIGNALING_OFFER = "SIGNALING_OFFER";
var SIGNALING_ANSWER = "SIGNALING_ANSWER";
var SIGNALING_CANDIDATE = "SIGNALING_CANDIDATE";

var IO_EVENT = "IO_EVENT";
var PC_EVENT = "PC_EVENT";

var PC_EVENT_SEND_DATA = "PC_EVENT_SEND_DATA";
var PC_EVENT_RECEIVE_DATA = "PC_EVENT_RECEIVE_DATA";
var PC_EVENT_REQUEST_SOURCE = "PC_EVENT_REQUEST_SOURCE";
var PC_EVENT_RESPONSE_SOURCE = "PC_EVENT_RESPONSE_SOURCE";

var localUuid = null;
var allUuidList = [];
var failUuidList = [];

var EventBus = {};
EventBus._obj = Object.create(null);
EventBus.on = function (name, fn) {
  if (!Array.isArray(EventBus._obj[name])) {
    EventBus._obj[name] = [];
  }
  EventBus._obj[name].push(fn);
};
EventBus.emit = function (name, payload) {
  if (!Array.isArray(EventBus._obj[name])) {
    EventBus._obj[name] = [];
  }
  EventBus._obj[name].forEach((fn) => {
    try {
      fn(payload);
    } catch (e) {
      console.log(e);
    }
  });
};
