EventBus.on(IO_EVENT, (msg) => {
  const { type, payload } = msg;
  switch (type) {
    case SERVER_USER_EVENT_UPDATE_USERS:
      break;
    case CLIENT_USER_EVENT_LOGIN:
      peerConnManager.create();
      break;
    case CLIENT_USER_EVENT_LOGOUT:
      peerConnManager.remove(payload);
    case SERVER_RTC_EVENT:
      peerConnManager.serverRtcEvent(payload);
      break;
  }
});

EventBus.on(PC_EVENT, (msg) => {
  const { type, payload } = msg;
  switch (type) {
    case PC_EVENT_SEND_DATA:
      peerConnManager.sendToAll(payload);
      break;
    case PC_EVENT_REQUEST_SOURCE:
      peerConnManager.sendToAll(payload);
      break;
    case PC_EVENT_RESPONSE_SOURCE:
      peerConnManager.sendTo(payload, payload.from);
      break;
    case PC_EVENT_ADDTRACK:
      peerConnManager.addTrack(payload);
      break;
  }
});

class PeerConnManager {
  allPcList = [];

  create(remoteUuid) {
    const peerConn = new PeerConn();
    peerConn.createPeerConnection(remoteUuid);
    this.allPcList.push(peerConn);
    return peerConn;
  }

  remove(remoteUuid) {
    const peerConn = this.allPcList.find((pc) => pc.remoteUuid == remoteUuid);
    peerConn?.closePeerConnection?.();
    this.allPcList = this.allPcList.filter((pc) => pc.remoteUuid != remoteUuid);
  }

  serverRtcEvent(msg) {
    const { type, payload } = msg;
    if (!type) return;
    let peerConn = this.allPcList.find((pc) => pc.remoteUuid == payload.from);
    switch (type) {
      case SIGNALING_OFFER:
        // 收到offer指定远端
        peerConn = this.create(payload.from);
        peerConn.handleReceiveOffer(payload);
        break;
      case SIGNALING_ANSWER:
        peerConn.handleReceiveAnswer(payload);
        break;
      case SIGNALING_CANDIDATE:
        peerConn.handleReceiveCandidate(payload);
        break;
    }
  }

  // 群发消息
  sendToAll(data) {
    console.log("发送消息sendToAll", data);
    this.allPcList.forEach((pc) => pc.sendData(JSON.stringify(data)));
  }

  // 发消息
  sendTo(data, remoteUuid) {
    console.log("发送消息sendTo", remoteUuid, data);
    this.allPcList
      .find((pc) => pc.remoteUuid == remoteUuid)
      .sendData(JSON.stringify(data));
  }

  // 加入视频流
  addTrack(data) {
    this.allPcList.forEach((pc) => {
      pc.addTrack(data);
    });
  }
}

class PeerConn {
  pc = null;
  remoteUuid = null;
  sendChannel = null;
  receiveChannel = null;

  isTrack = false;

  iceConfig = {
    iceServers: [
      { url: `stun:175.178.1.249:3478` },
      {
        url: `turn:175.178.1.249:3478`,
        username: "1664897233",
        credential: "qswFktuRYpu6pUzZ81rNDmNigmU=",
      },
    ],
    // sdpSemantics: "plan-b", // 用域名就不用这个参数
  };

  sendData(msgString) {
    this.sendChannel.send(msgString);
  }

  addTrack(data) {
    const { track, mediaStream } = data;
    this.pc.addTrack(track, mediaStream);
  }

  createPeerConnection(remoteUuid) {
    if (remoteUuid) {
      // 收到offer时已有指定远端
      this.remoteUuid = remoteUuid;
    } else {
      // 发起offer时，任意找对象
      this.remoteUuid = allUuidList
        .filter((uuid) => !failUuidList.includes(uuid) && uuid != localUuid)
        .find((uuid) => uuid);
    }

    if (!this.remoteUuid) {
      return console.log(
        "已尝试所有在线用户，没有可p2p连接的通道，等待新用户加入"
      );
    }

    this.pc = new RTCPeerConnection(this.iceConfig);

    this.pc.onnegotiationneeded = this.onnegotiationneeded.bind(this);
    this.pc.onicecandidate = this.onicecandidate.bind(this);
    this.pc.ontrack = this.ontrack.bind(this);

    // p2p聊天、发送文件
    // this.sendChannel = this.pc.createDataChannel("sendChannel", {
    //   ordered: true,
    //   negotiated: true,
    //   id: 0,
    // });
    // this.sendChannel.onmessage = this.onReceiveMessageCallback;
  }

  handleReceiveAnswer(payload) {
    console.log(`receive remote answer from ${payload.from}`);
    const remoteDescription = new RTCSessionDescription(payload.sdp);
    this.pc.setRemoteDescription(remoteDescription); // TODO 错误处理
  }

  closePeerConnection() {
    this.pc?.close?.();
    this.pc = null;
    // 关闭界面video
    EventBus.emit(PC_EVENT, {
      type: PC_EVENT_REMOVE_VIDEOTRACK,
      payload: this.remoteUuid,
    });
  }

  ontrack(evt) {
    console.log("ontrack", evt);
    if (this.isTrack) return;
    this.isTrack = true;
    EventBus.emit(PC_EVENT, {
      type: PC_EVENT_ADD_VIDEOTRACK,
      payload: {
        from: this.remoteUuid,
        stream: evt.streams[0],
      },
    });
  }

  async onnegotiationneeded() {
    const offer = await this.pc.createOffer();
    console.log("发送offer", localUuid, offer);
    await this.pc.setLocalDescription(offer);

    // 发送交换offer
    EventBus.emit(CLIENT_RTC_EVENT, {
      type: SIGNALING_OFFER,
      payload: {
        from: localUuid,
        target: this.remoteUuid,
        sdp: this.pc.localDescription,
      },
    });
  }

  onicecandidate(evt) {
    if (evt.candidate) {
      console.log("onicecandidate", evt.candidate);
      // 不要relay，只保留 host和srflx
      // if (evt.candidate.candidate.indexOf("typ relay") > -1) return;
      // 发送交换candicate
      EventBus.emit(CLIENT_RTC_EVENT, {
        type: SIGNALING_CANDIDATE,
        payload: {
          from: localUuid,
          target: this.remoteUuid,
          candidate: evt.candidate,
        },
      });
    }
  }

  async handleReceiveOffer(payload) {
    // 设置远端描述
    const remoteDescription = new RTCSessionDescription(payload.sdp);
    console.log("收到远端offer", localUuid, payload);
    await this.pc.setRemoteDescription(remoteDescription);

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    // 发送交换answer
    EventBus.emit(CLIENT_RTC_EVENT, {
      type: SIGNALING_ANSWER,
      payload: {
        sdp: answer,
        from: localUuid,
        target: this.remoteUuid,
      },
    });
  }

  async handleReceiveCandidate(payload) {
    console.log(`receive candidate from`, payload);
    await this.pc.addIceCandidate(payload.candidate); // TODO 错误处理
    // if (msg.payload.candidate.candidate.indexOf("typ relay") > -1) {
    //   // relay 表示要通过turn服务器，则host和srflx已经失败，则重试下一个远端
    //   console.log(
    //     `同用户${msg.payload.from}尝试完host和srflx都失败，开始尝试与下个用户p2p连接`
    //   );
    //   closePeerConnection();
    //   failUsernameList.push(msg.payload.from);
    //   createPeerConnection();
    // } else {
    //   // 允许 host srflx 通过
    //   await this.pc.addIceCandidate(msg.payload.candidate); // TODO 错误处理
    // }
  }

  // 远端收到消息
  onReceiveMessageCallback(evt) {
    const data = JSON.parse(evt.data);
    console.log("收到消息", evt.data);
    // 判断是请求资源文件请求
    if (data?.cmd == "request_source") {
      // 去本地sw的cache中查找
      navigator.serviceWorker.controller.postMessage(data);
    }
    // 收到远端回复
    else if (data?.cmd == "response_source") {
      navigator.serviceWorker.controller.postMessage(data);
    }
    // 普通聊天
    else {
      EventBus.emit(PC_EVENT, {
        type: PC_EVENT_RECEIVE_DATA,
        payload: data,
      });
    }
  }
}

const peerConnManager = new PeerConnManager();
