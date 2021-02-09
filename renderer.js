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

let appendFolder = function(files){
    let base = app.comicTitles[comicCount]['ospath'] + '\\';
    let folderList = [];
    for(let i = 0; i < files.length; i++){
        // app.comicTitles[comicCount]['chapters'].push(files[i]);
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

let sortByIndex = function(a, b){
    if(a.length < b.length){
        return a < b;
    }
    else{
        return (parseInt(a) < parseInt(b));
    }
}

let sortByHash = function(Names){
    let id_name = {};
    let res = [];
    for(let i = 0; i < Names.length; i++){
        let name = Names[i];
        let mynum = parseInt(name);
        id_name[mynum] = name;
    }
    for(let i = 0; i < Names.length; i++){
        res.push(id_name[i + 1]);
    }
    return res;
}


let app = new Vue({
    el:'#app',
    data:{
        comicTitles:[],
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
                // for(let i = 0; i < files.length; i++){
                //     app.comicFolders.push(files[i]);
                // }
            })
        },
        sortByTime:function(index, sorted){
            if(sorted){
                return ;
            }
            app.comicTitles[index]['chapters'].sort((a, b)=>{return a.time - b.time;});
            app.comicTitles[index]['sorted'] = true;
            console.log('sorted');
        },
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
            comicPaths = sortByHash(comicPaths);
            app.setCurrentComic(chapterPath, comicPaths);


        },
        setCurrentComic:function(chapterPath, comicFileNames){
            app.currentComics = [];
            for(let i = 0; i < comicFileNames.length; i++){
                app.currentComics.push({path:chapterPath + '\\' + comicFileNames[i], isactive:false});
            }
            app.currentComics[0].isactive = true;
        }
    }
})