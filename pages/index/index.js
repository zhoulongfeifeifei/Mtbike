
//获取应用实例
var app = getApp()
Page({
  data: {
    scale: 18,
    latitude: 0,
    longitude: 0,
    markers: [],
    polyline:[],
    statu:0,//租车校验
    ul_statu:0,//判断是否是骑行中
    errorStatus:0,
  },
  // 页面加载
  onLoad: function (option) {
    var that=this
    //判断是否是第一次登陆
    var session = wx.getStorageSync("session")
    var uuid = wx.getStorageSync("uuid")  
    if (!uuid && !session) {
      wx.showToast({
        title: '请登录',
        icon: 'loading',
        duration: 10,
        success: function (res) {
          wx.redirectTo({ url: '../login/login' })
          return;
        }
      })
    } 
    //检查当前微信版本
    if (wx.openBluetoothAdapter) {
      wx.openBluetoothAdapter()
    } else {
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。',
        success:function(res){
          wx.redirectTo({
            url: '../index/index',
          })
        }
      })
    }
    wx.getLocation({
      type: "gcj02",
      success: function(res) {
        that.setData({
          longitude: res.longitude,
          latitude: res.latitude
        })
        var location = that.data.longitude + "," + that.data.latitude;
        wx.setStorageSync('location', location)
        //查询周围车辆
        var obj=null;
        var markerss=[];
        wx.request({
          url: 'https://tt.dd-bike.cn/wx/mapquery',
          data:{
            location: location
          },
          header: {
            'content-type': 'application/x-www-form-urlencoded' //告诉提交给后台的文件类型
          },
          method:'get',
          success:function(res){
            if(res.data.success==0){
              for(var i=0;i<res.data.data.length;i++){
                obj={
                  id: res.data.data[i].bl_uuid,
                  iconPath: '../../imgs/icon_bike.png',
                  latitude: res.data.data[i].lat,
                  longitude: res.data.data[i].lng,
                  width:37,
                  height:45
                }
                markerss.push(obj)
              }
              that.setData({
                markers:markerss
              })
            }else if(res.data.success==1){
              wx.showToast({
                title: res.data.msg,
                icon: 'loading',
                duration: 1000
              })
            } else if (res.data.success == 2){
              wx.showToast({
                title: res.data.msg,
                icon: 'loading',
                duration: 2000
              })
            }else{
              wx.showToast({
                title: res.data.msg,
                icon: 'loading',
                duration: 2000
              })
            }
          },fail:function(res){
          }
        })
      }
    });
    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          controls: [{
            id: 1,
            iconPath: '/imgs/icon_location.png',
            position: {
              left: 15,
              top: res.windowHeight - 60,
              width: 45,
              height: 45
            },
            clickable: true
          }
            , {
            id: 2,
            iconPath: '/imgs/icon_scan.png',
            position: {
              left: res.windowWidth / 2 - 100,
              // top: res.windowHeight - 450,
              top: res.windowHeight - 60,
              width: 200,
              height: 45
            },
            clickable: true
          }
            , {
            id: 3,
            iconPath: '/imgs/icon_money.png',
            position: {
              left: res.windowWidth - 60,
              top: res.windowHeight - 60,
              width: 45,
              height: 45
            },
            clickable: true

          },
          {
            id: 4,
            iconPath: '/imgs/icon_phone.png',
            position: {
              left: res.windowWidth - 60,
              top: res.windowHeight - 120,
              width: 45,
              height: 45
            },
            clickable: true

          }
          ]
        })
      },
    })
    //租车校验
    wx.request({
      url: 'https://tt.dd-bike.cn/wx/wxrentcheck',
      method: 'get',
      header: {
        "Content-Type": "application/json",
        'dd_uuid': uuid,
        'dd_session': session
      },
      success: function (res) {
        var statu = res.data.success
        that.setData({
          statu:statu
        })
        if (statu == 999) {
          wx.redirectTo({
            url: '../login/login',
          })

        } else if (statu == 0) {
          var ul_statu = res.data.data.ul_status   
          if (ul_statu == 0) {
            that.setData({
              ul_statu: ul_statu
            })
            var errorStatus = res.data.data.errorStatus
            that.setData({
              errorStatus: errorStatus
            })
            if(errorStatus ==5){
              wx.redirectTo({
                url: '../wsm/wsm',
              })
            }
          } else if (ul_statu == 1) {
            //正在租车
            wx.redirectTo({
              url: '../Cycling/Cycling',
            })
          }

        }
      },
      fail: function (res) {
        wx.showModal({
          title: '温馨提示',
          content: '租车校验失败',
        })
      }
    })
  },
  // 页面显示
  onShow: function () {
    // // 1.创建地图上下文，移动当前位置到地图中心
    this.mapCtx = wx.createMapContext("myMap");
    this.movetoPosition()
  },
  // 地图标记点击事件，连接用户位置和点击的单车位置
  bindmarkertap: function (e) {
    let _markers = this.data.markers;
    let markerId = e.markerId;
    let currMaker = _markers[0];
    for(var i=0;i<_markers.length;i++){
      if(_markers[i].id==markerId){
        currMaker=_markers[i];
      }
    }
    // console.log(currMaker.longitude, currMaker.latitude)
    this.setData({
      polyline: [{
        points: [{
          longitude: this.data.longitude,
          latitude: this.data.latitude
        }, {
          longitude: currMaker.longitude,
          latitude: currMaker.latitude
        }],
        color: "#FF0000DD",
        width: 2,
        dottedLine: true
      }],
      scale: 18
    })
  },

  bindcontroltap: function (e) {
    var that=this;
    switch (e.controlId) {
      case 1:
        this.movetoPosition();
        break;
      case 2:
        var that = this
          //获取本地用户信息
          var session = wx.getStorageSync("session")
          var uuid = wx.getStorageSync("uuid")
          var location = that.data.longitude + ',' + that.data.latitude
          wx.setStorageSync('location', location)
          // wx.setStorageSync('location','118.88, 28.97')
          var statu = that.data.statu
          var ul_statu = that.data.ul_statu
          var errorStatus = that.data.errorStatus
          if (ul_statu == 0) {
            if(errorStatus==6){
              wx.showToast({
                title: '押金退还中',
                icon: 'loading'
              })
            }else if(errorStatus==7){
              wx.showToast({
                title: '积分不足不能租车',
                icon: 'loading'
              })
            }else{ 
              wx.scanCode({
                success: function (res) {    
                  console.log(res)
                  var errorStatus = that.data.errorStatus   
                  if (errorStatus == 1) {//芝麻信用未校验
                    wx.redirectTo({
                      url: '../recharge/recharge',
                    })
                  }else if (errorStatus == 2 || errorStatus==3) {//押金不足
                    wx.redirectTo({
                      url: '../recharge/recharge',
                    })
                  }else if (errorStatus==4){//余额不足
                    wx.redirectTo({
                      url: '../money/money',
                    })
                  } else{
                    var url = "https://dd-bike.cn/j";
                    var oldurl = res.result//获取车辆的id
                    var maurl = oldurl.split("?")[0]
                    var newurl = ''
                    if (maurl.indexOf(url) >= 0) {
                      newurl = oldurl.split("=")[1]; //车辆id地址
                      that.setData({
                        'MTId': newurl
                      })
                      wx.setStorageSync('bikeuuid', newurl)//车辆id存在本地
                      wx.navigateTo({
                        url: '../unlocking/unlocking',
                      })
                      // wx.redirectTo({
                      //   url: '../unlocking/unlocking',
                      // })
                    } else {
                      wx.showModal({
                        title: '温馨提示',
                        content: '请扫描MT BIKE车辆',
                        success: function (res) {
                        }
                      })
                    }
                  }
                },
                fail: function (res) {
                }
              })
            }
          }
        break;
      case 3:
      var zye=this.data.zye
      wx.redirectTo({
        url: '../money/money',
      })
      break;
      case 4:
        wx.makePhoneCall({
          phoneNumber: '4000091008'
        })
        break;
      default: break;
    }


  },

  // 定位函数，移动位置到地图中心
  movetoPosition: function () {
    this.mapCtx.moveToLocation();
  },
  // onShareAppMessage:function(res){
  //   if(res.from=='button'){
  //     // 来自页面内转发按钮
  //     console.log(res.target)
  //   }
  //   return{
  //     title: '转发',
  //     path: 'pages/money/money',
  //     success: function (res) {
  //       // 转发成功
  //     },
  //     fail: function (res) {
  //       // 转发失败
  //     }
  //   }
  // }
})

