var utils = require('../../utils/md5.js');
//获取应用实例
var app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    yajin:'199元',
    ga_id:1,
     payment:{
       disabled:false
     }
  },
  choose:function(){
  },
  onLoad:function(option){
    var that = this
    var session = wx.getStorageSync("session")
    var uuid = wx.getStorageSync("uuid")
    wx.request({
      url: 'https://tt.dd-bike.cn/wx/wxdepositgoods',
      method: 'get',
      header: {
        "Content-Type": "application/json",
        'dd_uuid': uuid,
        'dd_session': session
      },
      success:function(res){
        var yajin = res.data.data.gd_price/100
        that.setData({
          yajin: yajin+'元',
          gd_id: res.data.data.gd_id
        })
      }
    })
  },
  payment:function(res){
    var that = this
    var session = wx.getStorageSync("session")
    var uuid = wx.getStorageSync("uuid")
    wx.showModal({
      title: '温馨提示',
      content: '您确定交纳199元押金吗？押金可在名天动力单车APP全额退款',
      success:function(res){
        if (res.confirm==true){
          that.setData({
           'payment.disabled':true
          })
          wx.login({
            success: function (loginCode) {
              // console.log(that.data.gd_id)
              if (loginCode.code) {
                wx.setStorageSync('js_code', loginCode.code)
                wx.request({
                  url: 'https://tt.dd-bike.cn/wx/wechatPrePay',
                  data: {
                    gd_id: that.data.gd_id,
                    code: wx.getStorageSync('js_code')
                  },
                  method: 'get',
                  header: {
                    "Content-Type": "application/json",
                    "dd_uuid": uuid,
                    "dd_session": session
                  },
                  success: function (res) {
                    var msg = res.data.msg
                    var statu = res.data.success
                    if (statu == 0) {
                      var appid = res.data.data.appId
                      var noncestr = res.data.data.nonceStr
                      var out_trade_no = res.data.data.out_trade_no
                      var package1 = res.data.data.package
                      var partnerid = res.data.data.partnerId
                      var prepayid = res.data.data.prepayId//预支付交易单号
                      var sign = res.data.data.sign//签名
                      var timestamp = res.data.data.timeStamp
                      //微信支付接口
                      wx.requestPayment({
                        appId: appid,
                        timeStamp: timestamp,
                        nonceStr: noncestr,
                        package: package1,
                        signType: 'MD5',
                        paySign: sign,
                        success: function (res) {
                          wx.request({
                            url: 'https://tt.dd-bike.cn/wx/wxpayverify',//支付校验
                            method: 'get',
                            data: {
                              out_trade_no: out_trade_no
                            },
                            header: {
                              "Content-Type": "application/json",
                              "dd_uuid": uuid,
                              "dd_session": session
                            },
                            success: function (res) {
                              wx.redirectTo({
                                url: '../index/index',
                              })
                            }
                          })
                        },
                        fail: function (res) {
                        }
                      })

                    } else if (statu == 1) {
                      wx.showModal({
                        title: '温馨提示',
                        content: '押金充值失败',
                        success: function () {
                          wx.redirectTo({
                            url: '../recharge/recharge',
                          })
                        }
                      })
                    } else if (statu == 2) {
                      wx.showToast({
                        title: msg,
                        icon: 'loading'
                      })
                    } else if (statu == 3) {
                      wx.showToast({
                        title: msg,
                        icon: 'loading'
                      })
                    } else if (statu == 999) {
                      wx.showToast({
                        title: msg,
                        icon: 'loading'
                      })
                    } else {
                      wx.showToast({
                        title: msg,
                        icon: 'loading'
                      })
                    }
                  },
                  fail: function (res) {
                    wx.showModal({
                      title: '温馨提示',
                      content: '押金充值失败',
                      success: function () {
                        wx.redirectTo({
                          url: '../recharge/recharge',
                        })
                      }
                    })
                  }
                })
              } else {
                wx.showModal({
                  title: '温馨提示',
                  content: '获取用户信息失败',
                })
              }
            },
            fail: function (res) {
            }
          })
        }else{
          that.setData({
            'payment.disabled':false
          })
        }
      }
    })
  },
})