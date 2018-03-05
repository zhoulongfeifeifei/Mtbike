var utils = require('../../utils/util');
var encStr;
//获取应用实例
var app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    scale: 15,
    latitude: 0,
    longitude: 0,
    time:'0分',
    bikeno: '0000000000',
    yuan:'0元',
    yue:'0元',
    setIn:0,
    typeS:0,
    location:0,
    disabled:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setStorageSync('bianliang', 0)
    // console.log(1111)
    var session = wx.getStorageSync("session")
    var uuid = wx.getStorageSync("uuid")
    var typeSt=options.type//判断锁的类型
    // var type=3
    //获取当前位置
    var that=this
    that.setData({
      typeS:typeSt
    })
    wx.getLocation({
      type: "gcj02",
      success: function(res) {
        // console.log(12)
        that.setData({
          longitude: res.longitude,
          latitude: res.latitude
        })
        var location = that.data.longitude + "," + that.data.latitude;
        that.setData({
          location:location
        })
        wx.setStorageSync('location', location)
        //获取行程相关信息以及判断是什么类型的锁
        wx.request({
          url: 'https://tt.dd-bike.cn/wx/wxlasttrip1',
          data: {
            location: location
          },
          header: {
            "Content-Type": "application/json",
            'dd_uuid': uuid,
            'dd_session': session
          },
          success:function(res){
            var statu = res.data.success
            if(statu==0){
              if(res.data.data.bl_lock_type==1){
                that.setData({
                  typeS: 1
                })
                typeSt = res.data.data.bl_lock_type
              }else{
                that.setData({
                  typeS: 0
                })
                typeSt=res.data.data.bl_lock_type
              }
              ks(typeSt)//骑行中
            }
          },
          fail: function (res) {
            wx.showModal({
              showCancel:false,
              title: '温馨提示',
              content: '最近一次开锁失败',
            })
          }
        })
        function ks(typeSt){
          if (typeSt == 1) {//纯蓝牙锁
            that.qixing()
            // //定时
            setTimeout(function(){
              var setInt= setInterval(that.qixing, 60000)
              that.setData({
                setIn: setInt
              })
            },3000)
          }else{//三合一锁
            var shy= setInterval((function (res) {
              // console.log(222)
              wx.request({
                url: 'https://tt.dd-bike.cn/wx/wxlasttrip1',
                data: {
                  location: location
                },
                header: {
                  "Content-Type": "application/json",
                  'dd_uuid': uuid,
                  'dd_session': session
                },
                success: function (res) {
                  var statu = res.data.success
                  if (statu == 0) {
                    that.setData({
                      time: res.data.data.duration,
                      bikeno: res.data.data.bikeno,
                      yuan: res.data.data.cost,
                      yue: res.data.data.yue
                    })
                    if (res.data.data.tl_return_time != "") {
                      clearInterval(shy)
                      wx.showLoading({
                        title: '关锁成功',
                        icon:'success',
                        success:function(){
                          wx.removeStorageSync('bikeuuid')
                          wx.removeStorageSync('location')
                          var ye = res.data.data.yue-parseInt(res.data.data.cost)
                          setTimeout(function () {
                            wx.redirectTo({
                              url: '../lookPayment/lookPayment?bikehao=' + res.data.data.bikeno + '&money=' + res.data.data.cost + '&time=' + res.data.data.duration + '&yue=' + res.data.data.yue + '',
                            })
                          }, 1000)
                        }
                      })
                    }
                  }
                },
                fail: function (res) {
                  wx.showModal({
                    showCancel: false,
                    title: '温馨提示',
                    content: '最近一次开锁失败',
                  })
                }
              })
            }), 3000)
          }
        }
      },
    })
  },
  endClc:function(res){
    this.setData({
      disabled:true
    })
    wx.vibrateLong()
    wx.showLoading({
      title: '正在关锁',
    })
    wx.closeBLEConnection({
      deviceId: wx.getStorageSync('deviceId'),
      success:function(res){
      }
    })
    var session = wx.getStorageSync("session")
    var uuid = wx.getStorageSync("uuid")
    var that=this
    var location=that.data.location

    wx.getBluetoothAdapterState({
      success: function(res) {
        if (!res.available) {
          wx.showToast({
            title: '请先打开蓝牙允许“微信小程序”访问“蓝牙”',
            duration: 1000
          })
        }else{
          setTimeout(function(){
            wx.getConnectedBluetoothDevices({
              success: function (res) {
                if (res.devices.length == 0) {
                  wx.createBLEConnection({
                    deviceId: wx.getStorageSync('deviceId'),
                    success: function (res) {
                      wx.getBLEDeviceServices({//获取服务
                        deviceId: wx.getStorageSync('deviceId'),
                        success: function (res) {
                          wx.stopBluetoothDevicesDiscovery();
                          wx.setStorageSync("serviceId", res.services[0].uuid);
                          wx.getBLEDeviceCharacteristics({
                            deviceId: wx.getStorageSync('deviceId'),
                            serviceId: wx.getStorageSync("serviceId"),
                            success: function (res) {
                              wx.setStorageSync("readDataUUID", res.characteristics[1].uuid);
                              wx.setStorageSync("writeDataUUID", res.characteristics[0].uuid);
                              var buff = new ArrayBuffer(16)
                              var dataView = new DataView(buff)
                              wx.request({
                                url: 'https://tt.dd-bike.cn/wx/getToken',
                                success:function(res){
                                  var str = res.data.getWxToken
                                  var arr = str.split(',')
                                  var val;
                                  for (var i = 0; i < arr.length; i++) {
                                    val = parseInt(arr[i], 16)
                                    dataView.setInt8(i, val);
                                  }

                              wx.writeBLECharacteristicValue({
                                deviceId: wx.getStorageSync("deviceId"),
                                serviceId: wx.getStorageSync("serviceId"),
                                characteristicId: wx.getStorageSync("writeDataUUID"),
                                value: buff,
                                success: function (res) {
                                  wx.notifyBLECharacteristicValueChange({
                                    deviceId: wx.getStorageSync("deviceId"),
                                    serviceId: wx.getStorageSync("serviceId"),
                                    characteristicId: wx.getStorageSync("readDataUUID"),
                                    state:true,
                                    success:function(res){
                                    },
                                    fail:function(res){
                                    }
                                  })
                                  wx.onBLECharacteristicValueChange(monitor)
                                  setTimeout(function () {
                                    wx.readBLECharacteristicValue({
                                      deviceId: wx.getStorageSync("deviceId"),
                                      serviceId: wx.getStorageSync("serviceId"),
                                      characteristicId: wx.getStorageSync("readDataUUID"),
                                      success: function (res) {
                                         
                                      },
                                      fail: function (res) {
                                      }
                                    })
                                  }, 1000)
                                },
                                fail: function (res) {
                                }
                              })
                                }
                              })
                            },
                            fail: function (res) {
                            }
                          })
                        },
                        fail: function (res) {
                        }
                      })
                    },
                  })
                } else {
                  wx.getBLEDeviceServices({//获取服务
                    deviceId: wx.getStorageSync('deviceId'),
                    success: function (res) {
                      wx.stopBluetoothDevicesDiscovery();
                      wx.setStorageSync("serviceId", res.services[0].uuid);
                      wx.getBLEDeviceCharacteristics({
                        deviceId: wx.getStorageSync('deviceId'),
                        serviceId: wx.getStorageSync("serviceId"),
                        success: function (res) {
                          wx.setStorageSync("readDataUUID", res.characteristics[1].uuid);
                          wx.setStorageSync("writeDataUUID", res.characteristics[0].uuid);
                          var buff = new ArrayBuffer(16)
                          var dataView = new DataView(buff)
                          wx.request({
                            url: 'https://tt.dd-bike.cn/wx/getToken',
                            success: function (res) {
                              var str = res.data.getWxToken
                              var arr = str.split(',')
                              var val;
                              for (var i = 0; i < arr.length; i++) {
                                val = parseInt(arr[i], 16)
                                dataView.setInt8(i, val);
                              }

                              wx.writeBLECharacteristicValue({
                                deviceId: wx.getStorageSync("deviceId"),
                                serviceId: wx.getStorageSync("serviceId"),
                                characteristicId: wx.getStorageSync("writeDataUUID"),
                                value: buff,
                                success: function (res) {
                                  wx.notifyBLECharacteristicValueChange({
                                    deviceId: wx.getStorageSync("deviceId"),
                                    serviceId: wx.getStorageSync("serviceId"),
                                    characteristicId: wx.getStorageSync("readDataUUID"),
                                    state: true,
                                    success: function (res) {
                                    },
                                    fail: function (res) {

                                    }
                                  })
                                  wx.onBLECharacteristicValueChange(monitor)
                                  setTimeout(function () {
                                    wx.readBLECharacteristicValue({
                                      deviceId: wx.getStorageSync("deviceId"),
                                      serviceId: wx.getStorageSync("serviceId"),
                                      characteristicId: wx.getStorageSync("readDataUUID"),
                                      success: function (res) {

                                      },
                                      fail: function (res) {

                                      }
                                    })
                                  }, 1000)
                                },
                                fail: function (res) {
                                }
                              })
                            }
                          })
                        },
                        fail: function (res) {

                        }
                      })
                    },
                    fail: function (res) {

                    }
                  })
                }
              }
            })
          }, 1000)
        }
      },
    })
    var monitor = function (res) {
      var buff1 = res.value
      let hex = Array.prototype.map.call(new Uint8Array(buff1), x => ('00' + x.toString(16)).slice(-2)).join('');
      var session = wx.getStorageSync("session")
      var uuid = wx.getStorageSync("uuid")
      const blueArrayBuffer = new Uint8Array(res.value);
      const base64Str = wx.arrayBufferToBase64(blueArrayBuffer);
      wx.request({
        url: 'https://tt.dd-bike.cn/wx/syntony',//解析蓝牙返回的数据  
        data: {
          cipherText: hex
        },
        method: 'get',
        header: {
          'content-type': 'application/json',
          'dd_uuid': uuid,
          'dd_session': session
        },
        success: function (res) {
          var statu = res.data.success
          if (statu == 0) {
            wx.setStorageSync('token', res.data.token)
            var token = wx.getStorageSync('token')
            var token1 = token.join(',')
            wx.request({
              url: 'https://tt.dd-bike.cn/wx/checkStatus',//查询锁状态
              data: {
                token: token1
              },
              method: 'get',
              header: {
                'content-type': 'application/json',
                'dd_uuid': uuid,
                'dd_session': session
              },
              success: function (res) {

                var wxcheckStatus = res.data.wxcheckStatus
                var buff = new ArrayBuffer(16)
                var dataView = new DataView(buff)
                var arr = wxcheckStatus.split(',')
                var val;
                for (var i = 0; i < arr.length; i++) {
                  val = parseInt(arr[i], 16)
                  dataView.setInt8(i, val);
                }
                wx.writeBLECharacteristicValue({
                  deviceId: wx.getStorageSync("deviceId"),
                  serviceId: wx.getStorageSync("serviceId"),
                  characteristicId: wx.getStorageSync("writeDataUUID"),
                  value: buff,
                  success: function (res) {
                    setTimeout(function () {
                      wx.readBLECharacteristicValue({
                        deviceId: wx.getStorageSync("deviceId"),
                        serviceId: wx.getStorageSync("serviceId"),
                        characteristicId: wx.getStorageSync("readDataUUID"),
                        success: function (res) {
                          wx.setStorageSync('bianliang', 1)
                          wx.onBLECharacteristicValueChange(monitor)
                        },
                        fail: function (res) {
                        }
                      })
                    }, 2000)
                  },
                  fail: function (res) {
                  }
                })
              }
            })
          } else if (statu == 3 || statu == 4) {
            wx.request({
              url: 'https://tt.dd-bike.cn/wx/wxlock',
              data: {
                capacity: null,
                location: wx.getStorageSync('location')
              },
              method: 'get',
              header: {
                'content-type': 'application/json',
                'dd_uuid': uuid,
                'dd_session': session
              },
              success: function (res) {
                var statu = res.data.success
                if (statu == 0) {
                  wx.showToast({
                    title: '关锁成功',
                    icon: 'success',
                    success: function (res) {
                      // console.log(res)
                      wx.closeBLEConnection({
                        deviceId: wx.getStorageSync('deviceId'),
                        success: function (res) {
                          wx.removeStorageSync('deviceId')
                          wx.removeStorageSync('umac')
                          wx.closeBluetoothAdapter({
                            success: function (res) {
                            },
                            fail: function (res) {
                            }
                          })
                          //根据租车校验获取余额和扣费情况
                          wx.request({
                            url: 'https://tt.dd-bike.cn/wx/wxrentcheck',
                            method: 'get',
                            header: {
                              "Content-Type": "application/json",
                              'dd_uuid': wx.getStorageSync("uuid"),
                              'dd_session': wx.getStorageSync("session")
                            },
                            success: function (res) {
                              var yue = (res.data.data.ul_balance_total / 100).toFixed(2)
                              wx.request({
                                url: 'https://tt.dd-bike.cn/wx/wxlasttrip1',
                                method: 'get',
                                data: { location: wx.getStorageSync('location') },
                                header: {
                                  "Content-Type": "application/json",
                                  'dd_uuid': uuid,
                                  'dd_session': session
                                },
                                success: function (res) {
                                  wx.closeBluetoothAdapter({
                                    success: function (res) {
                                      // console.log(res,'11111111111')
                                      wx.removeStorageSync('deviceId')
                                    }
                                  })
                                  if (res.data.data.tl_return_time != "") {
                                    var money = res.data.data.cost
                                  } else {
                                    var money = wx.getStorageSync('yuan')
                                  }
                                  var bianhao1 = wx.getStorageSync('bikeno')
                                  var time = wx.getStorageSync('time')//time
                                  wx.redirectTo({
                                    url: '../lookPayment/lookPayment?bikehao=' + bianhao1 + '&money=' + money + '&yue=' + yue + '&time=' + time + '',
                                  })
                                }
                              })
                            }
                          })
                          // var money = wx.getStorageSync('yuan')
                          // var bianhao1 = wx.getStorageSync('bikeno')
                          // var time = wx.getStorageSync('time')
                          // var yue = wx.getStorageSync('yue')
                          // var ye=yue-parseInt(money)
                          // wx.redirectTo({
                          //   url: '../lookPayment/lookPayment?bikehao=' + bianhao1 + '&money=' + money + '&yue=' + yue + '&time=' + time + '',
                          // })
                        },
                        fail: function (res) {
                        }
                      })
                    }
                  })
                } else if (statu == 999) {
                  wx.redirectTo({
                    url: '../login/login',
                  })
                } else {
                  wx.closeBLEConnection({
                    deviceId: wx.getStorageSync('deviceId'),
                    success: function (res) {
                    },
                  })
                }
              },
              fail: function (res) {
                wx.showModal({
                  showCancel: false,
                  title: '温馨提示',
                  content: '断开蓝牙失败',
                })
              }
            })
          } else if (statu == 2) {
            // console.log( res)
            var bianliang = wx.getStorageSync('bianliang')
            // console.log(bianliang)
            if (bianliang == 0) {
              wx.showModal({
                showCancel: false,
                title: '温馨提示',
                content: '请手动关锁后，结束行程',
                success: function (res) {
                  wx.hideLoading()
                  // console.log(that.data.disabled, 'ddddddddaaaaa')
                  that.setData({
                    disabled: false
                  })
                }
              })
            }
          }
        }
      })
    }
  },
  // 定位函数，移动位置到地图中心
  movetoPosition: function () {
    this.mapCtx.moveToLocation();
  },
  qixing: function (){
    var session = wx.getStorageSync("session")
    var uuid = wx.getStorageSync("uuid")
    var that=this
    wx.request({
      url: 'https://tt.dd-bike.cn/wx/wxlasttrip1',
      data: {
        location: that.data.location
      },
      method: 'get',
      header: {
        "Content-Type": "application/json",
        'dd_uuid': uuid,
        'dd_session': session
      },
      success: function (res) {
        // console.log(res,'骑行中')
        var statu = res.data.success
        if (statu == 0) {
          that.setData({
            time: res.data.data.duration,
            bikeno: res.data.data.bikeno,
            yuan: res.data.data.cost,
            yue: res.data.data.yue
          })
          wx.setStorageSync('time', res.data.data.duration)
          wx.setStorageSync('bikeno', res.data.data.bikeno)
          wx.setStorageSync('yuan', res.data.data.cost)
          wx.setStorageSync('yue', res.data.data.yue)
        } else if (statu == 1) {
          wx.showModal({
            showCancel: false,
            title: '温馨提示',
            content: '暂无行程',
          })
        } else if (statu == 99) {
          wx.redirectTo({
            url: '../login/login',
          })
        } else {
          wx.showModal({
            showCancel: false,
            title: '温馨提示',
            content: '系统异常',
          })
        }
      },
      fail: function (res) {
      }
    })
  },
  tlePhone:function(res){
    wx.makePhoneCall({
      phoneNumber: '4000091008'
    })
  }
})