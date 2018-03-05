//获取应用实例
var app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    loginBtnProperty: {
      disabled: true,
      loading: false,
    },
    registerParams: {
      userName: '',
      sfrz: '',
      bc:'#cccccc',
      color:'#fff'
    },
  },
  nameInput:function(e){
    var that = this
    var inputValue = e.detail.value
    var length = e.detail.value.length
    if(length>0){
        that.setData({
          'registerParams.userName': inputValue
        })
    }else{
      that.setData({
        'registerParams.userName': ''
      })
    }
  },
  IdentificationInput:function(e){//身份证号
    var that = this
    var inputValue = e.detail.value
    var length = e.detail.value.length
    var reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
    if (that.data.registerParams.userName != ''){
      if (length > 14 && reg.test(inputValue)){
        that.setData({
          'loginBtnProperty.disabled': false,
          'registerParams.sfrz': inputValue,
          'registerParams.bc': '#262930',
        })
      }else{
        if (length == 15 && !reg.test(inputValue)){
          wx.showModal({
            title: '温馨提示',
            content: '身份证不合法',
            success:function(res){
              wx.redirectTo({
                url: '../wsm/wsm',
              })
            }
          })
        }
        that.setData({
          'loginBtnProperty.disabled': true,
          'registerParams.sfrz': '',
          'registerParams.bc': '#cccccc',
        })
      }
    }else{
      wx.showToast({
        title: '请先输入姓名',
        success:function(res){
          wx.redirectTo({
            url: '../wsm/wsm',
          })
          return 
        }
      })
    }
  },
  loginAct:function(res){
    var that=this
    var name = that.data.registerParams.userName
    var idcard = that.data.registerParams.sfrz
    var session = wx.getStorageSync("session")
    var uuid = wx.getStorageSync("uuid")
    wx.request({
      url: 'https://tt.dd-bike.cn/wx/VerifyIdcard',
      method: 'get',
      data:{
        name:name,
        idcard:idcard,
      },
      header:{
        "Content-Type": "application/json",
        'dd_uuid': uuid,
        'dd_session': session
      },
      success:function(res){
        if(res.data.success==0){
          wx.showToast({
            title: '实名认证成功',
            duration:500,
            success:function(res){
              wx.redirectTo({
                url: '../index/index',
              })
            }
          })
        }else{
          wx.showToast({
            title: res.data.msg,
            duration:3000,
            success:function(res){
              wx.redirectTo({
                url: '../wsm/wsm',
              })
            }
          })
        }
      },
      fail:function(res){
      }
    })
  },
})