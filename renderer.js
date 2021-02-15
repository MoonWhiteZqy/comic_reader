const fs = require('fs')
let Vue = require('./vue.js')
const {ipcRenderer} = require('electron');


let comicCount = 0;
let oldChapterId = undefined;
let curComic = 0;
let curChapter = 0;
let comic_chosen = 0;
let just_slide = 0;

// 初始化css
initMyUI = function(){
    let leftPx = 200;
    $('.comic_content').offset({left:leftPx});
    $('.comic_list').width(leftPx);
    $('#division_table_w').offset({left:leftPx - 3});
}

initData = function(){
    initMyUI();
    if(localStorage.length === 0){
        localStorage.setItem('comics', JSON.stringify({}));
    }
    let books = JSON.parse(localStorage['comics']);
    for(let key in books){
        app.openBaseFolder(books[key]);
    }
}

// 注册键盘事件,进行选中图片的切换
ipcRenderer.on('control', (event, message)=>{
    if(comic_chosen === 0){
        console.log('No comic chosen')
        return ;
    }
    // 进行页面切换
    if(message === 'Right'){
        just_slide = 0;
        stopSlide(1);
    }
    else if(message === 'Left'){
        just_slide = 1;
        stopSlide(-1);
    }
    else{
        console.error('Unknown message by control');
    }
})


// 打开文件夹窗口功能
read_file = function(){
    ipcRenderer.send('open-directory-dialog', 'openDirectory');
    ipcRenderer.once('selectedItem', function(event, path){
        if(path.length > 0){
            let i;
            for(i = 0; i < app.comicTitles.length; i++){
                if(app.comicTitles[i].ospath == path[0]){
                    $('#errToast').toast('show');
                    return ;
                }
            }
            app.openBaseFolder(path[0]);
        }
        else{
            console.log('not dir chosen');
        }
    });
}

// 获取文件夹的最后名称
let getLastName = function(name){
    let begin = 0;
    // 记录最后的文件分隔符所在位置
    for(let i = 0; i < name.length; i++){
        if(name[i] == '\\'){
            begin = i;
        }
    }
    if(begin == 0){
        return name;
    }
    let resName = '';
    for(let i = begin + 1; i < name.length; i++){
        resName += name[i];
    }
    return resName;
}

// 进行章节切换
let changeChapter = function(direction){
    let baseComic = app.comicTitles[curComic];
    let newChapter = curChapter + direction;
    // 防止超出章节限制
    if(newChapter < 0 || newChapter >= baseComic.chapters.length){
        return ;
    }
    let nextChapterId = 'comic' + baseComic.index + '_' + newChapter;
    // 模拟章节的选择
    app.readChapter(curComic, newChapter, baseComic.chapters[newChapter].isdir, nextChapterId);
}

// 用于控制轮播组件的内容，进行内容切换,next为1，prev为-1
let stopSlide = function(next){
    $('#comic_slide').carousel('pause');
    let i;
    // 找到当前激活的漫画位置
    for(i = 0; i < app.currentComics.length; i++){
        if(app.currentComics[i].isactive){
            break;
        }
    }
    // 上一页到头，进入上一章节
    if(i + next < 0){
        changeChapter(-1);
        return ;
    }
    // 进入下一章节
    else if(i + next > app.currentComics.length - 1){
        changeChapter(1);
        return ;
    }
    app.currentComics[i].isactive = false;
    app.currentComics[i + next].isactive = true;
}

// 添加左侧的漫画章节文件夹
let appendFolder = function(files){
    // 基础文件夹路径
    let base = app.comicTitles[comicCount]['ospath'] + '\\';
    let folderList = [];
    for(let i = 0; i < files.length; i++){
        fs.stat(base + files[i], function(err, data){
            if(err){
                console.log(err);
            }
            folderList.push({
                name:files[i],
                time:data.birthtimeMs,
                isdir:data.isDirectory()
            })
        })
    }
    app.comicTitles[comicCount]['chapters'] = folderList;
}


// 对文件名排序，返回结果不是0、1而是正负数
let sortByIndex = function(a, b){
    return parseInt(a) - parseInt(b);
}


// 改变当前选取的漫画文件夹焦点
let changeFocus = function(chapterId){
    if(oldChapterId === undefined){
        
    }
    else{
        $('#' + oldChapterId).css('background-color', '#f3f3f3');
    }
    oldChapterId = chapterId;
    $('#' + chapterId).css('background-color', '#e4e6f1');
}

let app = new Vue({
    el:'#app',
    data:{
        // 存储打开漫画的整体信息，包括名称、章节等等
        comicTitles:[],
        // 展示漫画的src来源
        currentComics:[]
    },
    methods:{
        openBaseFolder:function(path){
            let comicName = getLastName(path)
            // 读取存储在本地的记录
            let logComics = JSON.parse(localStorage['comics']);
            this.comicTitles.push({
                name:comicName,
                index:comicCount,
                ospath:path,
                chapters:[]
            });
            logComics[comicName] = path;
            localStorage['comics'] = JSON.stringify(logComics);
            fs.readdir(path, function(err, filedirs){
                if(err){
                    // 打开文件夹失败，删除记录
                    delete logComics[comicName];
                    app.comicTitles.pop();
                    localStorage['comics'] = JSON.stringify(logComics);
                    return console.error(err);
                }
                appendFolder(filedirs);
                app.comicTitles[comicCount]['chapters'].sort(function(a,b){return a.time - b.time;})
                comicCount++;
            })
        },
        // 按照创建时间对章节名进行排序，似乎会有异步问题出现导致sort失效
        sortByTime:function(index){
            app.comicTitles[index]['chapters'].sort((a, b)=>{return a.time - b.time;});
        },
        // 读取章节文件夹里的jpg名称，用于填充漫画src
        readChapter:function(titleIndex, chapterIndex, isdir, curChapterId){
            // 存储文件的名字
            let comicPaths = [];
            // 找到当前漫画的基础信息
            let baseInfo = app.comicTitles[titleIndex];
            let chapterPath = baseInfo.ospath + '\\' + baseInfo.chapters[chapterIndex].name;
            curComic = titleIndex;
            curChapter = chapterIndex;
            if(!isdir){
                console.log('不是文件夹,打开失败');
                return ;
            }
            comicPaths = fs.readdirSync(chapterPath);
            changeFocus(curChapterId)
            comicPaths.sort(sortByIndex);
            app.setCurrentComic(chapterPath, comicPaths);
            $('#web_title').text('正在阅读:' + baseInfo.name);
            comic_chosen = 1;
        },
        setCurrentComic:function(chapterPath, comicFileNames){
            app.currentComics = [];
            let comic_len = comicFileNames.length
            for(let i = 0; i < comic_len; i++){
                // 需要在添加时确定active属性，用于适配bootsreap的轮播组件
                app.currentComics.push({path:chapterPath + '\\' + comicFileNames[i], isactive:false});
            }
            // 默认第一张漫画为起始
            if(just_slide === 1){
                app.currentComics[comic_len - 1].isactive = true;
            }
            else{
                app.currentComics[0].isactive = true;
            }
        }
    }
})

initData();