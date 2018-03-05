//获取应用实例
var app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    time:0,
    yuan:0,
    bikeno:0,
    yue:0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  //第一种方案
  var yue = options.yue
  var bianhao = options.bikehao
  var money = options.money
  var time = options.time
  this.setData({
    time: time,
    yuan: money,
    bikeno: bianhao,
    yue: yue
  })
  setTimeout(function () {
    wx.redirectTo({
      url: '../money/money',
    })
  }, 5000)
    //另一种方案
    // var session = wx.getStorageSync("session")
    // var uuid = wx.getStorageSync("uuid")
    // var that=this
    // wx.request({
    //   url: 'https://tt.dd-bike.cn/wx/wxrentcheck',
    //   method: 'get',
    //   header: {
    //     "Content-Type": "application/json",
    //     'dd_uuid': uuid,
    //     'dd_session': session
    //   },
    //   success:function(res){
    //     var yue = (res.data.data.ul_balance_total / 100)
    //     var bianhao = options.bikehao
    //     var money = options.money
    //     // var yue = options.yue
    //     var time = options.time
    //     that.setData({
    //       time: time,
    //       yuan: money,
    //       bikeno: bianhao,
    //       yue: yue
    //     })
    //     setTimeout(function () {
    //       wx.redirectTo({
    //         url: '../money/money',
    //       })
    //     }, 5000)
    //   }
    // })
  },
})