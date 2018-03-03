'use strict'
var Musci;
    Musci={
    //存储获取到歌曲列表项
    data:null,
    //歌单
    arr:[['新歌榜',1],['热歌榜',2],['摇滚榜',11],['爵士',12],['流行',16],['欧美金曲榜',21],['经典老歌榜',22],['情歌对唱榜',23],['影视金曲榜',24],['网络歌曲榜',25]],
    //用于musicList判断更新还是加载
    update:false,
    //当前显示出的歌曲列表项数目,用于判断是否自动加载歌曲列表，并且判断在第一首歌曲使用left时跳到最后一首
    n:0,
    //当前播放的是那一首歌曲
    index:0,
    //当前歌单类型，用于判断是否是相同歌单
    type:1,
    //组件初始位置X
    offsetX:0,
    //组件初始位置Y
    offsetY:0,
    //用于保存歌词
    musicLyric:null,
    //用于自动播放
    autoplay:true,
    //获取歌曲信息，获取播放地址，获取歌词
    getlist:function(url,callback){ 
        var fun=callback; 
        var obj=this; 
        $.ajax({
            url:'http://tingapi.ting.baidu.com/v1/restserver/ting?'+url,
            method:'GET',
            dataType:'jsonp',
            jsonp:'callback',
            success:function(data){  
                fun(data,obj);
            },

            error:function(){
                obj.err()
            }
        });
    },
    active:function(type=1){ //启动函数
        this.getlist('method=baidu.ting.billboard.billList&type='+type+'&size=100&offset=0',this.musicList);
        //其中size值获取列表数量，offset则是偏移
    },
    //歌曲列表初始化处理
    musicList:function(data,obj){ 
        obj.data=data;
        var data=data.song_list;

        if(obj.update){
            $('#musicName ul').empty();
            obj.n=0;
            obj.update=false;
            obj.index=0;
        }if($('#musicName ul').length===0){
            var ul=$('<ul></ul>');
            $('#musicName').append(ul);
        }
        try{                            
            for(var i=0;i<10;i++){
                var li=$('<li></li>');
                li.html(data[obj.n].title);
                li.attr('id',data[obj.n].song_id)
                li.index=obj.n;
                $('#musicName ul').append(li);
                obj.n+=1;
            }
        }catch(e){
            $('#prompt').css('display','inline');
            $('#musicDown').unbind('click')
        }
       obj.event()
       if(obj.autoplay){
           obj.loop();
           obj.autoplay=null;
       }
    },
    //事件处理
    event:function(){
         var obj=this;
         $('#musicTitle').on('mouseenter',function(){
             $('#musicPlay').fadeIn(300);
         })
         $('#musicTitle').on('mouseleave',function(){
            $('#musicPlay').fadeOut(300)
        })
        $('#musiclistShow').unbind('click').on('click',function(){
            $('#musicList').slideToggle(200);
        });
        $('#musiclyrirShow').unbind('click').on('click',function(){
            $('#musicLyric').slideToggle(200);
        });
        $('#musicName ul').on('dblclick',function(ev){
            var ev = ev || window.event;
            var target = ev.target || ev.srcElement;
            if(target.nodeName.toLowerCase()==='li'){
                obj.index=$(target).index()
                obj.loop();
            } 
        })
        $('#audio').unbind('ended').on('ended',function(){
             obj.loop(true);
        })
        $('#audio').unbind('timeupdate').on('timeupdate',function(){
            var t=this.currentTime
            obj.musicLyric.forEach(function(v,i,a){
                if(v[0]<=t){
                  $('#musicLyric').html(v[1]);
                }
            })

       })
        $('#pause').unbind('click').on('click',function(){
            var audio = document.getElementById('audio');
            if(audio.paused){
                this.id='pause';
                audio.play();
                return false;
            }else{
                this.id='play';
                audio.pause();
                return false;
            }
        })
        $('#left').unbind("click").on('click',function(){
            obj.loop(true);
        })
        $('#right').unbind("click").on('click',function(){
            obj.loop(false);
        })
        $('#musicDown').on('click',function(){
            obj.musicList(obj.data,obj)
        })
        $('#musicTypeNmae ul').on('click',function(ev){
            var ev = ev || window.event;
            var target = ev.target || ev.srcElement;
            if(target.nodeName.toLowerCase()==='li'){
            var text=target.innerText;
            $('#musicType span').text(text);
            obj.arr.forEach(function(value){
                if(value[0]===text){
                    if(obj.type!==value[1]){
                        console.log(obj.type)
                        obj.type=value[1];
                        $('#prompt').css('display','none')
                        obj.update=true;
                        obj.active(obj.type);
                    }
                }
            })
          }
        })
       var music=document.getElementById('music');
       music.ondragstart=function(e){  
            obj.offsetX= e.offsetX;  
            obj.offsetY= e.offsetY;  
        }  
        music.ondrag=function(e){  
            var x= e.pageX;  
            var y= e.pageY;  
            if(x==0 && y==0){  
                return; 
            }  
            x-=obj.offsetX;  
            y-=obj.offsetY;  
            music.style.left=x+'px';  
            music.style.top=y+'px';  
        }
    },
     //播放处理
   play:function(data,obj){
     var link=data.bitrate.file_link;
     $('#audio').attr('src',link);
     obj.img(data,obj);
     obj.title(data,obj);
        
   },
    //歌词分析
   lryResolve:function(data,obj){
     var reg=/\[\d{2}\:\d{2}\.\d+\]+[a-zA-Z|：|\s|\u4e00-\u9fa5]+/g;
     console.log(data)
     var time=/\[[\d:\.]+\]/g;
     try{
        obj.musicLyric=data.lrcContent.match(reg);
        console.log(data.lrcContent)
        obj.musicLyric.forEach(function(v,i,a){
            var t=v.match(time);
            var c=v.replace(time,'');
            t.forEach(function(value,index,array){
                var cut=value.slice(2,-1).split(':');
                a[i]=([cut[0]*60+Number.parseFloat(cut[1]),c])
            })
        })
     }catch(e){
        $('musicLyric').html('获取不到歌词');
     }
   },
    //图片加载
   img:function(data,obj){
      var ximg=data.songinfo.pic_big;
      $('#musicImg').css('background-image','url('+ximg+')')
   },
    //歌名加载
   title:function(data,obj){
    var title=data.songinfo.title;
    $('#musicTitle div:first-child').html(title)
   },
    //循环播放，歌曲切换，以及歌词获取
   loop:function(value){
        var obj=this;
        if(value !== undefined){
            obj.index +=value ? 1 : -1;
            if(obj.index===obj.n){
                obj.musicList(obj.data,obj); 
              }
          }if(obj.index < 0){
            obj.index=obj.n-1;
        }
        var li=$('#musicName ul li');
        try{
            obj.getlist('method=baidu.ting.song.play&songid='+li[obj.index].id,obj.play);
        }catch(e){
            obj.getlist('method=baidu.ting.song.play&songid='+li[0].id,obj.play);
            obj.index=0;
        }
        li.removeClass('play');
        li[obj.index].className='play';
        obj.getlist('method=baidu.ting.song.lry&songid='+li[obj.index].id,obj.lryResolve);
        $('#musicLyric').html('稍等歌词正在卖力加载');
   },
   //ajax失败处理
   err:function(){
       $('#musicError').css('display','inline');
   },

}

var a=Object.create(Musci);
a.active()

