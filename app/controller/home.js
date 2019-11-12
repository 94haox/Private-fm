'use strict';
let ParserKit = require('rss-parser');
let parser = new ParserKit();
var util = require('util')
let moment = require('moment')
let xml2js = require('xml2js')
let request = require('request')


const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.body = 'hi, egg';
  }

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

  async parser(){
    let url = this.ctx.request.query['url']
    let podcast = await this.getPodcastJson(url)
    let pod = await this.parserLastFifteenEpisode(podcast)
    this.success(pod)
  }

  async getPodcastJson(url) {
    let result = await new Promise(function (resolve, reject) {
        request({
          url: url,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:45.0) Gecko/20100101 Firefox/45.0',
            accept: 'text/html,application/xhtml+xml'
          },
          pool: false,
          followRedirect: true,
        }, function (error, response, xml) {
          if (!error && response.statusCode == 200) {
            var parser = new xml2js.Parser({
              trim: false,
              normalize: true,
              mergeAttrs: true
            });

            parser.addListener("error", function (err) {
              reject(err)
            });

            parser.parseString(xml, function (err, result) {
              resolve(result)
            });

          } else {
            reject(new Error('Podcast not found'))
          }
        });
      })
      .catch((err) => {
        return err
      })

    return result
  }

  async parserLastFifteenEpisode(json) {

    var channel = json.rss.channel;
    var rss = {
      items: []
    };

    if (util.isArray(json.rss.channel))
      channel = json.rss.channel[0];

    if (channel.title) {
      rss.title = channel.title[0];
    }

    if (channel.copyright) {
      rss.copyright = channel.copyright[0]
    }

    if (channel.description) {
      rss.description = channel.description[0];
    }
    if (channel.link) {
      rss.url = channel.link[0];
    }

    // add rss.image via @dubyajaysmith
    if (channel.image) {
      rss.image = channel.image[0].url
    }

    if (!rss.image && channel["itunes:image"]) {
      rss.image = channel['itunes:image'][0].href
    }

    rss.image = rss.image && Array.isArray(rss.image) ? rss.image[0] : '';

    if (channel.item) {
      if (!util.isArray(channel.item)) {
        channel.item = [channel.item];
      }
      rss.episode_count = channel.item.length;

      // if (!this.isReverse(channel.item)) {
      //   channel.item.reverse()
      // }

      for (let index = 0; index < channel.item.length; index++) {
        const val = channel.item[index];
        var obj = {};
        obj.title = !util.isNullOrUndefined(val.title) ? val.title[0] : '';
        obj.description = !util.isNullOrUndefined(val.description) ? val.description[0] : '';
        obj.url = obj.link = !util.isNullOrUndefined(val.link) ? val.link[0] : '';

        if (val['itunes:subtitle']) {
          obj.itunes_subtitle = val['itunes:subtitle'][0];
        }
        if (val['itunes:image']) {
          let href = val['itunes:image'][0]['href']
          obj.image = !util.isNullOrUndefined(href[0]) ? href[0] : rss.image
        }

        if (val['itunes:summary']) {
          obj.itunes_summary = val['itunes:summary'][0];
        }
        if (val['itunes:author']) {
          obj.itunes_author = val['itunes:author'][0];
          rss.author = obj.itunes_author
        }
        if (val['itunes:explicit']) {
          obj.itunes_explicit = val['itunes:explicit'][0];
        }
        if (val['itunes:duration']) {
          obj.itunes_duration = val['itunes:duration'][0];
        }
        if (val['itunes:season']) {
          obj.itunes_season = val['itunes:season'][0];
        }
        if (val['itunes:episode']) {
          obj.itunes_episode = val['itunes:episode'][0];
        }
        if (val['itunes:episodeType']) {
          obj.itunes_episodeType = val['itunes:episodeType'][0];
        }
        if (val.pubDate) {
          //lets try basis js date parsing for now
          obj.created = Date.parse(val.pubDate[0]);
          if (index == 0) {
            rss.update_time = obj.created
          }
        }
        if (val['media:content']) {
          obj.media = val.media || {};
          obj.media.content = val['media:content'];
        }
        if (val['media:thumbnail']) {
          obj.media = val.media || {};
          obj.media.thumbnail = val['media:thumbnail'];
        }
        // if (val.enclosure) {
        //   obj.enclosures = [];
        //   if (!util.isArray(val.enclosure))
        //     val.enclosure = [val.enclosure];
        //   val.enclosure.forEach(function (enclosure) {
        //     var enc = {};
        //     for (var x in enclosure) {
        //       enc[x] = enclosure[x][0];
        //     }
        //     obj.enclosures.push(enc);
        //   });

        //   if (obj.enclosures) {
        //     obj.url = !util.isNullOrUndefined(obj.enclosures[0]["url"]) ? obj.enclosures[0]["url"] : obj.url
        //   }
        // }
        rss.items.push(obj);
      }

    }
    return rss;

  }




  ensureSortLatest(podcast){
    if (podcast.items.length > 1){
      let episode = podcast.items[0];
      let second = podcast.items[1]
      let firstTime = moment(episode['isoDate'], moment.ISO_8601);
      let secondTime = moment(second['isoDate'], moment.ISO_8601);
      let diff = firstTime.diff(secondTime)
      if (diff < 0) {
        podcast.item.reverse()
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
