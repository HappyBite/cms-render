var swig = require('swig');
var _utils = require('swig/lib/utils'); 
var utils = require('./utils'); 
var async = require('async');
var sync = require('sync');
var client = require('../cms-client.js');  
var cache = require('nconf'); 
var querystring = require('querystring'); 

function parser (str, line, parser, types, options, swig) {  
  parser.on(types.STRING, function (token) {
    //console.log(parser);
    //swig.locals['valuee'] = 'asdf';
    //   throw new Error('"trans" tag does not accept arguments.');
    //console.log('parser')
    //swig.locals.slug = 'asssssd';
    this.out.push(token.match);
    this.out.push(swig.locals.url); 
    //console.log('args');
  });
  return true;
}

function compiler(compiler, args, content, parents, options, blockName) {
  //console.log(args);
  if(args && args.length === 2) { 
    var url = args[1].replace(/'/g, '');
    var currentRoute = utils.getCurrentRoute(url);
    var page = args[0].replace(/'/g, '');
    if(page === 'page' && currentRoute.type === 'page') {
      return compiler(content, parents, options, blockName) + '\n';
    } else {
      return false;
    }
    return false;
  } else if (args && args.length !== 4) { 
    return '_output += "Metoden \\"get\\" är felkonstruerad";\n';
  } else {
    var url = args[3].replace(/'/g, '');
    var path = args[2].replace(/'/g, '');;
    var item_type = args[0].replace(/'/g, '');;
    //console.log('url: ' + url);
    var currentRoute = utils.getCurrentRoute(url, {item_type: item_type, path: path});
    //console.log(path);
    //console.log(currentRoute)
    //var route_ids = [];
    //route_ids.push({slug: 'test'});
    // if (Object.keys(currentRoute.route_ids).length) {
    //   for(var routeIdKey in currentRoute.route_ids) {
    //     var routeId = currentRoute.route_ids[routeIdKey];
    // //     //route_ids.push({[routeIdKey]: routeId});
    //     console.log(routeIdKey);
    //   }
    // }
    //route_ids.push({'slug': 'jdjdjdjdjdddf'});
    //console.log(route_ids[0].slug);
    //console.log('path: ' + path);
    //console.log('path: ' + currentRoute.path);
    //console.log('route: ' + utils.getCurrentRoute(url).path);
    //console.log(currentRoute.item_type);
    
    if(currentRoute && currentRoute.path === path && currentRoute.item_type === item_type && currentRoute.type === 'collection') {
      //return '_output += "Jippi! En route matchades!";\n';
      var val = [].shift();
      var key = '__k';
      return [ 
        '(function() {\n',
        '   var obje = {routeIds: "'+ currentRoute.route_ids +'"};\n',
        '  _utils.each(obje, function (' + val + ', ' + key + ') {\n',
        '    if("' + Object.keys(currentRoute.ids).length + ' === 1") { ' + Object.keys(currentRoute.ids)[0] + ' = "' + currentRoute.ids[Object.keys(currentRoute.ids)[0]] + '"};\n',
        '    if("' + Object.keys(currentRoute.ids).length + ' === 2") {' + Object.keys(currentRoute.ids)[1] + ' = "' + currentRoute.ids[Object.keys(currentRoute.ids)[1]] + '"};\n',
        '    if("' + Object.keys(currentRoute.ids).length + ' === 3") {' + Object.keys(currentRoute.ids)[2] + ' = "' + currentRoute.ids[Object.keys(currentRoute.ids)[2]] + '"};\n',
        '    if("' + Object.keys(currentRoute.ids).length + ' === 4") {' + Object.keys(currentRoute.ids)[3] + ' = "' + currentRoute.ids[Object.keys(currentRoute.ids)[3]] + '"};\n',
        '    if("' + Object.keys(currentRoute.ids).length + ' === 5") {' + Object.keys(currentRoute.ids)[4] + ' = "' + currentRoute.ids[Object.keys(currentRoute.ids)[4]] + '"};\n',
        //'    for (var i = 0; i < "' + route_ids.length + '"; i++) {;\n',
        //'     slug = "' + route_ids[0].slug + '";\n',
        //'    };\n',
        '    ' + compiler(content, parents, options, blockName),
        '    if("' + Object.keys(currentRoute.ids).length + ' === 1") {' + Object.keys(currentRoute.ids)[0] + ' = null};\n',
        '    if("' + Object.keys(currentRoute.ids).length + ' === 2") {' + Object.keys(currentRoute.ids)[1] + ' = null};\n',
        '    if("' + Object.keys(currentRoute.ids).length + ' === 3") {' + Object.keys(currentRoute.ids)[2] + ' = null};\n',
        '    if("' + Object.keys(currentRoute.ids).length + ' === 4") {' + Object.keys(currentRoute.ids)[3] + ' = null};\n',
        '    if("' + Object.keys(currentRoute.ids).length + ' === 5") {' + Object.keys(currentRoute.ids)[4] + ' = null};\n',
        '  });\n',
        '})();\n'
      ].join('');
    } else {
      //return '_output += "Ingen route matchades";\n';
    }
  }
  //console.log(swig.render(args[2] +'-t'));
  //console.log(swig.compile(args[2] +'-t'));
  //var path = args[0].replace(/'/, '').replace(/'/, '');
  //var url = args[1].replace(/'/, '').replace(/'/, '');
  //console.log('compiler', swig.render('{{routes}}'))
  //console.log('compiler', parents)
  //options.valuee = 'gaga';
  //content[1]['valuee'] = function(){return 'adf'};
  
  //console.log(args);
  //if (path === '/blogg') {
    //return compiler(content, parents, options, blockName) + '\n';
  //}
  // if (path === '/blogs') {
  //   return '_output += "fallback";\n';
  // } 

  // var val = args.shift(),
  //   key = '__k',
  //   ctxloopcache = (ctx + '__loopcache' + Math.random()).replace(/\./g, ''),
  //   last;

  // if (args[0] && args[0] === ',') {
  //   args.shift();
  //   key = val;
  //   val = args.shift();
  // }

  //last = args.join('');
  // console.log(ctx);
  //var val = '1';
  //   ctxloopcache = (ctx + '__loopcache' + Math.random()).replace(/\./g, ''),
  //   last;

  // if (args[0] && args[0] === ',') {
  //   args.shift();
  //   key = val;
  //   val = args.shift();
  // }

  // last = args.join(''); 
  
  // return [
  //   '(function () {\n',
  //   '  var __l = ' + last + ', __len = (_utils.isArray(__l) || typeof __l === "string") ? __l.length : _utils.keys(__l).length;\n',
  //   '  if (!__l) { return; }\n',
  //   '    var ' + ctxloopcache + ' = { loop: ' + ctxloop + ', ' + val + ': ' + ctx + val + ', ' + key + ': ' + ctx + key + ' };\n',
  //   '    ' + ctxloop + ' = { first: false, index: 1, index0: 0, revindex: __len, revindex0: __len - 1, length: __len, last: false };\n',
  //   '  _utils.each(__l, function (' + val + ', ' + key + ') {\n',
  //   '    ' + ctx + val + ' = ' + val + ';\n',
  //   '    ' + ctx + key + ' = ' + key + ';\n',
  //   '    ' + ctxloop + '.key = ' + key + ';\n',
  //   '    ' + ctxloop + '.first = (' + ctxloop + '.index0 === 0);\n',
  //   '    ' + ctxloop + '.last = (' + ctxloop + '.revindex0 === 0);\n',
  //   '    ' + compiler(content, parents, options, blockName),
  //   '    ' + ctxloop + '.index += 1; ' + ctxloop + '.index0 += 1; ' + ctxloop + '.revindex -= 1; ' + ctxloop + '.revindex0 -= 1;\n',
  //   '  });\n',
  //   '  ' + ctxloop + ' = ' + ctxloopcache + '.loop;\n',
  //   '  ' + ctx + val + ' = ' + ctxloopcache + '.' + val + ';\n',
  //   '  ' + ctx + key + ' = ' + ctxloopcache + '.' + key + ';\n',
  //   '  ' + ctxloopcache + ' = undefined;\n',
  //   '})();\n'
  // ].join('');
}
swig.setTag('get', parser, compiler, true);
//swig.setExtension('translate', hehe);