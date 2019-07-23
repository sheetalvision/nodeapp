const express = require('express');
var app = express();
//app.use(SocketIOFileUpload.router);
//var evh = require('vhost');
/*
var config = require('./visionchat.json');
var domain='domain';

for(var d=0; d<config.length;d++){
	try{
		app.use(evh(config[d].domain+''+d,require(''+config[d].module+'')(app,__dirname+'/'+config[d].domain)));
	}catch(e){
		console.log('===='+e);
	}
}
*/

const chatServer = require('http').createServer(app);
const server=chatServer.listen(3000);

const io = require('socket.io')(chatServer);
//io.set('transports', ['websocket']); 

io.use((socket, next) => {
 let token = socket.handshake.query.username;
 let usertype = socket.handshake.query.usertype;
  if (token && usertype) {
    return next();
  }
  return next(new Error('authentication error'));
});

var socketCount = 0
global.users = [];
global.chatarray = [];
io.on('connection', function(client) {
	let token = client.handshake.query.username;
	let usertype = client.handshake.query.usertype;
	let domainid = client.handshake.query.domainid;
	client.username = token;
	client.usertype =usertype;
	client.domainid= domainid;
	client.uid=token+domainid;
	client.utype=usertype+domainid;
	client.join(client.username);
	client.join(client.usertype);
	client.join(client.domainid);
	client.join(client.uid);
	client.join(client.utype);

// var uploader = new SocketIOFileUpload();
// uploader.dir = '/var/www/html/visionfiles/';
// uploader.listen(client);
 
//    uploader.on("saved", function(event){
 //       console.log(event.file);
  //  });
 
//    uploader.on("error", function(event){
//        console.log("Error from uploader", event);
//    });

    client.on('newclient', function(data) {
		var flg=0;
        for (var i = 0; i < users.length; i++){
			if (users[i].usertype==data.usertype && users[i].domainid==data.domainid && users[i].name==token) {
				flg=1;
				break;
			}
	    }
        if(flg==0){
			users.push({
				id: client.id,
				name: token,
				usertype:data.usertype,
				domainid:domainid
			});
            io.sockets.in('staff'+client.domainid).emit('is_online', {id:client.id,name:client.username,domainid:client.domainid});
       	}
    });

    client.on('username', function(data) {
		var flg=0;
		for (var i = 0; i < users.length; i++)
            if (users[i].usertype==data.usertype && users[i].domainid==data.domainid && users[i].name==token) {
				flg=1;
				break;
			}
		if(flg==0){
	        users.push({
				id: client.id,
				name: token,
				usertype:data.usertype,
				domainid:domainid
			});
		}
		var myclients=[];
		for(var i=0; i<users.length; i++){
			if(users[i].domainid==data.domainid && users[i].usertype=='client')
				myclients.push(users[i]);
		}
		io.sockets.in(token+domainid).emit('all_online',myclients);
    });
    client.on('disconnect', function(username) {
		io.emit('is_offline', {id:client.id,name:client.username,domainid:client.domainid});
        var clientid = client.id;
		for (var i = 0; i < users.length; i++)
		  if(users[i].id && users[i].id == clientid && users[i].domainid==client.domainid) {
			users.splice(i, 1);
			break;
		  }
		client.leave(client.username);
		client.leave(client.usertype);
		client.leave(client.domainid);
		client.leave(client.uid);
		client.leave(client.utype);


    })
    client.on('show_message', function(data) {
		io.sockets.in(data.user+data.domainid).emit('show_message', data.msg);
	});
	client.on('msgsent',function(data){
var type='';
if(data.type !== undefined)
type='file';
		io.sockets.in(data.user+data.domainid).emit('chat_message', {from:data.from,msg:data.msg,to:data.user,id:data.id,domainid:data.domainid,type:type});
		io.sockets.in(data.from+data.domainid).emit('chat_message', {from:data.from,msg:data.msg,to:data.from,id:data.id,domainid:data.domainid,type:type});
	});
		
	client.on('typing', (data) => {
//		io.emit("typing", data)
	});
	client.on('stoptyping', (data) => {
//		io.emit("stoptyping", data)
	});
	client.on('initial_chat',function(data){
		 //chatarray.push(data.chatid);
	});
	client.on('addto_chat',function(data){
		/*console.log(data);
		if(chatarray[data.chatid]===undefined){
				chatarray.push(data.chatid);
		}
		chatarray[data.chatid]['messages'].push(data.msg);*/

		
	});
	client.on('connectedto',function(data){
		var flag=0;
		var chatid=data.clientname+'*'+data.staffname+'*'+data.domainid;
		for (var i = 0; i < chatarray.length; i++){
			if (chatarray[i].clientname && chatarray[i].clientname == data.clientname && chatarray[i].domainid==data.domainid) {
				flag=chatarray[i].staffname+'-'+chatarray[i].domainid;
				break;
			}
		}
		if(flag==0){
			chatarray.push({
				chatid: chatid,
				staffname: data.staffname,
				clientname: data.clientname,
				domaiid:data.domainid
			});
			client.chatid = chatid;
			client.join(chatid);
			io.sockets.in(data.clientname+client.domainid).emit('startchat', {id:data.staffid,username:data.staffname,domainid:client.domainid});
			io.sockets.in(data.clientname+client.domainid).emit('chat_message', {from:data.staffname,msg:'Welcome '+data.clientname+'!! I\'m '+data.staffname+'. How may I help you',to:data.clientname,id:data.staffid,domainid:client.domainid});
		}
		else if((data.staffname+'-'+data.domainid)!=flag){
			io.sockets.in(data.staffname+client.domainid).emit('chatstarted',{staffname:flag,domainid:client.domainid});
		}
	});
});
