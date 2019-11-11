'use strict';
let ParserKit = require('rss-parser');
let parser = new ParserKit();


const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.body = 'hi, egg';
  }

  async parserRss() {
    let url = this.ctx.request.query['url']
    let feed = await parser.parseURL(url);
    this.success(feed)
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
