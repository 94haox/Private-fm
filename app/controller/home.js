'use strict';
let ParserKit = require('rss-parser');
let parser = new ParserKit();
var util = require('util')
let moment = require('moment')
let xml2js = require('xml2js')
let request = require('request')


const Controller = require('egg').Controller;

class HomeController extends Controller {

  async parserRss() {
    let url = this.ctx.request.query['url']
    try {
      let hasCache = await this.app.cache.has(url)
      if (hasCache) {
        let cacheRssObj = await this.app.cache.get(url)
        this.success(cacheRssObj)
        return;
      }
      let feed = await parser.parseURL(url);
      feed = this.ensureSortLatest(feed)
      this.app.cache.set(url, feed, 300)
      this.success(feed)
    } catch (error) {
      console.error('parser-error', error)
      this.error('could not parser')
    }
  }

  ensureSortLatest(podcast){
    if (podcast.items.length > 1){
      let episode = podcast.items[0];
      let second = podcast.items[1]
      let firstTime = moment(episode['isoDate'], moment.ISO_8601);
      let secondTime = moment(second['isoDate'], moment.ISO_8601);
      let diff = firstTime.diff(secondTime)
      podcast.episodes = podcast.items
      podcast.items = null
      if (diff < 0) {
        podcast.episodes.reverse()
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

   error(msg, code = 1) {
     this.ctx.body = {
       result: 1,
       data: {},
       code: code,
       message: msg
     }
   }

}

module.exports = HomeController;
