var utils = require('../../utils/md5.js');
//获取应用实例
var app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    activeIndex: 0,
    gds_id:0,
    zye:'0.00',
    name:'',
    mobile:0,
    recharge: [
      {
      id: '5',
      full: '充100',
      send:'送50'
      }, {
        id: '4',
        full: '充50',
        send:'送10'
      }, {
        id: '3',
        full: '充20',
      }
    ],
  },
  /**
  * 生命周期函数--监听页面加载
  */
  onLoad: function (options) {
    var that=this
    var session = wx.getStorageSync("session")
    var uuid = wx.getStorageSync("uuid")
    wx.request({
      url: 'https://tt.dd-bike.cn/wx/wxrentcheck',
      method: 'get',
      header: {
        "Content-Type": "application/json",
        'dd_uuid': uuid,
        'dd_session': session
      },
      success:function(res){
        var zye = (res.data.data.ul_balance_total / 100).toFixed(2)
        that.setData({
          zye: zye,
          name: res.data.data.ul_name,
          mobile: res.data.data.ul_mobile
        })
      }
    })
    wx.request({
      url: 'https://tt.dd-bike.cn/wx/wxbalancegoods',//充值金额
      method: 'get',
      header: {
        "Content-Type": "application/json",
        'dd_uuid': uuid,
        'dd_session': session
      },
      success:function(res){
        var cz = res.data.data
        var recharge1=[]
        var obj1=null
        for(var i=0;i<cz.length;i++){
          if (cz[i].gd_price_give==0){
            obj1={
              id: cz[i].gd_id,
              full: '充' + cz[i].gd_price / 100+'元',
            }
          }else{
            obj1 = {
              id: cz[i].gd_id,
              full: '充' + cz[i].gd_price / 100+'元',
              send: '送' + cz[i].gd_price_give / 100+'元'
            }
          }
          recharge1.push(obj1)
        }
        that.setData({
          recharge: recharge1,
          gds_id: cz[0].gd_id
        })
      }
    })
  },
  changeColor: function (e) {
    var index = e.currentTarget.dataset.index;
    this.setData({
      activeIndex: index,
      gds_id: e.currentTarget.id,
      loginBtnProperty: false
    })
  },
  btnChong:function(res){
    var session = wx.getStorageSync("session")
    var uuid = wx.getStorageSync("uuid")
    // var czje = 5-this.data.activeIndex
    var czje= this.data.gds_id
    wx.login({
      success: function (loginCode) {
        if (loginCode.code) {
          wx.setStorageSync('js_code', loginCode.code)
          wx.request({
            url: 'https://tt.dd-bike.cn/wx/wechatPrePay',
            data: {
              gd_id: czje,
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
                  },
                })

              } else if (statu == 1) {
                wx.showModal({
                  title: '温馨提示',
                  content: '金额充值失败',
                  success: function () {
                    wx.redirectTo({
                      url: '../money/money',
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
                content: '充值失败',
                success: function () {
                  wx.redirectTo({
                    url: '../money/money',
                  })
                }
              })
            }
          })
        }else{
          wx.showModal({
            title: '温馨提示',
            content: '获取用户信息失败',
          })
        }
      },
      fail: function (res) {
        console.log(res,'失败')
      }
    })
  },
  goBack:function(res){
    wx.redirectTo({
      url: '../index/index',
    })
  },
})