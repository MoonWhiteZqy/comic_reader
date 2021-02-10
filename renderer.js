const fs = require('fs')
let Vue = require('./vue.js')
const {ipcRenderer} = require('electron')
// console.log(fs)
// read_file = function(){
//     fs.readdir('D:/文件/漫画/镇魂街', function(err, files){
//         if(err){
//             return console.error(err);
//         }
//         files.forEach(function(file){
//             console.log(file);
//         })
//     })
// }

// 初始化css
initMyUI = function(){
    let leftPx = 160;
    $('.comic_content').offset({left:leftPx + 5});
    $('.comic_list').width(leftPx);
    $('#division_table_w').offset({left:leftPx - 3});
}

initMyUI();

// 打开文件夹窗口功能
read_file = function(){
    ipcRenderer.send('open-directory-dialog', 'openDirectory');
    ipcRenderer.once('selectedItem', function(event, path){
        if(path.length > 0){
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

// 用于控制轮播组件的内容,next：前进往下为1，后退为-1
let stopSlide = function(next){
    $('#comic_slide').carousel('pause');
    let i;
    // 找到当前激活的漫画位置
    for(i = 0; i < app.currentComics.length; i++){
        if(app.currentComics[i].isactive){
            break;
        }
    }
    if(i + next < 0 || i + next > app.currentComics.length - 1){
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

let comicCount = 0;
let e;

// 对文件名排序，返回结果不是0、1而是正负数
let sortByIndex = function(a, b){
    return parseInt(a) - parseInt(b);
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
            this.comicTitles.push({
                name:getLastName(path),
                index:comicCount,
                space:"",
                ospath:path,
                chapters:[],
                sorted:false
            });
            fs.readdir(path, function(err, filedirs){
                if(err){
                    return console.error(err);
                }
                appendFolder(filedirs);
                app.comicTitles[comicCount]['chapters'].sort(function(a,b){return a.time - b.time;})
                comicCount++;
            })
        },
        // 按照创建时间对章节名进行排序，似乎会有异步问题出现导致sort失效
        sortByTime:function(index, sorted){
            if(sorted){
                return ;
            }
            app.comicTitles[index]['chapters'].sort((a, b)=>{return a.time - b.time;});
            app.comicTitles[index]['sorted'] = true;
        },
        // 读取章节文件夹里的jpg名称，用于填充漫画src
        readChapter:function(chapterPath, isdir){
            let comicPaths = [];
            if(!isdir){
                console.log('不是文件夹,打开失败');
                return ;
            }
            comicPaths = fs.readdirSync(chapterPath);
            comicPaths.sort((a, b)=>{
                let a_num = parseInt(a);
                let b_num = parseInt(b);
                return a_num < b_num; 
            })
            comicPaths.sort(sortByIndex);
            app.setCurrentComic(chapterPath, comicPaths);
        },
        setCurrentComic:function(chapterPath, comicFileNames){
            app.currentComics = [];
            for(let i = 0; i < comicFileNames.length; i++){
                // 需要在添加时确定active属性，用于适配bootsreap的轮播组件
                app.currentComics.push({path:chapterPath + '\\' + comicFileNames[i], isactive:false});
            }
            // 默认第一张漫画为起始
            app.currentComics[0].isactive = true;
        }
    }
})