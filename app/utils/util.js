
const parseString = require('xml2js').parseString;
module.exports = {

    formatInt(value) {
        if (value) {
            return parseInt(value)
        }
        return undefined;
    },

    formatBool(value) {
        if (value) {
            return Boolean(value)
        }
        return undefined
    },


    async parserXML(xml) {
        return new Promise((resolve, reject) => {
            parseString(xml, {
                explicitArray: false
            }, function (err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },


    time() {
        return moment().format('YYYY MM DD')
    },

    tsToYMD(timeStamp) {
        return moment(timeStamp).format('YYYY MM DD')
    },

    fromNow(time) {
        return moment(time).fromNow()
    }

}