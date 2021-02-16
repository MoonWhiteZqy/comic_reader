const fs = require('fs')
let Vue = require('./vue.js')
const {ipcRenderer} = require('electron');
const { time } = require('console');


let comicCount = 0;
let oldChapterId = undefined;
let curComic = 0;
let curChapter = 0;
let curPage = 0;
let comic_chosen = 0;

// 初始化css
initMyUI = function(){
    let leftPx = 200;
    $('.comic_content').offset({left:leftPx});
    $('.comic_list').width(leftPx);
    $('#division_table_w').offset({left:leftPx - 3});
}

initData = function(){
    initMyUI();
    let app_used = true;
    if(localStorage.length < 2){
        localStorage.setItem('comics', JSON.stringify({}));
        localStorage.setItem('lastdata', JSON.stringify({
            comic_id:0,
            chapter_id:0,
            page_id:0
        }));
    }
    let books = JSON.parse(localStorage['comics']);
    let last_data = JSON.parse(localStorage['lastdata']);
    for(let key in books){
        app.openBaseFolder(books[key]);
    }
    // 读取上次阅读信息
    curComic = last_data['comic_id'];
    curChapter = last_data['chapter_id'];
    curPage = last_data['page_id'];
    if(curComic + curChapter + curPage === 0){
        app_used = false;
    }
    if(app_used){
        app.readChapter(curComic, curChapter);
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
        stopSlide(1);
    }
    else if(message === 'Left'){
        stopSlide(-1);
    }
    else{
        console.error('Unknown message by control');
    }
})

let save_read = function(){
    let final_data = {
        comic_id:curComic,
        chapter_id:curChapter,
        page_id:curPage
    };
    localStorage['lastdata'] = JSON.stringify(final_data);
}

ipcRenderer.on('close-window', (event, message)=>{
    save_read();
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
    app.readChapter(curComic, newChapter, nextChapterId);
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
        curPage = -1;
        changeChapter(-1);
        return ;
    }
    // 进入下一章节
    else if(i + next > app.currentComics.length - 1){
        curPage = 0;
        changeChapter(1);
        return ;
    }
    app.currentComics[i].isactive = false;
    app.currentComics[i + next].isactive = true;
    curPage = i + next;
    $('#comic_sceen').scrollTop(0);
    document.getElementById('focus_button').focus();
}

// 添加左侧的漫画章节文件夹
let appendFolder = function(files){
    // 基础文件夹路径
    let base = app.comicTitles[comicCount]['ospath'] + '\\';
    let folderList = [];
    for(let i = 0; i < files.length; i++){
        // fs.stat(base + files[i], function(err, data){
        //     if(err){
        //         console.log(err);
        //     }
        //     folderList.push({
        //         name:files[i],
        //         time:data.birthtimeMs
        //     })
        // })
        let filedata = fs.statSync(base + files[i]);
        folderList.push({
            name:files[i],
            time:filedata.birthtimeMs
        })
    }
    folderList.sort((a, b)=>{return a.time - b.time;});
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
            try{
                // 同步打开文件夹,避免异步等待失败
                let file_list = fs.readdirSync(path);
                appendFolder(file_list);
                comicCount++;
            }
            catch{
                // 文件夹不存在或是其他原因，删除当前记录
                delete logComics[comicName];
                app.comicTitles.pop();
                localStorage['comics'] = JSON.stringify(logComics);
                return console.error('文件夹打开失败');
            }
            // fs.readdir(path, function(err, filedirs){
            //     if(err){
            //         // 打开文件夹失败，删除记录
            //         delete logComics[comicName];
            //         app.comicTitles.pop();
            //         localStorage['comics'] = JSON.stringify(logComics);
            //         return console.error(err);
            //     }
            //     appendFolder(filedirs);
            //     app.comicTitles[comicCount]['chapters'].sort(function(a,b){return a.time - b.time;})
            //     comicCount++;
            // })
        },
        // 按照创建时间对章节名进行排序，似乎会有异步问题出现导致sort失效
        sortByTime:function(index){
            // app.comicTitles[index]['chapters'].sort((a, b)=>{return a.time - b.time;});
        },
        // 读取章节文件夹里的jpg名称，用于填充漫画src
        readChapter:function(titleIndex, chapterIndex){
            // 存储文件的名字
            let comicPaths = [];
            // 找到当前漫画的基础信息
            let baseInfo = app.comicTitles[titleIndex];
            let chapterPath = baseInfo.ospath + '\\' + baseInfo.chapters[chapterIndex].name;
            // 获取即将成为焦点的章节id
            let curChapterId = 'comic' + titleIndex + '_' + chapterIndex;
            curComic = titleIndex;
            curChapter = chapterIndex;
            comicPaths = fs.readdirSync(chapterPath);
            changeFocus(curChapterId);
            comicPaths.sort(sortByIndex);
            if(curPage === -1){
                curPage = comicPaths.length - 1;
            }
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
            app.currentComics[curPage].isactive = true;
        }
    }
})

initData();