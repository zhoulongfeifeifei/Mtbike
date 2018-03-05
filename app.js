//app.js
App({ 
  onLaunch: function() {
    //检查是否过期
    wx.checkSession({
      success:function(e){
      },
      fail:function(res){
        wx.login({
          success:function(res){
            if(res.code){
              wx.setStorage({
                key: 'code',
                data: res.code,
              })
            }else{
            }
          }
        })
      }
    })
    var that = this 
    //判断登陆
    //调用API从本地缓存中获取数据
    var session = wx.getStorageSync("session")
    var uuid = wx.getStorageSync("uuid")
  },
  getUserInfo: function(cb) {
    var that = this
    if (that.globalData.userInfo) {
      typeof cb == "function" && cb(this.globalData.userInfo)
    } else {
      //调用登录接口
      wx.getUserInfo({
        success: function(res) {
          that.globalData.userInfo = res.userInfo
          typeof cb == "function" && cb(that.globalData.userInfo)
        }
      })
    }
  },
  globalData: {
    userInfo: null
  }
})
