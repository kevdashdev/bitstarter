#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs'),
    program = require('commander'),
    cheerio = require('cheerio'),
    restler = require('restler'),
    HTMLFILE_DEFAULT = 'index.html',
    CHECKSFILE_DEFAULT = 'checks.json';

var assertFileExists = function(infile) {
  var instr = infile.toString();
  if(!fs.existsSync(instr)) {
    console.log("%s does not exist. Exiting.", instr);
    process.exit(1);
  }
  return instr;
};

var assertUrlExists = function(url) {
  var targetUrl = url.toString();
  restler.get(targetUrl).on('complete', function(data, response) {
    if (response.statusCode == 404) {
      console.log(targetUrl + ' does not exists. Error 404.');
      process.exit(1);
    }
  });
  return targetUrl;
};

var cheerioHtmlFile = function(htmlfile) {
  return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
  return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
  $ = cheerioHtmlFile(htmlfile);
  var checks = loadChecks(checksfile).sort(),
      out = {};
  for(var ii in checks) {
    var present = $(checks[ii]).length > 0;
    out[checks[ii]] = present;
  }
  return out;
};

var clone = function(fn) {
  return fn.bind({});
};

if(require.main == module) {
  program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <URL>', 'URL to check')
        .parse(process.argv);
  var checkJson;
  if(program.file && program.file !== HTMLFILE_DEFAULT) {
    checkJson = checkHtmlFile(program.file, program.checks);
  }
  if(program.url){
    restler.get(program.url).on('complete', function(data, response) {
      if(response.statusCode == 404) {
        console.log("404 Error encountered.");
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
      }
      else {
        fs.writeFileSync('remote.html', response.raw);
        checkJson = checkHtmlFile('remote.html', program.checks);
      }
    });
  }
  setTimeout(function(){
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
  }, 5000);
} else {
  exports.checkHtmlFile = checkHtmlFile;
}
