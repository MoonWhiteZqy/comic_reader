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

// 用于停止轮播组件的自动播放
let stopSlide = function(){
    $('#comic_slide').carousel('pause');
}

let appendFolder = function(files){
    for(let i = 0; i < files.length; i++){
        this.comicFolders.push(files[i]);
    }
}

let app = new Vue({
    el:'#app',
    data:{
        folderTitle:'Hello Vue',
        comicFolders:[]
    },
    methods:{
        openBaseFolder:function(path){
            this.folderTitle = getLastName(path);
            fs.readdir(path, function(err, files){
                if(err){
                    return console.error(err);
                }
                appendFolder.call(app, files);
                // for(let i = 0; i < files.length; i++){
                //     app.comicFolders.push(files[i]);
                // }
            })
        }
    }
})