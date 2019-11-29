'use strict';
let ParserKit = require('rss-parser');
let parser = new ParserKit({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:45.0) Gecko/20100101 Firefox/45.0',
  },
  maxRedirects: 100,
  xml2js: {
      trim: false,
      normalize: true,
    },
  defaultRSS: 2.0
});


var util = require('util')
let moment = require('moment')
let request = require('request')

const Controller = require('egg').Controller;

class HomeController extends Controller {

  async parserRss() {
    let url = this.ctx.request.query['url']
    try {
      let podcast = await this.parserWithRequest(url)
      if(podcast.items == null){
        this.error('podcast can not parser', 10001)
        return
      }
      this.success(podcast)
    } catch (error) {
      try {
        let feed = await parser.parseURL(url);
        feed = this.ensureSortLatest(feed)
        this.success(feed)
      } catch (error) {
        this.error('podcast can not parser', 10001)
      }
    }
  }

  async parserWithRequest(url){
    let params = {
      url: url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:45.0) Gecko/20100101 Firefox/45.0',
        accept: 'text/html,application/xhtml+xml'
      },
      followRedirect: true,
      timeout:15000
    }
    let that = this
    let result = await new Promise(function (resolve, reject) {
        request(params, function (error, response, xml) {
          if (!util.isNullOrUndefined(xml)) {
            parser.parseString(xml).then(res=>{
              resolve(that.ensureSortLatest(res))
            })
          } else {
            reject(error)
          }
        });
      })
      .catch((err) => {
        return err
      })
      return result
  }

  ensureSortLatest(podcast){
    if (util.isNullOrUndefined(podcast.items) && podcast.items.length > 1) {
      let episode = podcast.items[0];
      let second = podcast.items[1]
      let firstTime = moment(episode['isoDate'], moment.ISO_8601);
      let secondTime = moment(second['isoDate'], moment.ISO_8601);
      let diff = firstTime.diff(secondTime)
      if (diff < 0) {
        podcast.items.reverse()
      }
    }
    return podcast;
  }

   success(detail) {
     this.ctx.body = {
       result: 1,
       code: 0,
       data: {
         detail: detail
       },
       message: '操作成功'
     }
   }

   error(msg, code) {
     this.ctx.body = {
       result: 1,
       data: {},
       code: code,
       message: msg
     }
   }

}

module.exports = HomeController;
