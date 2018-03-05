var md5 = require("../../utils/md5.js")
var checkNetWork = require("../../utils/CheckNetWork.js")
Page({
  data: {
    getCodeBtnProperty: {
      titileColor: '#fff',
      disabled: true,
      loading: false,
      title: '获取验证码'
    },
    loginBtnProperty: {
      disabled: true,
      loading: false,
    },
    getCodeParams: {
      token: 'airbike-token',
      mobile: '',
      code:'',
      checksum: '',
    },
    registerParams: {
      mobile: '',
      code: '',
      checksum: ''
    },
    codeTfFocus: false,
    DdBikeUrl: { 
      getcode: "https://tt.dd-bike.cn/wx/sendsms",
      yanzheng:"https://tt.dd-bike.cn/wx/checkSMSCode",
      register: "https://tt.dd-bike.cn/wx/wxlogin"
    },
    //校验码
    SALT: "AIRBIKESALT",
    longitude: 0,
    latitude: 0,
  },
  onLoad: function (options) {
    console.log(111)
    // 生命周期函数--监听页面加载
  },

  //输入手机号
  phoneTfInput: function (e) {
    var that = this
    var inputValue = e.detail.value
    var length = e.detail.value.length
    var myreg = /^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1})|(17[0-9]{1}))+\d{8})$/
    if (length == 11 && myreg.test(inputValue)) {
      //给接口的mobile参数赋值,以及改变获取验证码的状态
      that.setData({
        'getCodeParams.mobile': inputValue,
        'registerParams.mobile': inputValue,
        'getCodeBtnProperty.titileColor': '#34B5E3',
        'getCodeBtnProperty.disabled': false
      })
    } else {
      //给接口的mobile参数赋值,以及改变获取验证码的状态
      that.setData({
        'getCodeParams.mobile': '',
        'registerParams.mobile': '',
        'getCodeBtnProperty.titileColor': '#B4B4B4',
        'getCodeBtnProperty.disabled': true
      })
    }
  },
  //获取验证码
  getCodeAct: function () {
    this.setData({
      'codeTfFocus': false
    })
    //请求接口
    if (checkNetWork.checkNetWorkStatu() == false) {
      wx.showModal({
        title: '温馨提示',
        content: '网络错误',
      })
    } else {
      var that = this
      var checksum = that.data.getCodeParams.token + that.data.getCodeParams.mobile + that.data.SALT
      var checksumMd5 = md5.hexMD5(checksum)
      that.setData({
        'getCodeParams.checksum': checksumMd5,
        //显示loading
        'getCodeBtnProperty.loading': true
      })
      wx.request({
        url: that.data.DdBikeUrl.getcode,
        method: 'get', 
        header: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        data:{
          mobile: that.data.getCodeParams.mobile
        },
        success: function (res) {
          // success
          var message = res.data.msg
          var statu = res.data.success
          if (statu == '0') {
            wx.showToast({
              title: '验证码\n' + message,
              icon: 'success',
              duration: 2000,
            })
            setTimeout(function(){
              that.setData({
                'codeTfFocus': true
              })
            },3000)
            //启动定时器
            var number = 60;
            var time = setInterval(function () {
              number--;
              that.setData({
                'getCodeBtnProperty.title': number + '秒',
                'getCodeBtnProperty.disabled': true
              })
              if (number == 0) {
                that.setData({
                  'getCodeBtnProperty.title': '重新获取',
                  'getCodeBtnProperty.disabled': false
                })
                clearInterval(time);
              }
            }, 1000);
          } else if(statu==1){
            wx.showToast({
              title:  '已达到发送上限',
              icon: 'loading',
              duration: 2000,
            })
          }else if(status==2){
            wx.showToast({
              title: message,
              duration: 2000,
            })
          }
          else if(status==3){
            wx.showToast({
              title: message,
              icon: 'loading',
              duration: 2000,
            })
          }else{
            wx.showToast({
              title: message,
              icon: 'loading',
              duration: 2000,
            })
          }
        },
        fail: function (res) {
          // fail
          that.failMessage()
        },
        complete: function () {
          // complete
          //隐藏loading
          that.setData({
            'getCodeBtnProperty.loading': false
          })
        }
      })
    }
  },

  //输入验证码
  codeTfInput: function (e) {
    var that = this
    var inputValue = e.detail.value
    var length = e.detail.value.length
    if (length == 4) {
      //给接口的mobile参数赋值,以及改变获取验证码的状态
      that.setData({
        'loginBtnProperty.disabled': false,
        'registerParams.code': inputValue
      })
    } else {
      //给接口的mobile参数赋值,以及改变获取验证码的状态
      that.setData({
        'loginBtnProperty.disabled': true,
        'registerParams.code': ''
      })
    }
  },

  //注册登录
  loginAct: function () {
    //光标取消
    var that = this
    that.setData({
      'codeTfFocus': false
    })
    //请求接口
    if (checkNetWork.checkNetWorkStatu() == false) {
    } else {
      var checksum = that.data.registerParams.mobile + that.data.registerParams.code + that.data.SALT
      var checksumMd5 = md5.hexMD5(checksum)
      that.setData({
        'registerParams.checksum': checksumMd5,
        //显示loading
        'loginBtnProperty.loading': true
      })
      //判断手机与验证码是否匹配
      wx.request({
        url: that.data.DdBikeUrl.yanzheng,
        data:{
          mobile: that.data.registerParams.mobile,
          smsCode: that.data.registerParams.code
        },
        method:'get',
        header:{
          'content-type': 'application/x-www-form-urlencoded'
        },
        success:function(res){
          var msg=res.data.msg;
          var status = res.data.success;
          if(status==0){
            //验证码与手机号匹配
            wx.getLocation({
              type: "gcj02",
              success:function(res){
                that.setData({
                  longitude: res.longitude,
                  latitude: res.latitude
                })
              }
            })
            var location = that.data.longitude + ',' + that.data.latitude
            wx.request({
              url: that.data.DdBikeUrl.register,
              data:{
                  mobile:that.data.registerParams.mobile,
                  location:location
              } ,             
              method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
              // header: {}, // 设置请求的 header
              header: {
                'content-type': 'application/x-www-form-urlencoded'
              },
              success: function (res) {
                // success
                var message = res.data.msg
                var statu = res.data.success
                wx.setStorageSync("session", res.data.data.dd_session)
                wx.setStorageSync("uuid", res.data.data.dd_uuid)
                if(statu==0){
                  wx.showToast({
                    title: message,
                    icon:'success',
                    duration:1000,
                    success:function(res){
                      wx.redirectTo({
                        url: '../index/index',
                      })            
                    }
                  })
                }
                if (statu == 1) {
                  //1表示注册
                  wx.showToast({
                    title: '注册登录',
                    icon: 'success',
                    duration: 2000,
                    success:function(res){
                      wx.redirectTo({ url: '../index/index' })       
                    }
                  })
                } else if (statu == 2) {
                  // -5表示登录
                  wx.showToast({
                    title: '验证码不正确',
                    icon: 'loading',
                    duration: 2000,
                  })
                } else {
                  wx.showToast({
                    title: message,
                    icon: 'loading',
                    duration: 2000,
                  })
                }

              },
              fail: function () {
                // fail
                that.failMessage()
              },
              complete: function () {
                // complete
                //隐藏loading
                that.setData({
                  'loginBtnProperty.loading': false
                })
              }
            })
          }else if(status==1){
            wx.showToast({
              title: msg,
              duration: 2000,
              success:function(res){
                that.setData({
                  'loginBtnProperty.disabled': true
                })
              }
            })
          }else if(status==2){
            wx.showToast({
              title: msg,
              duration: 2000,
              success: function (res) {
                that.setData({
                  'loginBtnProperty.disabled': true
                })
              }
            })
          }else if(status==3){
            wx.showToast({
              title: msg,
              duration: 2000,
              success: function (res) {
                that.setData({
                  'loginBtnProperty.disabled': true
                })
              }
            })
          }else if(status==4){
            wx.showToast({
              title: msg,
              duration: 2000,
              success: function (res) {
                that.setData({
                  'loginBtnProperty.disabled': true
                })
              }
            })
          }else{
            wx.showToast({
              title: msg,
              duration: 2000,
              success: function (res) {
                that.setData({
                  'loginBtnProperty.disabled': true
                })
              }
            })
          }
        },fail:function(res){
          wx.showToast({
            title: '验证码不正确的',
            duration: 2000,
            success: function (res) {
              that.setData({
                'loginBtnProperty.disabled': true
              })
            }
          })
        }
      })
    }
  },
  // statechange(e) {
  //   console.log('live-pusher code:', e.errCode)
  // },
  //用车服务条款
  explainAct: function () {
    wx.navigateTo({
      url: '../index/index'
    })
  },

  failMessage: function () {
    wx.showToast({
      title: '连接服务器失败',
      icon: 'loading',
      duration: 2000,
    })
  }
})