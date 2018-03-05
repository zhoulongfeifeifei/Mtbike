var utils = require('../../utils/util');
var encStr;
var monitor = function (res) {
  // console.log('监听')
  var buff1 = res.value
  let hex = Array.prototype.map.call(new Uint8Array(buff1), x => ('00' + x.toString(16)).slice(-2)).join('');
  var session = wx.getStorageSync("session")
  var uuid = wx.getStorageSync("uuid")
  const blueArrayBuffer = new Uint8Array(res.value);
  const base64Str = wx.arrayBufferToBase64(blueArrayBuffer);
  // console.log(uuid,session,'dffffff',hex)
  wx.request({
    url: 'https://tt.dd-bike.cn/wx/syntony', //解析蓝牙返回的数据   
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
      // console.log('蓝牙解析数据',res)
      var statu = res.data.success
      if (statu == 0) {
        // console.log('状态为0')
        wx.setStorageSync('token', res.data.token)
        var token = wx.getStorageSync('token')
        var token1 = token.join(',')
        wx.request({
          url: 'https://tt.dd-bike.cn/wx/openLock',
          data: {
            token: token1
          },
          header: {
            'content-type': 'application/json',
            'dd_uuid': uuid,
            'dd_session': session
          },
          success: function (res) {
            // console.log('开锁指令')
            var openLock = res.data.wxopenLock;
            var buff = new ArrayBuffer(16)
            var dataView = new DataView(buff)
            var arr = openLock.split(',')
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
                  // console.log('二次写入成功')
                  setTimeout(function () {
                    wx.readBLECharacteristicValue({
                      deviceId: wx.getStorageSync("deviceId"),
                      serviceId: wx.getStorageSync("serviceId"),
                      characteristicId: wx.getStorageSync("readDataUUID"),
                      success: function (res) {
                        // console.log('做一个监听')
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
             
          },
          fail: function (res) {
          }
        })
      }else if(statu==1){
        //开锁上报
        // console.log('状态为1开锁上报')
        wx.request({
          url: 'https://tt.dd-bike.cn/wx/wxunlock',
          data: {
            capacity: null,
            bikeuuid: wx.getStorageSync('bikeuuid'),
            location: wx.getStorageSync('location')
          },
          header: {
            'content-type': 'application/json',
            'dd_uuid': uuid,
            'dd_session': session
          },
          success: function (res) {
            wx.vibrateLong()
            wx.hideLoading()
            // wx.showLoading({
            //   title: '租车成功',
            //   icon: 'success',
            //   success: function (res) {
            //     setTimeout(function () {
            //       wx.redirectTo({
            //         url: '../Cycling/Cycling?type=1',
            //       })
            //     }, 2000)
            //   }
            // })
          },
          fail: function (res) {
            wx.showModal({
              showCancel: false,
              title: '温馨提示',
              content: '开锁上报失败',
              success: function (res) {
                wx.redirectTo({
                  url: '../index/index',
                })
              }
            })
          }
          //骑行中的页面
        })
      } else if (statu == -1) {
        wx.showModal({
          showCancel: false,
          title: '温馨提示',
          content: '开锁失败',
          success: function (res) {
            // console.log('状态为3开锁失败')
            //开锁失败
            wx.request({
              url: 'https://tt.dd-bike.cn/wx/wxunlockfailed',
              data: {
                reason: '可能是多次修理过',
                bikeuuid: wx.getStorageSync('bikeuuid'),
                location: wx.getStorageSync('location')
              },
              header: {
                'content-type': 'application/json',
                'dd_uuid': uuid,
                'dd_session': session
              },
              success: function (res) {
                var statu = res.data.success
                if (statu == 0) {
                  wx.showModal({
                    showCancel: false,
                    title: '温馨提示',
                    content: '上报成功',
                    success: function (res) {
                      
                    }
                  })
                }
              }
            })
          }
        })
      } else if (statu == 2) {
        //锁处于开启状态
        wx.showModal({
          showCancel: false,
          title: '温馨提示',
          content: '请手动关锁后点击结束行程',
          success:function(res){
            // wx.redirectTo({
            //   url: '../Cycling/Cycling',
            // })
            wx.reLaunch({
              url: '../Cycling/Cycling',
            })
          }
        })
      } else if (statu == 3) {
        //锁处于关闭状态
        wx.showModal({
          showCancel: false,
          title: '温馨提示',
          content: '锁处于关闭状态',
          success:function(res){
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
                  wx.showModal({
                    showCancel: false,
                    title: '温馨提示',
                    content: '点击结束行程后，别忘记关锁哦！',
                    success: function () {
                      wx.closeBLEConnection({
                        deviceId: wx.getStorageSync('deviceId'),
                        success: function (res) {
                          var money = that.data.yuan
                          var bianhao1 = that.data.bikeno
                          var time = that.data.time
                          var yue = that.data.yue
                          wx.redirectTo({
                            url: '../lookPayment/lookPayment?bikehao=' + bianhao1 + '&money=' + money + '&yue=' + yue + '&time=' + time + '',
                          })
                        },
                        fail: function (res) {
                          wx.showModal({
                            showCancel: false,
                            title: '温馨提示',
                            content: '关闭蓝牙失败!请查看蓝牙是否在开启中,或者再次点击结束行程',
                            success: function (res) {
                              wx.createBLEConnection({
                                deviceId: wx.getStorageSync('deviceId'),
                                success: function (res) {
                                },
                                fail: function (res) {
                                }
                              })
                            }
                          })
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
                      wx.redirectTo({
                        url: '../index/index',
                      })
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
          }
          //pay页面  
        })
      }
    },
    fail: function (res) {
    }
  })
}
//获取应用实例
var app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    loading:false,
    x:0,
    percent:0,
    imgs:'../../imgs/begin.png',
    disabled: false,
    inType:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (wx.getStorageSync('deviceId')){
      wx.removeStorageSync('deviceId')
    }
     
    wx.closeBluetoothAdapter({
      success: function (res) {
        // console.log(res, '11111111111')
      }
    })
  },
  unlock:function(res){
    // console.log('开锁')
    wx.closeBluetoothAdapter({
      success: function (res) {
        // console.log(res, '11111111111')
      }
    })
    var that = this
    that.setData({
      loading:true,
      imgs: '../../imgs/open.gif',
      disabled:true,
      inType:1
    })
    var speed = 0
    var pro = setInterval(function () {
      speed += 1
      if (speed == 80) {
        clearInterval(pro)
      }
      that.setData({
        percent: speed
      })
      var percent = that.data.percent
      var speed1 = 80
      if (percent == 80) {
        var pore = setInterval(function () {
          speed1 += 1
          if (speed1 == 96) {
            clearInterval(pore)
          }
          that.setData({
            percent: speed1
          })
        }, 100)
      }
    }, 20)
    var session = wx.getStorageSync("session")
    var uuid = wx.getStorageSync("uuid")
    var location=wx.getStorageSync('location')
    //租车
    zc()
    function zc() {
      wx.request({
        url: 'https://tt.dd-bike.cn/wx/wxrent',
        data: {
          bikeuuid: wx.getStorageSync('bikeuuid')
        },
        method: 'get',
        header: {
          "Content-Type": "application/json",
          'dd_uuid': uuid,
          'dd_session': session
        },
        success: function (res) {
          // console.log('开始租车')
          var statu = res.data.success
          var msg = res.data.msg
          if (statu == 0) {
            // console.log('锁类型' + res.data.data.bl_lock_type)
            if (res.data.data.bl_lock_type == 1) {//蓝牙锁
            // console.log('蓝牙锁')
              var goTime = 0
              var sfks = setInterval(function () {
                wx.request({
                  url: 'https://tt.dd-bike.cn/wx/wxlasttrip1',//获取最后一次行程
                  data: {
                    location: wx.getStorageSync('location')
                  },
                  header: {
                    "Content-Type": "application/json",
                    'dd_uuid': uuid,
                    'dd_session': session
                  },
                  success: function (res) {
                    var statu = res.data.success
                    if (statu == 0) {
                      goTime += 0.25
                      if (res.data.data.tl_return_time == '') {
                        that.setData({
                          percent: 100
                        })
                        clearInterval(sfks)
                        wx.showToast({
                          title: '开锁成功',
                          icon: 'success',
                          duration: 1000,
                          success: function (res) {
                            // wx.redirectTo({
                            //   url: '../Cycling/Cycling',
                            // })
                            wx.reLaunch({
                              url: '../Cycling/Cycling',
                            })
                          }
                        })                             
                      } else {
                        if (goTime == 30) {
                          clearInterval(sfks)
                          that.setData({
                            percent: 100
                          })
                          wx.hideLoading()
                          wx.showToast({
                            title: '开锁失败',
                            icon:'loading',
                            duration:1000,
                            success:function(res){
                              wx.redirectTo({
                                url: '../index/index',
                              })
                            }
                          })                       
                        }
                      }
                    }
                  },
                  fail: function (res) {
                  }
                })

              }, 250)
              var umac = res.data.data.bl_mac; // 获取车辆mac地址
              // console.log(umac+'mac地址')
              wx.setStorageSync('umac', umac.toUpperCase())//将mac地址存储在本地
              if (wx.getStorageSync('deviceId')) {
                wx.closeBLEConnection({
                  deviceId: wx.getStorageSync('deviceId'),
                  success: function (res) {
                    wx.removeStorageSync('deviceId')
                  },
                })
              }
              wx.openBluetoothAdapter({ //初始化蓝牙设备
                success: function (res) {
                  // console.log('初始化蓝牙')
                  wx.getBluetoothAdapterState({// 获取蓝牙设备状态
                    success: function (res) {
                      // console.log('获取蓝牙设备状态')
                        wx.startBluetoothDevicesDiscovery({
                          // services: ['FEE7'],
                          success: function (res) {// 开始搜索蓝牙设备    
                            // console.log('开始搜索')
                          },
                          fail: function (res) {
                            // console.log('搜索失败')
                                wx.showModal({
                                  showCancel: false,
                                  title: '温馨提示',
                                  content: '请重启您的微信，再次进行扫码开锁',
                                })
                          },
                        })
                        wx.onBluetoothDeviceFound(function (res) {//监听蓝牙设备扫描
                          // console.log('监听蓝牙',res)
                          var ua = wx.getSystemInfoSync().platform;//获取设备类型
                          var mac1 = wx.getStorageSync('umac')//车辆mac地址
                          if (ua == 'ios') {//ios         
                            // console.log('ios')                              
                            var buff = res.devices[0].advertisData.slice(2,8)//获取广播地址 
                            var arrayBuff = Array.prototype.map.call(new Uint8Array(buff), x => ('00' + x.toString(16)).slice(-2)).join(':');//将广播地址转化为mac地址
                            var arrayMac = arrayBuff.toUpperCase();
                            if (arrayMac == mac1) {
                              wx.setStorageSync("deviceId", res.devices[0].deviceId);//蓝牙设备 id
                              iosopen();
                            }                           
                          } else {//安卓       
                            // console.log('安卓')              
                            if (mac1 == res.devices[0].deviceId) {//存储蓝牙设备id"+res.devices[0].deviceId
                              wx.setStorageSync("deviceId", res.devices[0].deviceId)
                              andropen();
                            }                        
                          }
                          //当前设备如果是ios设备
                          function iosopen() {
                            var devicesID = wx.getStorageSync("deviceId");                        
                            wx.createBLEConnection({//连接指定蓝牙
                              deviceId: devicesID,
                              success: function (res) {
                                wx.getBLEDeviceServices({//服务
                                  deviceId: devicesID,
                                  success: function (res) {
                                    wx.stopBluetoothDevicesDiscovery()//停止搜寻附近的蓝牙外围设备
                                    wx.setStorageSync("serviceId", res.services[0].uuid);
                                    var serviceId = wx.getStorageSync("serviceId");
                                    wx.getBLEDeviceCharacteristics({//获取蓝牙设备所以特征
                                      deviceId: devicesID,
                                      serviceId: serviceId,
                                      success: function (res) {
                                        wx.setStorageSync("bltServerUUID", res.characteristics[1].uuid);
                                        wx.setStorageSync("CLIENT_CHARACTERISTIC_CONFIG", res.characteristics[0].uuid);
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
                                                // console.log('写入成功')
                                                setTimeout(function () {
                                                  wx.onBLECharacteristicValueChange(monitor)
                                                }, 1000)
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
                                                }, 2000)
                                              },
                                              fail: function (res) {
                                              }
                                            })
                                          }
                                        })
                                      },
                                      fail: function (res) {
                                        wx.showModal({
                                          showCancel: false,
                                          title: '温馨提示',
                                          // content: '获取蓝牙特征值失败！',
                                          content:'开锁失败',
                                          success: function (res) {    
                                            wx.redirectTo({
                                              url: '../index/index',
                                            })                                     
                                          }
                                        })
                                      }
                                    })
                                  },
                                  fail: function (res) {
                                    wx.showModal({
                                      showCancel: false,
                                      title: '温馨提示',
                                      // content: '获取设备服务失败！',
                                      content: '开锁失败！',
                                      success: function (res) {
                                        wx.redirectTo({
                                          url: '../index/index',
                                        })
                                      }
                                    })
                                  }
                                })
                              },
                              fail: function (res) {
                                wx.showModal({
                                  showCancel: false,
                                  title: '温馨提示',
                                  // content: '连接指定蓝牙失败！',
                                  content: '开锁失败！',
                                  success: function (res) {
                                    wx.redirectTo({
                                      url: '../index/index',
                                    })
                                  }
                                })
                              }
                            })
                          }
                          //当前设备是安卓设备
                          function andropen() {
                            var devicesID = wx.getStorageSync("deviceId")
                            wx.createBLEConnection({
                              deviceId: devicesID,
                              success: function (res) {
                                // console.log('连接')
                                wx.getBLEDeviceServices({
                                  deviceId: devicesID,
                                  success: function (res) {
                                    // console.log('获取服务')
                                    wx.stopBluetoothDevicesDiscovery();
                                    wx.setStorageSync("serviceId", res.services[0].uuid);
                                    var serviceId = wx.getStorageSync("serviceId");
                                    wx.getBLEDeviceCharacteristics({
                                      deviceId: devicesID,
                                      serviceId: serviceId,
                                      success: function (res) {
                                        // console.log('获取特征值')
                                        wx.setStorageSync("bltServerUUID", res.characteristics[1].uuid);
                                        wx.setStorageSync("CLIENT_CHARACTERISTIC_CONFIG", res.characteristics[0].uuid);
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
                                                // console.log('写入')
                                                setTimeout(function () {
                                                  wx.onBLECharacteristicValueChange(monitor)
                                                }, 1000)
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
                                                }, 2000)
                                              },
                                              fail: function (res) {
                                              }
                                            })
                                          }
                                        })
                                      },
                                      fail: function (res) {
                                        wx.showModal({
                                          showCancel: false,
                                          title: '温馨提示',
                                          // content: '获取蓝牙特征值失败！',
                                          content:'开锁失败',
                                          success: function (res) {             
                                            wx.redirectTo({
                                              url: '../index/index',
                                            })                             
                                          }
                                        })
                                      },
                                    })
                                  },
                                  fail: function (res) {
                                    wx.showModal({
                                      showCancel: false,
                                      title: '温馨提示',
                                      // content: '获取设备服务失败！',
                                      content:'开锁失败',
                                      success: function (res) {
                                        wx.redirectTo({
                                          url: '../index/index',
                                        })
                                      }
                                    })
                                  },
                                })
                              },
                              fail: function (res) {
                                wx.showModal({
                                  showCancel: false,
                                  title: '温馨提示',
                                  // content: '连接指定蓝牙失败，请您重启微信！',
                                  content:'开锁失败',
                                  success: function (res) {
                                    wx.redirectTo({
                                      url: '../index/index',
                                    })
                                  }
                                })
                              },
                            })

                          };
                        })

                        
                    },
                    fail: function (res) {
                      wx.showModal({
                        showCancel: false,
                        title: '温馨提示',
                        // content: '获取蓝牙设备状态失败',
                        content:'开锁失败',
                        success: function (res) {
                          wx.redirectTo({
                            url: '../index/index',
                          })
                        }
                      })
                    }
                  })
                },
                fail: function (res) {
                  // if (wx.getStorageSync('deviceId')) {
                  //   wx.closeBLEConnection({
                  //     deviceId: wx.getStorageSync('deviceId'),
                  //     success: function (res) {
                  //       console.log('关闭所有')
                  //     },
                  //   })
                  // }
                  clearInterval(pro)
                  clearInterval(sfks)
                  // console.log(that.data.percent)
                  wx.showModal({
                    showCancel: false,
                    title: '温馨提示',
                    content: '请打开蓝牙',
                    success: function (res) {
                      wx.redirectTo({
                        url: '../unlocking/unlocking',
                      })
                    }
                  })
                  // wx.showToast({
                  //   title: '请打开蓝牙',
                  //   icon: 'loading',
                  //   duration: 3000,
                  //   success: function (res) {
                  //     wx.redirectTo({ url: '../unlocking/unlocking' })
                  //   }
                  // })
                return false;
                }
              })
            } else if (res.data.data.bl_lock_type == 2 || res.data.data.bl_lock_type == 3) {//三合一锁
            // console.log('三合一')
              wx.request({
                url: 'https://tt.dd-bike.cn/wx/wxgprsunlock',
                data: {
                  bikeuuid: wx.getStorageSync('bikeuuid')
                },
                method: 'get',
                header: {
                  "Content-Type": "application/json",
                  'dd_uuid': uuid,
                  'dd_session': session
                },
                success: function (res) {

                },
                fail: function (res) {
                  wx.showModal({
                    showCancel:false,
                    title: '温馨提示',
                    content: '开锁失败',
                    success: function (res) {
                      wx.redirectTo({
                        url: '../index/index',
                      })
                    }
                  })
                }
              })
              var goTime = 0
              var sfks = setInterval(function () {
                wx.request({
                  url: 'https://tt.dd-bike.cn/wx/wxlasttrip1',//获取最后一次行程
                  data: {
                    location: wx.getStorageSync('location')
                  },
                  header: {
                    "Content-Type": "application/json",
                    'dd_uuid': uuid,
                    'dd_session': session
                  },
                  success: function (res) {
                    var statu = res.data.success
                    if (statu == 0) {
                      goTime += 0.25
                      if (res.data.data.tl_return_time == '') {
                        that.setData({
                          percent: 100
                        })
                        clearInterval(sfks)
                        wx.showLoading({
                          title: '开锁成功',
                          duration: 2000,
                          success: function (res) {
                            // wx.redirectTo({
                            //   url: '../Cycling/Cycling',
                            // })
                            wx.reLaunch({
                              url: '../Cycling/Cycling',
                            })
                          }
                        })
                      } else {
                        if (goTime == 20) {
                          clearInterval(sfks)
                          that.setData({
                            percent: 100
                          })
                          wx.hideLoading()
                          wx.showLoading({
                            title: '开锁失败',
                            success: function (res) {
                              wx.redirectTo({
                                url: '../index/index',
                              })
                            }
                          })
                        }
                      }
                    }
                  },
                  fail:function(res){
                  }
                })

              }, 250)
            }
          } else if (statu == 1) {
            wx.showModal({
              showCancel: false,
              title: '温馨提示',
              content: '该车已被他人预约,请换一辆车哦',
            })
          } else if (statu == 2) {
            wx.showModal({
              showCancel: false,
              title: '温馨提示',
              content: '车辆不存在',
              success:function(){
                wx.reLaunch({
                  url: '../index/index',
                })
              }
            })
            // wx.showToast({
            //   title:'车辆不存在',
            //   icon:'loading',
            //   duration: 2000,
            //   success:function(res){
            //     wx.redirectTo({
            //       url: '../index/index',
            //     })
            //   }
            // })
          } else if (statu == 3) {
            wx.showModal({
              showCancel: false,
              title: '温馨提示',
              content: '车辆uuid不能为空',
            })
          } else if (statu == -1) {
            wx.showModal({
              showCancel: false,
              title: '温馨提示',
              content: '系统异常',
            })
          } else if (statu == 999) {
            wx.showModal({
              showCancel: false,
              title: '温馨提示',
              content: '登录失效',
              success: function (res) {
                wx.redirectTo({
                  url: '../login/login',
                })
              }
            })
          }
        },
        fail: function (res) {
          wx.showModal({
            showCancel: false,
            title: '温馨提示',
            content: '请扫描车辆二维码',
            success: function (res) {
              wx.redirectTo({
                url: '../index/index',
              })
            }
          })
        }
      })
    }
  }
})