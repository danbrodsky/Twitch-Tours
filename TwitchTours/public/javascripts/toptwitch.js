// var frequency = 35;
// var sample = 50;
// var vod = '163912718';
// var message = "LUL";

// require(['javascripts/moment','javascripts/hyperquest','javascripts/overrustle-logs','child_process'], function(moment,hyperquest,logs,child_process){
var getClip = function(vod,message,frequency,sample,callback0){
var moment = require('moment');
var logs = require('overrustle-logs');
var https = require('https');
var child_process = require('child_process');

var timestamps = [];
var vidtimes = [];

var frequency = parseInt(frequency);
var sample = parseInt(sample);

var loops = 1;
var count = 0;

var options = {
  host: 'api.twitch.tv',
  path: '/kraken/videos/' + vod,
  headers: {'Client-Id' :'dkxbzceldq37fv52ddo25g3z4bxdb3'}
};

callback = function(response) {
  var str = '';

  //another chunk of data has been recieved, so append it to `str`
  response.on('data', function (chunk) {
    str += chunk;
  });

  //the whole response has been recieved, so we just print it out here
  response.on('end', function () {
  	try {
    	var pstr = JSON.parse(str);
    	var channel = pstr["channel"].name
    	var created_at = pstr["created_at"];
    	var recorded_at = pstr["recorded_at"];
    	var vidlength = pstr['length'];
    	var date = recorded_at.substr(0, recorded_at.indexOf('T'));
	
		var start_time = recorded_at.substr(recorded_at.indexOf('T'),recorded_at.length);
		var vod_date = new Date(date + start_time);
	
		start_time_hms = start_time.replace(/[a-zA-Z]/g,'');
    	var a = start_time_hms.split(':'); // split it at the colons
		// minutes are worth 60 seconds. Hours are worth 60 minutes.
		var start_sec = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]); 
		
		var s = new Date(date + start_time);
    	if (start_sec + vidlength > 86400){
    		// run over 2 days
    		var d = new Date(date);
    		d.setDate(d.getDate() + 1);
    		d = d.toJSON();
    		var date_1 = d.substr(0, d.indexOf('T'));
    		loops = 2;
    		
    		findTimes(channel,start_time,vidlength,date_1, vod_date);
    	}
    	
    	findTimes(channel,start_time,vidlength,date, vod_date);
    	}
    catch(err){
	callback0("vod not found");
    }

});
}
	

	function findTimes(channel, start_time, vidlength, date, vod_date){
		var chatlogs = {info: [] };
		var i = 0;
		logs({
		
			channel: channel,
		
			date: date
		
			}).on('data', function(data) {
		
		    chatlogs.info.push({ 
		        "timestamp" : data.timestamp,
		        "user"  : data.user,
		        "message"  : data.message 
		    });
		}).on('end', function(){
			i = 0;
			while (chatlogs.info[i] != undefined){
				if (chatlogs.info[i]['message'].includes(message)){
					
					j = 0;
					c = 0;
					while (j < sample && chatlogs.info[i+j] != undefined){
						if (chatlogs.info[i+j]['message'].includes(message)){
							c++;
						}
						j++;
					}
					if (c >= frequency){
						
						timestamps.push(chatlogs.info[i]['timestamp']);
						i += sample;
					}
				}
				i++;
			}
			getVODTimes(timestamps,start_time,vidlength,date, vod_date);
			timestamps = [];
	
	    });
	}

	function getVODTimes(timestamps,start_time,vidlength,date, vod_date){
	   	for (t in timestamps) {
	   	var d = new Date(timestamps[t]);
	   	var vt = (d - vod_date) / 1000;
	   	if (vt < vidlength && vt > 0)
	   		vidtimes.push(vt);
	   }
	   
	   count +=1;
	   if (count==loops){
	   	vidtimes.sort(function(a, b){return a-b});
	   	callback0(vidtimes);
	   		// for (v=0; v<vidtimes.length;v++){
	   // 			var v = 0;
	   // 			
  		// 		child_process.exec('python ./public/javascripts/twitch_vod_clipper.py' + ' ' + vod.toString() + ' ' + (vidtimes[v] - 10).toString() + ' ' + (vidtimes[v] + 10).toString(), function (err){
    // 				if (err) {
    // 					
    // 					
  		// 			}
				// });
  			// }
  		}
  	}

https.request(options,callback).end();
// });
};

module.exports = getClip;